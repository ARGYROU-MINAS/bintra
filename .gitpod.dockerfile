FROM gitpod/workspace-full

RUN mkdir -p /workspace/data && mongod --dbpath /workspace/data
