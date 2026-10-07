#!/usr/bin/env python3
"""
Re-géocodage des offres d'emploi dont le géocode est incomplet ou invalide.

Une offre est corrigée dès lors que l'un de latitude, longitude, lambert93_x,
lambert93_y est NULL, égal à 0, non numérique ou hors de la zone
métropolitaine :
  - WGS84 manquant/invalide : re-géocodage via la Base Adresse Nationale
    (api-adresse.data.gouv.fr) depuis l'adresse de l'offre ;
  - WGS84 valide mais Lambert-93 manquant/incohérent : redérivation directe
    (projection RGF93/Lambert-93, conforme à modules/geo/lambert93.js), sans
    appel réseau.

Usage : ./scripts/regeocode-offers.py [--apply] [--id <n>]
Prérequis : pile démarrée (conteneur `database` qui tourne), Python 3.
Par défaut : rapport seul. --apply écrit en base.
"""

import json
import math
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent

MIN_GEOCODE_SCORE = 0.5
BAN_BASE_URL = "https://api-adresse.data.gouv.fr"
BAN_TIMEOUT_S = 15


def print_help() -> None:
    doc = (__doc__ or "").strip("\n")
    lines = doc.splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    sys.stdout.write("\n".join(lines) + "\n")


def parse_args(argv):
    apply_changes = False
    only_id = ""
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--apply":
            apply_changes = True
        elif arg == "--id":
            if i + 1 >= len(argv):
                sys.exit("Erreur : --id requiert un entier.")
            only_id = argv[i + 1]
            i += 1
        elif arg.startswith("--id="):
            only_id = arg.split("=", 1)[1]
        elif arg in ("-h", "--help"):
            print_help()
            sys.exit(0)
        else:
            sys.exit(f"Option inconnue : {arg}")
        i += 1
    return apply_changes, only_id


def load_env() -> dict:
    env_path = PROJECT_DIR / ".env"
    if not env_path.is_file():
        sys.exit("Erreur : fichier .env introuvable à la racine du projet.")
    env = {}
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


class PsqlError(Exception):
    pass


def run_psql(env: dict, *args) -> str:
    user = env.get("POSTGRES_USER", "geoemploi")
    db = env.get("POSTGRES_DB", "geoemploi")
    cmd = [
        "docker", "compose", "exec", "-T", "database", "psql",
        "-U", user,
        "-d", db,
        "-v", "ON_ERROR_STOP=1",
        *args,
    ]
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR,
    )
    if proc.returncode != 0:
        raise PsqlError(proc.stderr.strip() or proc.stdout.strip())
    return proc.stdout


def query_rows(env: dict, sql: str) -> list[str]:
    output = run_psql(env, "-tA", "-F", "|", "-c", sql)
    return [line for line in output.splitlines() if line.strip()]


def apply_sql(env: dict, sql: str) -> None:
    run_psql(env, "-c", sql)


# Projection WGS84 -> Lambert-93 (EPSG:2154). Renvoie (x, y) en mètres,
# None si le point est hors de la zone métropolitaine.
def to_lambert93(latitude: float, longitude: float):
    if latitude < 41 or latitude > 52 or longitude < -6 or longitude > 10:
        return None

    pi = math.pi
    a = 6378137.0
    rf = 298.257222101
    e = math.sqrt(2 / rf - 1 / (rf * rf))

    def rad(d):
        return d * pi / 180

    def tan2(x):
        return math.sin(x) / math.cos(x)

    lat1 = rad(49)
    lat2 = rad(44)
    lat0 = rad(46.5)
    lon0 = rad(3)

    m1 = math.cos(lat1) / math.sqrt(1 - e * e * math.sin(lat1) * math.sin(lat1))
    m2 = math.cos(lat2) / math.sqrt(1 - e * e * math.sin(lat2) * math.sin(lat2))
    t1 = tan2(pi / 4 - lat1 / 2) / ((1 - e * math.sin(lat1)) / (1 + e * math.sin(lat1))) ** (e / 2)
    t2 = tan2(pi / 4 - lat2 / 2) / ((1 - e * math.sin(lat2)) / (1 + e * math.sin(lat2))) ** (e / 2)
    t0 = tan2(pi / 4 - lat0 / 2) / ((1 - e * math.sin(lat0)) / (1 + e * math.sin(lat0))) ** (e / 2)

    n = (math.log(m1) - math.log(m2)) / (math.log(t1) - math.log(t2))
    f = m1 / (n * t1**n)
    rho0 = a * f * t0**n

    p = rad(latitude)
    l = rad(longitude)
    tp = tan2(pi / 4 - p / 2) / ((1 - e * math.sin(p)) / (1 + e * math.sin(p))) ** (e / 2)
    rho = a * f * (tp**n)
    theta = n * (l - lon0)

    x = 700000 + rho * math.sin(theta)
    y = 6600000 + rho0 - rho * math.cos(theta)
    return round(x, 3), round(y, 3)


