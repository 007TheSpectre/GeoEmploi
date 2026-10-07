#!/usr/bin/env python3
"""
Purge automatique des données de plus de 90 jours (Conformité RGPD).

Ce script purge dans une transaction SQL :
  1. Les consultations d'offres (job_offer_views) de plus de 90 jours.
  2. Les notifications lues (notifications) de plus de 90 jours.
  3. Les jetons de session / réinitialisation expirés (tokens) de plus de 90 jours.

Usage :
  python3 scripts/purge_data_90days.py [--dry-run]

Exemple de configuration Crontab (tous les jours à 02h00) :
  0 2 * * * python3 /chemin/vers/G-SVR-500-LIL-5-1-survivor-5/scripts/purge_data_90days.py >> /var/log/geoemploi/purge_90days.log 2>&1
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


def main():
    if "-h" in sys.argv or "--help" in sys.argv:
        print((__doc__ or "").strip())
        return 0

    dry_run = "--dry-run" in sys.argv
    env = load_env()

    log("INFO", "==========================================================")
    log("INFO", f"Démarrage de la purge automatique des données > 90 jours{' [MODE SIMULATION]' if dry_run else ''}...")
    log("INFO", "==========================================================")

    try:
        log("INFO", "[CONTRÔLE] Comptage des données éligibles (> 90 jours)...")

        views_count = query_scalar(env, "SELECT COUNT(*) FROM job_offer_views WHERE viewed_at < NOW() - INTERVAL '90 days';")
        notifs_count = query_scalar(env, "SELECT COUNT(*) FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '90 days';")
        tokens_count = query_scalar(env, "SELECT COUNT(*) FROM tokens WHERE expires_at < NOW() - INTERVAL '90 days';")

        log("INFO", f"  • Consultations d'offres éligibles (> 90j)  : {views_count}")
        log("INFO", f"  • Notifications lues éligibles (> 90j)      : {notifs_count}")
        log("INFO", f"  • Jetons expirés éligibles (> 90j)          : {tokens_count}")

        total_eligible = views_count + notifs_count + tokens_count

        if total_eligible == 0:
            log("INFO", "Aucune donnée de plus de 90 jours à purger. La base est parfaitement propre.")
            log("SUCCESS", "Processus de purge terminé (0 élément à traiter).")
            return 0

        if dry_run:
            log("INFO", f"[SIMULATION] {total_eligible} enregistrements seraient purgés. Aucune modification effectuée.")
            return 0

        log("INFO", "Exécution de la transaction SQL de purge...")
        purge_sql = """
        BEGIN;
            DELETE FROM job_offer_views WHERE viewed_at < NOW() - INTERVAL '90 days';
            DELETE FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '90 days';
            DELETE FROM tokens WHERE expires_at < NOW() - INTERVAL '90 days';
        COMMIT;
        """
        run_psql(env, "-c", purge_sql)
        log("INFO", "Transaction SQL de purge exécutée avec succès.")
        log("INFO", "[VÉRIFICATION] Contrôle de comptage après purge...")
        remaining_views = query_scalar(env, "SELECT COUNT(*) FROM job_offer_views WHERE viewed_at < NOW() - INTERVAL '90 days';")
        remaining_notifs = query_scalar(env, "SELECT COUNT(*) FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '90 days';")
        remaining_tokens = query_scalar(env, "SELECT COUNT(*) FROM tokens WHERE expires_at < NOW() - INTERVAL '90 days';")

        log("INFO", f"  • Consultations restantes (> 90j) : {remaining_views}")
        log("INFO", f"  • Notifications restantes (> 90j) : {remaining_notifs}")
        log("INFO", f"  • Jetons restants (> 90j)         : {remaining_tokens}")

        if remaining_views == 0 and remaining_notifs == 0 and remaining_tokens == 0:
            log("SUCCESS", f"Purge terminée avec succès : {total_eligible} enregistrements supprimés.")
            return 0
        else:
            log("WARN", "Attention : des enregistrements résiduels subsistent après purge.")
            return 1

    except PsqlError as exc:
        log("ERROR", f"Erreur SQL lors de la purge : {exc}")
        return 1
    except Exception as exc:
        log("ERROR", f"Erreur inattendue : {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
