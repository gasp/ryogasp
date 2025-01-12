#!/usr/bin/env bash

date=$(date '+%Y-%m-%d')
docker exec ryogasp-spip-1 spip sql:dump:create --name $date
docker exec ryogasp-mariadb-1 mariadb-dump --user=spip --password=spippassword spip > ./dump-$date.sql

gzip -9 ../src/tmp/dump/$date.sqlite
gzip -9 ./dump-$date.sql
mv ./dump-$date.sql.gz ../src/tmp/dump/

