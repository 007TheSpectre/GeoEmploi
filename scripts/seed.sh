#!/bin/bash
set -e

# ============================================================
# Injecte le jeu de données de démonstration dans la base.
# Équivalent de l'ancien auto-seed, mais manuel :
#   admin, employeur vérifié, candidat et offres géolocalisées.
#
# Usage : ./scripts/seed.sh
# Prérequis : pile démarrée (conteneur `database` qui tourne).
# Idempotent : ne fait rien si le jeu de démonstration est déjà présent.
# ============================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

ADMIN_EMAIL="admin@geoemploi.fr"
SQL_FILE="$PROJECT_DIR/database/seed-demo.sql"

if [ ! -f .env ]; then
  echo "Erreur : fichier .env introuvable à la racine du projet."
  exit 1
fi

POSTGRES_USER="$(grep -E '^POSTGRES_USER=' .env | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
POSTGRES_DB="$(grep -E '^POSTGRES_DB=' .env | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
POSTGRES_USER="${POSTGRES_USER:-geoemploi}"
POSTGRES_DB="${POSTGRES_DB:-geoemploi}"

run_psql() {
  docker compose exec -T database psql \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -v ON_ERROR_STOP=1 \
    "$@"
}

if ! run_psql -tAc "SELECT 1" > /dev/null 2>&1; then
  echo "Erreur : accès au conteneur 'database' impossible. Lancez d'abord la pile."
  exit 1
fi

ALREADY_SEEDED="$(run_psql -tAc "SELECT 1 FROM users WHERE email = '$ADMIN_EMAIL'")"
if [ "$ALREADY_SEEDED" = "1" ]; then
  echo "Jeu de démonstration déjà présent en base — rien à faire."
  exit 0
fi

echo "Injection du jeu de démonstration dans la base ($POSTGRES_DB)..."
run_psql -f /dev/stdin < "$SQL_FILE"

echo ""
echo "Jeu de démonstration injecté :"
echo "  Admin     : admin@geoemploi.fr / Admin123!"
echo "  Employeur : employeur@geoemploi.fr / Employeur123!"
echo "  Candidat  : candidat@geoemploi.fr / Candidat123!"
