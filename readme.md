
# migration

how to migrate from remote spip to docker spip

## on remote

```
install spip-cli
~/.local/bin/spip sql:dump:create
```
copy on local
```
scp ryogasp.com:/home/ryogasp/ryogasp.com/www/tmp/dump/ryogasp_20200201.sqlite .

copy plugins
from `/src/` dir
scp -r ryogasp.com:/home/ryogasp/ryogasp.com/www/plugins ./plugins
```

## on local

(on ububtu 18)

### install docker and nginx

```
# apt-get install docker nginx

```
### user id matching
```
# systemctl enable docker

# adduser ryogasp
# usermod -aG docker ryogasp
# cat /etc/docker/daemon.json
{
  "userns-remap": "ryogasp"
}
```

### connect to docker and import

```
docker exec -it ryogasp_spip_1 bash
cd tmp/dump
spip sql:dump:restore --name ryogasp_20200428
```

you can check if everything went fine into mariadb
`docker exec -it ryogasp_mariadb_1 bash`

if this does not work, create a temporary superadmin
`spip auteurs:superadmin` if lang is fucked up, set spip_lang=fr into cookies

# configure nginx
## nginx as a proxy to docker container

check file doc/nginx_proxy.txt

## nginx with fastcgi to php-fpm

this will be for next upgrade
http://geekyplatypus.com/dockerise-your-php-application-with-nginx-and-php7-fpm/

## https

use certbot to en able https via letsencrypt
```
apt-get install certbot python-certbot-nginx
certbot --nginx
```
## on apache

get rid of default .htaccess and get the custom one

(from inside the container `docker exec -it ryogasp_spip_1 bash`)
```
curl -0 https://raw.githubusercontent.com/gasp/ryogasp/master/src/.htaccess > .htaccess
```

# reorganize folders
(todo)
put these dir outside the spip root path
redefine _DIR_TMP & _DIR_CONNECT constants in mes_options.php
