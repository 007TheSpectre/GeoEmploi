#!/bin/bash
set -e

echo "Building and starting GeoEmploi..."
docker compose up --build "$@"
