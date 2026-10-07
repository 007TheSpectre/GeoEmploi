#!/bin/bash
set -e

echo "Stopping and removing everything (containers, volumes, images)"
docker compose down --volumes --rmi local --remove-orphans
echo "Clean. Fresh start ready."
