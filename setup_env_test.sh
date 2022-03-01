#!/bin/bash

echo "Start writing .env.test"

echo BIND_HOST=0.0.0.0 >.env.test
echo BIND_PORT=8080 >>.env.test
echo MONGO_URL="mongodb://mongo/bintratest?directConnection=true" >>.env.test
echo MONGO_USERNAME= >>.env.test
echo MONGO_PASSWORD= >>.env.test
echo MONGO_HOSTNAME=mongo >>.env.test
echo MONGO_PORT=27017 >>.env.test
echo MONGO_DB=bintratest >>.env.test
echo JWT_SECRET=SomeSecret >>.env.test
echo JWT_ISSUER=127.0.0.1 >>.env.test
echo TOOTAPI=https:// >>.env.test
echo TOOTAUTH=XXX >>.env.test
echo MATOMO_URL=https://stat.myocastor.de/piwik.php >>.env.test
echo MATOMO_ID=141 >>.env.test
echo MATOMO_TOKEN_AUTH=SOMETHINGWRONG >>.env.test
echo MQTT_PROTO=mqtt >>.env.test
echo MQTT_HOSTNAME=mqtt >>.env.test
echo MQTT_USERNAME= >>.env.test
echo MQTT_PASSWORD= >>.env.test
echo SENTRY=${SENTRY_URL} >>.env.test
echo REDIS_HOSTNAME=redis >>.env.test
echo BUSY_LAG=150 >>.env.test
echo BUSY_INTERVAL=500 >>.env.test
echo LOGLEVEL=debug >>.env.test

echo "NODE_ENV is ${NODE_ENV}"

git rev-parse HEAD >.gitrevision
ls -la .
cat .gitrevision
