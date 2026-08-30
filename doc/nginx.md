# production: ryogasp on bare-metal alpine linux + nginx

Development runs in docker on the mac (see `readme.md`). **Production runs without
docker**: Alpine Linux with nginx, php-fpm, SPIP and MariaDB straight on the host.

The `docker/` directory stays the single source of truth: `docker/Dockerfile` documents
the packages and the layout, and the nginx / php-fpm files in it are copied to the host
**as-is** — same rules in dev and in prod.

```
internet ──https──> nginx (certbot) ──/run/php-fpm.sock──> php-fpm 8.3 ──> mariadb (localhost)
                                                           SPIP in /var/www/html
                                                           symlinks -> /home/gaspard/ryogasp/src/
```

## 1. packages

The same list as `docker/Dockerfile`, plus mariadb and certbot:

```sh
apk add nginx mariadb mariadb-client certbot certbot-nginx \
    git composer curl unzip su-exec tzdata \
    php83 php83-fpm php83-opcache \
    php83-bcmath php83-ctype php83-curl php83-dom php83-exif php83-fileinfo php83-gd \
    php83-iconv php83-intl php83-ldap php83-mbstring php83-mysqli php83-openssl \
    php83-pdo php83-pdo_sqlite php83-phar php83-posix php83-session php83-simplexml \
    php83-sodium php83-sqlite3 php83-tokenizer php83-xml php83-xmlreader php83-xmlwriter \
    php83-zip php83-zlib php83-pecl-apcu php83-pecl-imagick
ln -sf /usr/bin/php83 /usr/local/bin/php
for s in mariadb php-fpm83 nginx crond; do rc-update add "$s" default; done
```

## 2. users and rights

php-fpm and the nginx workers both run as `www-data` (Alpine already ships the group,
gid 82):

```sh
adduser -S -D -H -G www-data -h /var/www/html -s /sbin/nologin www-data
```

The code lives in gaspard's home. `www-data` needs to traverse into it (execute bit,
no listing):

```sh
chmod 711 /home/gaspard
```

## 3. the code → /home/gaspard/ryogasp

```sh
su - gaspard -c 'git clone https://github.com/gasp/ryogasp.git /home/gaspard/ryogasp'
```

`src/` must be writable by SPIP (uploads in `IMG/`, `config/`, `plugins/auto`,
`tmp/dump`) while gaspard keeps ownership for git. Group `www-data`, group-writable,
setgid on directories so new files inherit the group:

```sh
cd /home/gaspard/ryogasp
chown -R gaspard:www-data src
find src -type d -exec chmod 2775 {} +
find src -type f -exec chmod 664 {} +
```

## 4. SPIP core in /var/www/html

Same recipe as the Dockerfile — download the core, then symlink the site's directories
into it:

```sh
SPIP_VERSION=4.4.21
curl -fsSL "https://files.spip.net/spip/archives/spip-v${SPIP_VERSION}.zip" -o /tmp/spip.zip
mkdir -p /var/www/html
unzip -q /tmp/spip.zip -d /var/www/html
rm /tmp/spip.zip

cd /var/www/html
rm -rf IMG config plugins squelettes
ln -s /home/gaspard/ryogasp/src/IMG        IMG
ln -s /home/gaspard/ryogasp/src/config     config
ln -s /home/gaspard/ryogasp/src/plugins    plugins
ln -s /home/gaspard/ryogasp/src/squelettes squelettes
mkdir -p tmp local lib
ln -s /home/gaspard/ryogasp/src/tmp/dump   tmp/dump
chown -R www-data:www-data tmp local lib
```

## 5. spip-cli (the `spip` command)

```sh
git clone --depth 1 --branch 2.0.1 https://git.spip.net/spip-contrib-outils/spip-cli.git /opt/spip-cli
composer install --no-dev --working-dir=/opt/spip-cli
install -m 755 /home/gaspard/ryogasp/docker/spip /usr/local/bin/spip
```

(the wrapper cds to `/var/www/html` and drops root to `www-data`; it works unchanged
on the host)

## 6. mariadb

```sh
/etc/init.d/mariadb setup
rc-service mariadb start
mariadb -u root <<'SQL'
CREATE DATABASE spip CHARACTER SET utf8mb4;
CREATE USER 'spip'@'localhost' IDENTIFIED BY 'spippassword';
GRANT ALL PRIVILEGES ON spip.* TO 'spip'@'localhost';
SQL
```

