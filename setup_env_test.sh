#!/bin/bash

echo "Start writing .env.test"

echo BIND_HOST=0.0.0.0 >.env.test
echo BIND_PORT=8080 >>.env.test
echo MONGO_URL="mongodb://mongo/bintra?directConnection=true" >>.env.test
echo MONGO_USERNAME= >>.env.test
echo MONGO_PASSWORD= >>.env.test
echo MONGO_HOSTNAME=mongo >>.env.test
echo MONGO_PORT=27017 >>.env.test
echo MONGO_DB=bintra >>.env.test
echo JWT_SECRET=SomeSecret >>.env.test
echo JWT_ISSUER=127.0.0.1 >>.env.test
echo TOOTAPI=https:// >>.env.test
echo TOOTAUTH=XXX >>.env.test
echo MATOMO_URL=https://stat.myocastor.de/piwik.php >>.env.test
echo MATOMO_ID=141 >>.env.test
echo MATOMO_TOKEN_AUTH=SOMETHINGWRONG >>.env.test
echo MQTT_PROTO=mqtt >>.env.test
echo MQTT_HOSTNAME=localhost >>.env.test
echo MQTT_USERNAME= >>.env.test
echo MQTT_PASSWORD= >>.env.test

echo "Content of .env.test"
ls -la |grep .env
cat .env.test

echo "NODE_ENV is ${NODE_ENV}"
