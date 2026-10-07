#!/usr/bin/env python3
"""
Archivage automatique des offres d'emploi closes ou expirées depuis plus de 30 jours.

Ce script bascule vers le statut 'archived' :
  - Les offres au statut 'closed' ou 'expired'
  - Dont closed_at < NOW() - 30j OU expires_at < NOW() - 30j
    (ou updated_at < NOW() - 30j si dates nulles).

Usage :
  python3 scripts/archive_data_30days.py [--dry-run]

Exemple de configuration Crontab (tous les jours à 03h00) :
  0 3 * * * python3 /chemin/vers/G-SVR-500-LIL-5-1-survivor-5/scripts/archive_data_30days.py >> /var/log/geoemploi/archive_30days.log 2>&1
"""

import datetime
import os
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent


def log(level: str, message: str) -> None:
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sys.stdout.write(f"[{now}] [{level}] {message}\n")
    sys.stdout.flush()


def load_env() -> dict:
    env_path = PROJECT_DIR / ".env"
    env = {}
    if env_path.is_file():
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

    docker_check = subprocess.run(
        ["docker", "compose", "ps", "--services", "--filter", "status=running"],
        capture_output=True,
        text=True,
        cwd=PROJECT_DIR,
    )
    if docker_check.returncode == 0 and "database" in docker_check.stdout.splitlines():
        cmd = [
            "docker", "compose", "exec", "-T", "database", "psql",
            "-U", user,
            "-d", db,
            "-v", "ON_ERROR_STOP=1",
            *args,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_DIR)
        if proc.returncode != 0:
            raise PsqlError(proc.stderr.strip() or proc.stdout.strip())
        return proc.stdout

    psql_path = subprocess.run(["which", "psql"], capture_output=True, text=True)
    if psql_path.returncode == 0:
        local_env = os.environ.copy()
        local_env["PGPASSWORD"] = env.get("POSTGRES_PASSWORD", "geoemploi_password")
        cmd = [
            "psql",
            "-h", env.get("DB_HOST", "localhost"),
            "-p", str(env.get("DB_PORT", "5432")),
            "-U", user,
            "-d", db,
            "-v", "ON_ERROR_STOP=1",
            *args,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_DIR, env=local_env)
        if proc.returncode != 0:
            raise PsqlError(proc.stderr.strip() or proc.stdout.strip())
        return proc.stdout

    raise PsqlError("Aucun client PostgreSQL disponible (ni conteneur Docker 'database', ni binaire 'psql').")


def query_scalar(env: dict, sql: str) -> int:
    out = run_psql(env, "-tA", "-c", sql).strip()
    try:
        return int(out) if out else 0
    except ValueError:
        return 0


SQL_ELIGIBLE = """
SELECT COUNT(*) 
FROM job_offers 
WHERE status IN ('closed', 'expired') 
  AND (
    closed_at < NOW() - INTERVAL '30 days' 
    OR expires_at < NOW() - INTERVAL '30 days' 
    OR (closed_at IS NULL AND expires_at IS NULL AND updated_at < NOW() - INTERVAL '30 days')
  );
"""


def main():
    if "-h" in sys.argv or "--help" in sys.argv:
        print((__doc__ or "").strip())
        return 0

    dry_run = "--dry-run" in sys.argv
    env = load_env()

    log("INFO", "==========================================================")
    log("INFO", f"Démarrage de l'archivage automatique des offres > 30 jours{' [MODE SIMULATION]' if dry_run else ''}...")
    log("INFO", "==========================================================")

    try:
        log("INFO", "[CONTRÔLE] Comptage des offres closes ou expirées depuis plus de 30 jours...")

        eligible_count = query_scalar(env, SQL_ELIGIBLE)
        current_archived = query_scalar(env, "SELECT COUNT(*) FROM job_offers WHERE status = 'archived';")

        log("INFO", f"  • Offres éligibles à l'archivage (> 30j) : {eligible_count}")
        log("INFO", f"  • Offres déjà au statut 'archived'     : {current_archived}")

        if eligible_count == 0:
            log("INFO", "Aucune offre n'est éligible à l'archivage pour le moment.")
            log("SUCCESS", "Processus d'archivage terminé (0 offre à traiter).")
            return 0

        if dry_run:
            log("INFO", f"[SIMULATION] {eligible_count} offres seraient basculées vers le statut 'archived'. Aucune modification effectuée.")
            return 0

        log("INFO", "Exécution de la mise à jour SQL d'archivage...")
        archive_sql = """
        BEGIN;
            UPDATE job_offers
            SET status = 'archived', updated_at = NOW()
            WHERE status IN ('closed', 'expired')
              AND (
                closed_at < NOW() - INTERVAL '30 days'
                OR expires_at < NOW() - INTERVAL '30 days'
                OR (closed_at IS NULL AND expires_at IS NULL AND updated_at < NOW() - INTERVAL '30 days')
              );
        COMMIT;
        """
        run_psql(env, "-c", archive_sql)
        log("INFO", "Transaction SQL d'archivage exécutée avec succès.")

        log("INFO", "[VÉRIFICATION] Contrôle de comptage après archivage...")
        remaining_eligible = query_scalar(env, SQL_ELIGIBLE)
        new_total_archived = query_scalar(env, "SELECT COUNT(*) FROM job_offers WHERE status = 'archived';")

        log("INFO", f"  • Offres éligibles restantes (> 30j) : {remaining_eligible}")
        log("INFO", f"  • Nouveau total d'offres archivées   : {new_total_archived}")

        if remaining_eligible == 0:
            log("SUCCESS", f"Archivage terminé avec succès : {eligible_count} offres basculées vers le statut 'archived'.")
            return 0
        else:
            log("WARN", "Attention : des offres éligibles n'ont pas pu être archivées.")
            return 1

    except PsqlError as exc:
        log("ERROR", f"Erreur SQL lors de l'archivage : {exc}")
        return 1
    except Exception as exc:
        log("ERROR", f"Erreur inattendue : {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
