#!/usr/bin/env bash

# Purge SPIP's generated caches inside the running SPIP container.
#
# This script lives in scripts/, one level below docker-compose.yml.
# Run it from anywhere, e.g. from the project root:
#   ./scripts/purge-cache.sh            # cheap caches only
#   ./scripts/purge-cache.sh --vignettes  # also the thumbnails (the big one)
#   ./scripts/purge-cache.sh --dry-run    # report sizes, delete nothing
#
# Why this exists: ipeos/spip declares /var/www/html as an anonymous volume, and
# the compose file bind-mounts only IMG, squelettes, plugins, config and
# tmp/dump. Everything SPIP *generates* therefore lives inside that volume, on
# the same small root filesystem as the Docker daemon:
#
#   local/cache-vignettes   thumbnails, one per image size used - the bulk of it
#   local/cache-css|js|gd2  compiled assets
#   tmp/cache               compiled templates and the page cache
#
# All of it is regenerated on demand, so it is safe to delete; the only cost is
# CPU on the next page views. Thumbnails are the expensive ones to rebuild from
# a multi-GB IMG library, which is why they need --vignettes.
#
# It never touches tmp/dump (bind-mounted, holds the SQL dumps), nor IMG,
# config, plugins or squelettes.

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="docker-compose"
SERVICE="spip"
WEBROOT="/var/www/html"

purge_vignettes=false
dry_run=false
for arg in "$@"; do
    case "$arg" in
        --vignettes) purge_vignettes=true ;;
        --dry-run)   dry_run=true ;;
        -h|--help)   sed -n '3,28p' "$0"; exit 0 ;;
        *) echo "ERROR: unknown argument '$arg' (try --help)" >&2; exit 1 ;;
    esac
done

cd "$PROJECT_DIR"

test -f docker-compose.yml || {
    echo "ERROR: docker-compose.yml was not found in $PROJECT_DIR" >&2
    exit 1
}

# Refuse to run against anything that is not a SPIP webroot.
$COMPOSE exec -T "$SERVICE" test -f "$WEBROOT/spip.php" || {
    echo "ERROR: $WEBROOT/spip.php not found in the '$SERVICE' container." >&2
    echo "Is the stack running? ($COMPOSE ps)" >&2
    exit 1
}

# Cheap to regenerate; always purged.
targets="tmp/cache local/cache-css local/cache-js local/cache-gd2"
# Expensive to regenerate from a large IMG library; opt in.
if $purge_vignettes; then
    targets="$targets local/cache-vignettes"
fi

echo "Disk before:"
df -h / | tail -1

echo
echo "Cache sizes in the container:"
# shellcheck disable=SC2086 # word splitting of $targets is intended
$COMPOSE exec -T "$SERVICE" sh -c \
    "cd $WEBROOT && du -sh $targets 2>/dev/null; echo '--- totals ---'; du -sh local tmp 2>/dev/null"

if $dry_run; then
    echo
    echo "--dry-run: nothing was deleted."
    if ! $purge_vignettes; then
        echo "local/cache-vignettes was left out; add --vignettes to include it."
    fi
    exit 0
fi

echo
echo "Purging: $targets"
# Delete the *contents* and keep the directories themselves: SPIP recreates
# subdirectories as it needs them but expects these roots to exist and be
# writable. -mindepth 1 is what keeps the root in place.
# shellcheck disable=SC2086
$COMPOSE exec -T "$SERVICE" sh -c \
    "cd $WEBROOT && for d in $targets; do
         [ -d \"\$d\" ] || continue
         find \"\$d\" -mindepth 1 -delete
     done"

# Best effort: let SPIP rebuild its own caches consistently afterwards. Not all
# images ship spip-cli, and the command is not required for the purge above to
# be correct, so a failure here is only a warning.
if $COMPOSE exec -T "$SERVICE" sh -c 'command -v spip' >/dev/null 2>&1; then
    echo
    echo "Asking spip-cli to rebuild its caches..."
    $COMPOSE exec -T "$SERVICE" spip cache:vider ||
        echo "WARNING: 'spip cache:vider' failed; the files above were still removed." >&2
fi

echo
echo "Cache sizes after:"
$COMPOSE exec -T "$SERVICE" sh -c "cd $WEBROOT && du -sh local tmp 2>/dev/null"

echo
echo "Disk after:"
df -h / | tail -1

if ! $purge_vignettes; then
    echo
    echo "Note: local/cache-vignettes was kept. It is usually the largest item;"
    echo "re-run with --vignettes to reclaim it, at the cost of regenerating"
    echo "every thumbnail on the next page views."
fi
