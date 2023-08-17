#!/usr/bin/env bash

read -p "place the dump file in the tmp/dump directory and press enter"
docker exec ryogasp-spip-1 spip sql:dump:restore --name ryogasp_2023xxxx
# docker exec -i ryogasp_mariadb_1 mysql --user=spip --password=spippassword spip < /dump-xxx.sql