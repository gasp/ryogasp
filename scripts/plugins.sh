#!/usr/bin/env bash

curl https://files.spip.org/core/breves-34b81-breves-v3.1.2.zip --output ../src/plugins/breves.zip
unzip ../src/plugins/breves.zip -d ../src/plugins/
docker exec ryogasp_spip_1 spip plugins:activer -y -e breves  

curl https://files.spip.org/spip-zone/spip-contrib-extensions/squelettes_par_rubrique-859cc-squelettes_par_rubrique-2.2.0.zip --output ../src/plugins/squelettes_par_rubrique.zip
unzip ../src/plugins/squelettes_par_rubrique.zip -d ../src/plugins/
docker exec ryogasp_spip_1 spip plugins:activer -y -e squelettes_par_rubrique

curl https://files.spip.org/spip-zone/spip-contrib-extensions/hash_documents-ea484-hash_documents-3.1.0.zip --output ../src/plugins/hash_documents.zip
unzip ../src/plugins/hash_documents.zip -d ../src/plugins/
docker exec ryogasp_spip_1 spip plugins:activer -y -e hasher

curl https://files.spip.org/spip-zone/spip-contrib-extensions/comments-5d6cc-comments-4.1.0.zip --output ../src/plugins/comments.zip
unzip ../src/plugins/comments.zip -d ../src/plugins/
docker exec ryogasp_spip_1 spip plugins:activer -y -e comments

