#!/bin/bash
set -e

echo "Restarting GeoEmploi (clean rebuild)"
docker compose down --volumes --remove-orphans
docker compose up --build "$@"
