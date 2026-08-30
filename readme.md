# system requirements

- **development (mac)**: docker desktop — `docker compose up` builds and runs the whole
  stack, site on http://localhost:9000 (see below)
- **production**: bare-metal Alpine Linux — nginx, php-fpm 8.3 and mariadb directly on
  the host, **no docker**. Full runbook: [doc/nginx.md](doc/nginx.md). The nginx and
  php-fpm config files in `docker/` are shared between both environments.

# data dump import

check in scripts/

```bash
docker exec -it ryogasp-spip-1 bash
cd tmp/dump
spip sql:dump:restore --name 2025-04-28
```

you can check if everything went fine into mariadb
`docker exec -it ryogasp-mariadb-1 bash`

if this does not work, create a temporary superadmin
`spip auteurs:superadmin` if lang is fucked up, set spip_lang=fr into cookies

# install spip plugins

install these required plugins:

```bash
cd scripts && bash plugins.sh
```

- [hash_documents](https://plugins.spip.net/hasher) [complete article (fr)](https://contrib.spip.net/Le-plugin-hash_documents)
- [squelettes_par_rubrique](https://plugins.spip.net/squelettes_par_rubrique.html)
- [comments](https://plugins.spip.net/comments.html)
- [breves](https://plugins.spip.net/breves.html)

# development: docker on the mac (nginx + php-fpm on Alpine)

`docker compose up` builds `docker/Dockerfile`: Alpine Linux, nginx, PHP 8.3 fpm, SPIP core
(downloaded from files.spip.net at build time) and [spip-cli](https://git.spip.net/spip-contrib-outils/spip-cli)
for the `spip` command used by `scripts/*.sh`.

```
docker/
  Dockerfile               # build args: SPIP_VERSION, SPIP_CLI_VERSION, SPIP_UID, SPIP_GID
  docker-entrypoint.sh     # php.ini from PHP_* env, wait for mariadb, start php-fpm + nginx
  nginx/ryogasp.conf       # the site: translation of the old .htaccess rules, rule by rule
  nginx/fastcgi-spip.conf  # fastcgi params (https detection through X-Forwarded-Proto)
  php/                     # php-fpm pool + php.ini defaults
```

- `src/IMG`, `src/squelettes`, `src/plugins`, `src/config`, `src/tmp/dump` are bind mounts, as before
- `tmp/` and `local/` (SPIP caches) live in the named volumes `spip-tmp` / `spip-local`
- the container listens on port 80, published on `localhost:9000`
- files created by the container belong to uid/gid 33 (`www-data` of the previous image);
  pass `--build-arg SPIP_UID=... --build-arg SPIP_GID=...` if the host user differs
- environment: `PHP_MEMORY_LIMIT` (256M), `PHP_POST_MAX_SIZE` (40M), `PHP_UPLOAD_MAX_FILESIZE` (32M),
  `PHP_MAX_EXECUTION_TIME` (60), `PHP_TIMEZONE`, `SPIP_DB_*`

upgrade SPIP: change `SPIP_VERSION` in `docker-compose.yml`, then `docker compose build && docker compose up -d`
and run `docker exec ryogasp-spip-1 spip core:maj:bdd`.

## smoke test

with the stack running, checks ~40 URLs (pages, rss, redirects, 403/404, documents):

```bash
bash scripts/smoke.sh http://localhost:9000
```

# production install (bare metal)

alpine linux + nginx, php-fpm and mariadb on the host, no docker — the full walkthrough
(packages, users and rights, code in `/home/gaspard/ryogasp`, symlinks, certbot, checks,
cron, upgrades) is in [doc/nginx.md](doc/nginx.md)

# reorganize folders

(todo)
put these dir outside the spip root path
redefine \_DIR_TMP & \_DIR_CONNECT constants in mes_options.php

# data dump

check in scripts/

```bash
#!/usr/bin/env bash

date=$(date '+%Y-%m-%d')
docker exec -it ryogasp-spip-1 spip sql:dump:create --name $date
```

automated export in crontab with `crontab -e`

```
# twice a month, create a dump
0 0 1,15 * * cd /home/ryogasp/ryogasp/scripts && bash dump.sh >/dev/null 2>&1
```
