#!/usr/bin/env bash

# Update the SPIP service defined in docker-compose.yml.
#
# This script lives in scripts/, one level below docker-compose.yml.
# Run it from anywhere, e.g. from the project root:
#   ./scripts/update-spip.sh
#
# This script:
#   1. Backs up the MariaDB database and SPIP config/plugins/templates
#      (not src/IMG: see the backup step below).
#   2. Downloads the newest ipeos/spip:latest image.
#   3. Recreates only the SPIP container.
#   4. Checks that SPIP answers on $SITE_URL (X-Spip-Cache header).
#   5. Removes dangling Docker images and obsolete, unused SPIP volumes.
#
# It refuses to start unless MIN_FREE_MB is free, and keeps only the last
# KEEP_BACKUPS of each backup kind, because the root filesystem is small.
#
# It does not remove MariaDB, bind-mounted files, or unrelated volumes. It
# deliberately does NOT run 'docker container prune', 'docker image prune -a' or
# 'docker system prune': those reach outside this project and would delete other
# stacks' stopped containers and images.

set -Eeuo pipefail

# docker-compose.yml is in the parent directory of this script.
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
COMPOSE="docker-compose"
SITE_URL="http://localhost:9000"

# Disk guards. The server's root filesystem is 20 GB and holds both the repo and
# /var/lib/docker, so a run must be refused rather than allowed to die halfway.
# A run transiently needs: the SQL dump (~30 MB), the files archive (~1 MB), the
# pulled image alongside the one it replaces (~1 GB) and a fresh webroot volume.
MIN_FREE_MB=2048
# How many of each backup kind to keep. Older ones are deleted once the new
# backup of that run has been written.
KEEP_BACKUPS=3

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

# Free space in MB on the filesystem holding "$1". -P forces POSIX output so the
# columns stay put when a long device name would otherwise wrap onto two lines.
free_mb() {
    df -Pk "$1" 2>/dev/null | awk 'NR==2 {print int($4/1024)}'
}

# Refuse to start without room, instead of failing between removing the old
# container and starting the new one.
free_now="$(free_mb "$PROJECT_DIR")"
echo "Free space: ${free_now:-unknown} MB (minimum required: $MIN_FREE_MB MB)"
if [ -n "$free_now" ] && [ "$free_now" -lt "$MIN_FREE_MB" ]; then
    echo "ERROR: only ${free_now} MB free on the filesystem holding $PROJECT_DIR." >&2
    echo "Reclaim space first, for example:" >&2
    echo "  ./scripts/purge-cache.sh --vignettes   # SPIP's generated caches" >&2
    echo "  docker volume ls --filter dangling=true  # leftover webroot volumes" >&2
    echo "  du -sh $BACKUP_DIR/*                   # old backups" >&2
    exit 1
fi

# /var/lib/docker is usually on the same filesystem as the repo (it is on the
# server), but report it separately when it is not. df needs to stat the path,
# which a non-root user cannot do under /var/lib/docker, so a failure here is
# only informational.
docker_root="$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || true)"
if [ -n "$docker_root" ]; then
    free_docker="$(free_mb "$docker_root" || true)"
    if [ -n "$free_docker" ] && [ "$free_docker" != "$free_now" ]; then
        echo "Free space on the Docker root ($docker_root): ${free_docker} MB"
    fi
fi

echo "Creating a MariaDB backup..."

# The password is read inside the MariaDB container from its environment.
# The SQL dump is written on the host, not inside the container.
$COMPOSE exec -T mariadb sh -c \
    'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
    > "$BACKUP_DIR/spip-database-$timestamp.sql"

echo "Backing up SPIP config, plugins and templates..."

# Deliberately NOT the whole of src/:
#   - src/IMG is several GB of already-compressed media. Docker never touches
#     bind-mounted host files when a container is replaced, and a SPIP upgrade
#     does not rewrite the media library, so archiving it every run only filled
#     the disk.
#   - src/tmp is regenerable cache, and SPIP writes to it while the container
#     runs, which makes tar fail with "file changed as we read it".
# What is kept is what a new SPIP version can rewrite in place on first boot:
# config/ (connect.php, chmod.php, and cles.php - the secret keys), plugins/
# (rewritten by the plugin manager), plus squelettes/ so the archive restores
# on its own without a checkout.
tar czf "$BACKUP_DIR/spip-files-$timestamp.tar.gz" -C "$PROJECT_DIR" \
    src/config src/plugins src/squelettes src/ryogasp.htaccess
