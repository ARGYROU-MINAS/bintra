#!/bin/bash

echo "Start writing .env.test"

echo BIND_HOST=0.0.0.0 >.env.test
echo BIND_PORT=8080 >>.env.test
echo MONGO_USERNAME= >>.env.test
echo MONGO_PASSWORD= >>.env.test
echo MONGO_HOSTNAME=localhost >>.env.test
echo MONGO_PORT=27017 >>.env.test
echo MONGO_DB=bintra >>.env.test

echo "Content of .env.test"
ls -la |grep .env
cat .env.test

echo "NODE_ENV is ${NODE_ENV}"
