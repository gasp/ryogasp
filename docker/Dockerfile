# syntax=docker/dockerfile:1
# ryogasp.com — SPIP served by nginx + php-fpm on Alpine Linux (no Apache).
#
#   docker compose build            # uses the defaults below
#   docker compose build --build-arg SPIP_VERSION=4.3.9
#
ARG ALPINE_VERSION=3.22

# ---------------------------------------------------------------------------
# Stage 1: fetch SPIP core and spip-cli. curl/unzip/git/composer stay out of the runtime image.
# ---------------------------------------------------------------------------
FROM alpine:${ALPINE_VERSION} AS build
ARG SPIP_VERSION=4.3.5
ARG SPIP_CLI_VERSION=2.0.1

RUN apk add --no-cache curl unzip git composer

RUN curl -fsSL "https://files.spip.net/spip/archives/spip-v${SPIP_VERSION}.zip" -o /tmp/spip.zip \
 && mkdir -p /spip \
 && unzip -q /tmp/spip.zip -d /spip \
 && rm /tmp/spip.zip \
 && grep -q "spip_version_branche = '${SPIP_VERSION}'" /spip/ecrire/inc_version.php

# spip-cli (the `spip` command used by scripts/*.sh: sql:dump:create, plugins:activer, ...)
RUN git clone --quiet --depth 1 --branch "${SPIP_CLI_VERSION}" https://git.spip.net/spip-contrib-outils/spip-cli.git /spip-cli \
 && cd /spip-cli \
 && composer install --no-dev --no-interaction --no-progress --optimize-autoloader \
 && rm -rf .git

# ---------------------------------------------------------------------------
# Stage 2: runtime image
# ---------------------------------------------------------------------------
FROM alpine:${ALPINE_VERSION}

# uid/gid 33 = www-data in the previous Debian based image (ipeos/spip), so files created by the
# old container (IMG uploads, config, cache) keep their owner on a Linux host. Override if needed:
#   docker compose build --build-arg SPIP_UID=1000 --build-arg SPIP_GID=1000
ARG SPIP_UID=33
ARG SPIP_GID=33

# PHP 8.3 with the same extensions as the previous image (php -m), plus nginx, nc (db wait), su-exec (drop root)
RUN apk add --no-cache \
      nginx netcat-openbsd su-exec tzdata \
      php83 php83-fpm php83-opcache \
      php83-bcmath php83-ctype php83-curl php83-dom php83-exif php83-fileinfo php83-gd \
      php83-iconv php83-intl php83-ldap php83-mbstring php83-mysqli php83-openssl \
      php83-pdo php83-pdo_sqlite php83-phar php83-posix php83-session php83-simplexml \
      php83-sodium php83-sqlite3 php83-tokenizer php83-xml php83-xmlreader php83-xmlwriter \
      php83-zip php83-zlib php83-pecl-apcu php83-pecl-imagick \
 && ln -sf /usr/bin/php83 /usr/local/bin/php

# Single runtime user for nginx workers and php-fpm (they share a unix socket and SPIP's writable dirs)
RUN set -eu; \
    for u in $(getent passwd "${SPIP_UID}" | cut -d: -f1) www-data; do deluser "$u" 2>/dev/null || true; done; \
    for g in $(getent group "${SPIP_GID}" | cut -d: -f1) www-data; do delgroup "$g" 2>/dev/null || true; done; \
    addgroup -g "${SPIP_GID}" -S www-data; \
    adduser -u "${SPIP_UID}" -S -D -H -G www-data -h /var/www/html -s /sbin/nologin www-data

COPY --from=build /spip /var/www/html
COPY --from=build /spip-cli /opt/spip-cli

COPY spip                    /usr/local/bin/spip
COPY docker-entrypoint.sh    /usr/local/bin/docker-entrypoint.sh
COPY nginx/nginx.conf        /etc/nginx/nginx.conf
COPY nginx/fastcgi-spip.conf /etc/nginx/fastcgi-spip.conf
COPY nginx/ryogasp.conf      /etc/nginx/http.d/ryogasp.conf
COPY php/php-fpm.conf        /etc/php83/php-fpm.conf
COPY php/www.conf            /etc/php83/php-fpm.d/www.conf
COPY php/spip.ini            /etc/php83/conf.d/90-spip.ini

RUN set -eu; \
    rm -f /etc/nginx/http.d/default.conf; \
    chmod +x /usr/local/bin/spip /usr/local/bin/docker-entrypoint.sh; \
    cd /var/www/html; \
    # directories SPIP writes to (IMG, config, plugins, squelettes, tmp/dump are bind mounts in docker-compose.yml)
    mkdir -p tmp/dump tmp/log tmp/upload local lib plugins/auto squelettes IMG config; \
    chown -R www-data:www-data tmp local lib plugins squelettes IMG config; \
    nginx -t; \
    php-fpm83 --test

# Same variables as the previous ipeos/spip image (docker-compose.yml overrides what it needs)
ENV SPIP_DB_SERVER=mysql \
    SPIP_DB_HOST=mysql \
    SPIP_DB_LOGIN=spip \
    SPIP_DB_PASS=spip \
    SPIP_DB_NAME=spip \
    SPIP_DB_PREFIX=spip \
    SPIP_AUTO_INSTALL=1 \
    SPIP_SITE_ADDRESS=http://localhost \
    SPIP_ADMIN_NAME=Admin \
    SPIP_ADMIN_LOGIN=admin \
    SPIP_ADMIN_EMAIL=admin@spip \
    SPIP_ADMIN_PASS=adminadmin \
    PHP_MAX_EXECUTION_TIME=60 \
    PHP_MEMORY_LIMIT=256M \
    PHP_POST_MAX_SIZE=40M \
    PHP_UPLOAD_MAX_FILESIZE=32M \
    PHP_TIMEZONE=Europe/Paris

WORKDIR /var/www/html
EXPOSE 80

# php-fpm ping through nginx: fails if either server is down
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/fpm-ping || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["serve"]