# Géocodage BAN : renvoie (score, latitude, longitude) pour le premier hit
# exploitable, None si aucune adresse ou score < 0.5.
def ban_geocode(city: str, postal: str, citycode: str):
    q = ""
    if city and postal:
        q = f"{city} {postal}"
    elif city:
        q = city
    elif postal:
        q = postal
    else:
        return None

    params = {"q": q, "limit": "1"}
    if postal:
        params["postcode"] = postal
    if citycode:
        params["citycode"] = citycode

    url = f"{BAN_BASE_URL}/search/?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=BAN_TIMEOUT_S) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    features = data.get("features") or []
    if not features:
        return None
    props = features[0].get("properties") or {}
    score = props.get("score")
    if score is None or score < MIN_GEOCODE_SCORE:
        return None
    coords = features[0].get("geometry", {}).get("coordinates")
    if not coords or len(coords) < 2:
        return None
    return float(score), float(coords[1]), float(coords[0])


def main() -> None:
    apply_changes, only_id = parse_args(sys.argv[1:])

    if only_id and not only_id.isdigit():
        sys.exit("Erreur : --id doit être un entier.")
    id_clause = f"WHERE jo.id = {only_id}" if only_id else ""

    env = load_env()
    try:
        run_psql(env, "-tAc", "SELECT 1")
    except PsqlError:
        sys.exit(
            "Erreur : accès au conteneur 'database' impossible. Lancez d'abord la pile."
        )

    rows = query_rows(
        env,
        "SELECT jo.id, jo.title, jo.status, "
        "COALESCE(jo.city, ''), COALESCE(jo.postal_code, ''), "
        "COALESCE(jo.commune_code, ''), "
        "jo.latitude, jo.longitude, "
        "COALESCE(jo.lambert93_x::text, ''), COALESCE(jo.lambert93_y::text, '') "
        "FROM job_offers jo "
        f"{id_clause} "
        "ORDER BY jo.id",
    )

    if not rows:
        print("Aucune offre à analyser.")
        return

    to_ban = {}
    to_derive = {}
    ok_count = 0

    for line in rows:
        parts = line.split("|")
        if len(parts) != 10:
            continue
        offer_id, _title, _status, city, postal, citycode, lat_s, lon_s, x_s, y_s = parts
        offer_id = int(offer_id)

        try:
            lat = float(lat_s) if lat_s not in ("", "0") else None
        except ValueError:
            lat = None
        try:
            lon = float(lon_s) if lon_s not in ("", "0") else None
        except ValueError:
            lon = None

        if lat is None or lon is None:
            to_ban[offer_id] = {"city": city, "postal": postal, "citycode": citycode}
            continue

        lambert = to_lambert93(lat, lon)
        if lambert is None:
            to_ban[offer_id] = {"city": city, "postal": postal, "citycode": citycode}
            continue

        dx, dy = lambert
        x = float(x_s) if x_s else 0.0
        y = float(y_s) if y_s else 0.0
        if abs(x - dx) > 1 or abs(y - dy) > 1:
            to_derive[offer_id] = {"lat": lat, "lon": lon, "x": dx, "y": dy}
        else:
            ok_count += 1

    total = len(to_ban) + len(to_derive) + ok_count
    print(f"Offres analysées : {total}")
    print(f"  déjà correctes                      : {ok_count}")
    print(f"  à re-géocoder via la BAN            : {len(to_ban)}")
    print(f"  à re-dériver (Lambert depuis WGS84) : {len(to_derive)}")
    print()

    if to_derive:
        print("[Redérivation Lambert]")
        for offer_id, info in to_derive.items():
            print(
                f"  #{offer_id} | lat={info['lat']} lng={info['lon']} "
                f"-> x={info['x']} y={info['y']}"
            )
        print()

    if to_ban:
        print("[Re-géocodage BAN]")
        for offer_id, info in to_ban.items():
            addr = f"{info['city']} {info['postal']}".strip() or "<vide>"
            print(f"  #{offer_id} | commune/cp : {addr}")
        print()

    if not to_ban and not to_derive:
        print("Rien à corriger.")
        return

    if not apply_changes:
        print("Mode rapport : relancer avec --apply pour appliquer les corrections.")
        return

    apply_updates = 0
    for offer_id, info in to_derive.items():
        apply_sql(
            env,
            "UPDATE job_offers "
            f"SET lambert93_x = {info['x']}, lambert93_y = {info['y']} "
            f"WHERE id = {offer_id}",
        )
        apply_updates += 1

    for offer_id, info in to_ban.items():
        hit = ban_geocode(info["city"], info["postal"], info["citycode"])
        if hit is None:
            print(
                f"  [ÉCHEC] #{offer_id} : adresse non géocodable, offre laissée en l'état."
            )
            continue
        _score, new_lat, new_lon = hit
        lambert = to_lambert93(new_lat, new_lon)
        if lambert is None:
            print(
                f"  [ÉCHEC] #{offer_id} : coordonnées BAN hors zone métropolitaine, "
                "offre laissée en l'état."
            )
            continue
        new_x, new_y = lambert
        apply_sql(
            env,
            "UPDATE job_offers "
            f"SET latitude = {new_lat}, longitude = {new_lon}, "
            f"lambert93_x = {new_x}, lambert93_y = {new_y} "
            f"WHERE id = {offer_id}",
        )
        apply_updates += 1
        time.sleep(0.3)

    print()
    print(f"Corrections appliquées : {apply_updates} offre(s).")


if __name__ == "__main__":
    main()
