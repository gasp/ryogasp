#!/usr/bin/env bash

date=$(date '+%Y-%m-%d')
docker exec ryogasp_spip_1 spip sql:dump:create --name $date
docker exec ryogasp_mariadb_1 mariadb-dump --user=spip --password=spippassword spip > ./dump-$date.sql

gzip -9 ../src/tmp/dump/$date.sqlite
gzip -9 ./dump-$date.sql
mv ./dump-$date.sql.gz ../src/tmp/dump/

