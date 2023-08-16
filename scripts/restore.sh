#!/usr/bin/env bash

docker exec -i ryogasp_mariadb_1 mysql --user=spip --password=spippassword spip < /dump-xxx.sql