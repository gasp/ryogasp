# system requirements

- choose any ubuntu/debian distro
- install docker and nginx `apt-get install docker nginx`
- docker user id matching

```bash
systemctl enable docker

adduser ryogasp
usermod -aG docker ryogasp
cat /etc/docker/daemon.json
{
  "userns-remap": "ryogasp"
}
```

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

# configure nginx

## nginx as a proxy to docker container

check file doc/nginx_proxy.txt

## nginx with fastcgi to php-fpm

this will be for next upgrade
http://geekyplatypus.com/dockerise-your-php-application-with-nginx-and-php7-fpm/

## https

use certbot to en able https via letsencrypt

```bash
apt-get install certbot python-certbot-nginx
certbot --nginx
```

## on apache

get rid of default .htaccess and get the custom one

(from inside the container `docker exec -it ryogasp-spip-1 bash`)

```bash
curl -0 https://raw.githubusercontent.com/gasp/ryogasp/refs/heads/master/src/ryogasp.htaccess > .htaccess
```

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