cp docker-compose.yml "$BACKUP_DIR/docker-compose-$timestamp.yml"

# Now that this run's backup exists, drop the oldest ones. Done in this order so
# a failure above never leaves the project with fewer backups than it started
# with, and before the pull so the freed space is available to it.
echo "Keeping the $KEEP_BACKUPS most recent of each backup kind..."
# The glob is passed to find quoted, so find does the matching: an unquoted
# variable holding a glob is expanded by bash but not by every shell, and that
# difference is invisible until the pruning silently stops happening.
# Sorted by name, not by mtime: every name carries its own
# YYYY-MM-DD_HH-MM-SS stamp, which sorts chronologically, and unlike mtime it
# cannot be disturbed by a copy or a restore.
for pattern in 'spip-database-*.sql' 'spip-files-*.tar.gz' 'docker-compose-*.yml'; do
    kept=0
    while IFS= read -r old_backup; do
        kept=$((kept + 1))
        [ "$kept" -le "$KEEP_BACKUPS" ] && continue
        echo "  removing $(basename "$old_backup")"
        rm -f "$old_backup"
    done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name "$pattern" | sort -r)
done

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

echo "Checking unused Docker volumes for obsolete SPIP files..."
# The SPIP image declares /var/www/html as an anonymous volume, so each replaced
# container leaves a whole webroot behind, attached to nothing. Measured on the
# server: 468 MB for a freshly orphaned one and 1.2 GB for a long-running one -
# the size tracks how long the container ran, because ~90% of it is generated
# cache (local/cache-vignettes and tmp/cache) rather than SPIP itself.
#
# Two gates before anything is removed:
#
#   1. The volume must be anonymous, i.e. named with the 64-character hex id
#      Docker generates (such volumes also carry a com.docker.volume.anonymous
#      label, but only on recent engines, so the name is what is tested).
#      '--filter dangling=true' lists *named* volumes as well, which are often
#      unused merely because their project is stopped; on a host running more
#      than one SPIP site some of those are webroots too, and removing them
#      would be data loss in another project.
#   2. It must really hold a SPIP install.
#
# Gate 2 is tested from inside a container rather than on the host filesystem.
# The Mountpoint reported by 'docker volume inspect' lives under /var/lib/docker,
# which is mode 0710 root:root; this script runs as a non-root member of the
# docker group, so the path cannot even be traversed, and '[ -f ... ]' reports
# that refusal as a plain false. (It is also absent from the host entirely when
# the daemon runs in a VM, as with Docker Desktop.) Testing that path therefore
# always answered false and no volume was ever reclaimed. The probe reuses the
# image of the running SPIP container, so it downloads nothing, mounts the volume
# read-only and is given no network.
# head -1: 'ps -q' prints one id per replica, and only one is needed here.
spip_container="$($COMPOSE ps -q spip 2>/dev/null | head -1 || true)"
probe_image=""
if [ -n "$spip_container" ]; then
    probe_image="$(docker inspect --format '{{.Config.Image}}' "$spip_container" || true)"
fi

if [ -z "$probe_image" ]; then
    echo "WARNING: the SPIP image could not be determined; skipping volume cleanup" >&2
else
    while IFS= read -r volume; do
        # Anonymous volumes only: skip anything that is not 64 hex characters.
        [ "${#volume}" -eq 64 ] || continue
        case "$volume" in
            *[!0-9a-f]*) continue ;;
        esac

        if docker run --rm --network none --entrypoint sh \
            -v "$volume":/v:ro "$probe_image" \
            -c '[ -f /v/spip.php ] && [ -d /v/ecrire ] && [ -d /v/plugins-dist ]' \
            >/dev/null 2>&1
        then
            echo "Removing obsolete SPIP volume: $volume"
            # The probe container above is removed asynchronously, so a first
            # attempt can still see the volume as in use. Retry once.
            if ! rm_err="$(docker volume rm "$volume" 2>&1)"; then
                sleep 2
                rm_err="$(docker volume rm "$volume" 2>&1)" ||
                    echo "WARNING: volume $volume not removed: $rm_err" >&2
            fi
        fi
    done < <(docker volume ls --quiet --filter dangling=true)
fi


echo
echo "SPIP update complete."
echo "Database backup: $BACKUP_DIR/spip-database-$timestamp.sql"
echo "Files backup:    $BACKUP_DIR/spip-files-$timestamp.tar.gz"
echo "Free space: ${free_now:-unknown} MB before, $(free_mb "$PROJECT_DIR") MB now."
echo "To reclaim more, run ./scripts/purge-cache.sh --vignettes"
