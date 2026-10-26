#!/usr/bin/env bash

# Update the SPIP service defined in docker-compose.yml.
#
# This script lives in scripts/, one level below docker-compose.yml.
# Run it from anywhere, e.g. from the project root:
#   ./scripts/update-spip.sh
#
# This script:
#   1. Backs up the MariaDB database and SPIP files.
#   2. Downloads the newest ipeos/spip:latest image.
#   3. Recreates only the SPIP container.
#   4. Checks that SPIP answers on $SITE_URL (X-Spip-Cache header).
#   5. Removes dangling Docker images.
#
# It does not remove MariaDB, bind-mounted files, or named volumes.

set -Eeuo pipefail

# docker-compose.yml is in the parent directory of this script.
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
COMPOSE="docker-compose"
SITE_URL="http://localhost:9000"

cd "$PROJECT_DIR"
mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y-%m-%d_%H-%M-%S)"

echo "Working directory: $PROJECT_DIR"

# Check that the expected Compose file and services exist.
test -f docker-compose.yml || {
    echo "ERROR: docker-compose.yml was not found in $PROJECT_DIR" >&2
    exit 1
}

# Parse and validate docker-compose.yml (syntax, schema, variables): if it is
# broken, stop here, before any backup or container change.
services="$($COMPOSE config --services)"
for service in spip mariadb; do
    grep -qx "$service" <<<"$services" || {
        echo "ERROR: service '$service' is not defined in docker-compose.yml" >&2
        exit 1
    }
done

command -v curl >/dev/null || {
    echo "ERROR: curl is required to check the site after the update" >&2
    exit 1
}

echo "Creating a MariaDB backup..."

# The password is read inside the MariaDB container from its environment.
# The SQL dump is written on the host, not inside the container.
$COMPOSE exec -T mariadb sh -c \
    'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
    > "$BACKUP_DIR/spip-database-$timestamp.sql"

echo "Backing up SPIP files..."

# These are bind-mounted by docker-compose.yml and survive container removal,
# but backing them up makes the update reversible.
tar czf "$BACKUP_DIR/spip-files-$timestamp.tar.gz" -C "$PROJECT_DIR" src
cp docker-compose.yml "$BACKUP_DIR/docker-compose-$timestamp.yml"

echo "Downloading the newest ipeos/spip:latest image..."
$COMPOSE pull spip

echo "Stopping and removing the old SPIP container..."
# This removes only the container. It does not remove src/, MariaDB, or data.
$COMPOSE stop spip
$COMPOSE rm -f spip

echo "Starting a new SPIP container from the downloaded image..."
# --no-deps leaves the currently running MariaDB container untouched.
$COMPOSE up -d --no-deps spip

echo "Waiting for SPIP to answer on $SITE_URL..."
# SPIP sends an X-Spip-Cache header with the pages it serves. Retry for up to
# a minute while the new container boots.
spip_ok=false
for _ in $(seq 30); do
    headers="$(curl -sI --max-time 10 "$SITE_URL" || true)"
    if grep -qi '^x-spip-cache:' <<<"$headers"; then
        spip_ok=true
        break
    fi
    sleep 2
done

echo "Current container status:"
$COMPOSE ps

echo "Recent SPIP logs:"
$COMPOSE logs --tail=50 spip

if ! $spip_ok; then
    # Exit before the prune below: the previous image is now untagged and
    # would be deleted, it is still needed to roll back.
    echo "ERROR: no X-Spip-Cache header from $SITE_URL. Last response headers:" >&2
    echo "${headers:-(no response)}" >&2
    echo "The previous image is kept: docker images --filter dangling=true" >&2
    echo "Backups: $BACKUP_DIR/*-$timestamp.*" >&2
    exit 1
fi
echo "OK: $SITE_URL answers with an X-Spip-Cache header."

echo "Removing dangling Docker images..."
# This removes untagged layers only. It does not remove images used by running
# containers. Use 'docker image prune -a' manually only if you want broader cleanup.
docker image prune -f

echo
echo "SPIP update complete."
echo "Database backup: $BACKUP_DIR/spip-database-$timestamp.sql"
echo "Files backup:    $BACKUP_DIR/spip-files-$timestamp.tar.gz"
