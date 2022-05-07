FROM gitpod/workspace-mongodb

RUN sudo apt-get update \
 && sudo apt-get install -y redis-server \
 && redis-server

RUN mkdir -p /workspace/data && mongod --dbpath /workspace/data