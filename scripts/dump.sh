#!/usr/bin/env bash

date=$(date '+%Y-%m-%d')
docker exec -it ryogasp_spip_1 spip sql:dump:create --name $date

docker exec ryogasp_mariadb_1 mariadb-dump --user=spip --password=spippassword spip > ./dump-$date.sql