`src/config/connect.php` is per-environment (gitignored): here the database host is
`localhost` (in docker it is `mysql`).

Restore the data: copy the latest dump into `src/tmp/dump/`, the media into `src/IMG/`,
then:

```sh
spip sql:dump:restore --name 2025-04-28
```

Plugins: download and unzip the four zips into `src/plugins/` (URLs in
`scripts/plugins.sh`), then:

```sh
spip plugins:activer -y -e breves squelettes_par_rubrique hasher comments
```

## 7. php-fpm

Replace the pool, keep Alpine's stock `/etc/php83/php-fpm.conf` (daemon + logs are the
distro's business):

```sh
cd /home/gaspard/ryogasp
cp docker/php/www.conf  /etc/php83/php-fpm.d/www.conf
cp docker/php/spip.ini  /etc/php83/conf.d/90-spip.ini
cat > /etc/php83/conf.d/99-local.ini <<'INI'
; in docker these come from the PHP_* environment (docker-entrypoint.sh)
max_execution_time = 60
memory_limit = 256M
post_max_size = 40M
upload_max_filesize = 32M
date.timezone = Europe/Paris
INI
rc-service php-fpm83 restart
ls -l /run/php-fpm.sock    # must belong to www-data
```

## 8. nginx

The site config is byte-identical to the dev container's. Keep the stock
`/etc/nginx/nginx.conf` (logs in `/var/log/nginx`), just switch its worker user:

```sh
cd /home/gaspard/ryogasp
cp docker/nginx/fastcgi-spip.conf /etc/nginx/fastcgi-spip.conf
cp docker/nginx/ryogasp.conf      /etc/nginx/http.d/ryogasp.conf
rm -f /etc/nginx/http.d/default.conf
sed -i 's/^user nginx;/user www-data;/' /etc/nginx/nginx.conf
nginx -t && rc-service nginx restart
curl -sI http://127.0.0.1/ | head -1    # HTTP/1.1 200 OK
```

## 9. https

```sh
certbot --nginx -d ryogasp.com -d www.ryogasp.com    # choose "redirect"
```

Certbot edits `http.d/ryogasp.conf` in place (443 + certificates + http→https).
To force the apex domain, add at the top of the `listen 443` server block:

```nginx
	if ($host = www.ryogasp.com) {
		return 301 https://ryogasp.com$request_uri;
	}
```

then `nginx -t && rc-service nginx reload`. HTTPS is detected natively by SPIP
(`$https`); the `X-Forwarded-Proto` maps in the config only matter if a reverse proxy
ever sits in front again.

Finally point SPIP at its public address (used in RSS feeds and absolute links):

```sh
spip config:ecrire adresse_site --valeur=https://ryogasp.com
```

## 10. check that everything works

```sh
bash /home/gaspard/ryogasp/scripts/smoke.sh https://ryogasp.com   # ~40 checks
rc-service nginx status && rc-service php-fpm83 status
tail -f /var/log/nginx/error.log
```

The first hits are slow while SPIP fills `tmp/` and `local/` (they start empty).
If php-fpm is down, nginx serves the static `squelettes/502.html` teapot page.

## 11. backups

`scripts/dump.sh` is written for docker; on the host call the tools directly
(`crontab -e` as root, busybox crond):

```cron
0 0 1,15 * * spip sql:dump:create --name $(date +\%Y-\%m-\%d) >/dev/null 2>&1
5 0 1,15 * * mariadb-dump --user=spip --password=spippassword spip | gzip -9 > /home/gaspard/ryogasp/src/tmp/dump/dump-$(date +\%Y-\%m-\%d).sql.gz
```

## upgrades

- **SPIP**: `spip core:mettreajour` then `spip core:maj:bdd` and `spip plugins:maj:bdd`
  (or download the new zip like in step 4 — the symlinks are yours, not SPIP's);
  refresh `src/config/spip/` from the new zip's `config/spip/` if it changed
  (SPIP >= 4.4 cannot boot without these files)
- **Alpine / nginx / php**: `apk upgrade`, then `rc-service php-fpm83 restart && rc-service nginx restart`

---

*This file replaces the old `nginx.txt` draft (a hand translation of the Apache
`.htaccess` — those rules now live in `docker/nginx/ryogasp.conf`) and the docker-era
`nginx_proxy.txt` reverse-proxy setup, which production no longer uses.*
