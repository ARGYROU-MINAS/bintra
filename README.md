# bintra

Binary Transparency

## Links and references

https://unix.stackexchange.com/questions/401126/run-a-command-before-after-ubuntu-apt-upgrade-unattended-upgrades

Use DPkg::Pre-Install-Pkgs to inject a precheck, run API calls to backend

## Use own debian apt package repo

Create in /etc/apt/sources.list.d/bintra.list with

    deb [arch=all] https://nexus.myocastor.de/repository/bintra focal main

Add perhaps gpg key, see [gitlab wiki](https://gitlab.kretschmann.software/kai/bintra/-/wikis/Repository)

## run local for testing

    NODE_ENV=develop npm start
    NODE_ENV=test npm test

## add user manually

    docker exec -it bintra-nodejs bash
    root@bfedf154d642:/usr/src/app# npm run adduser USER PASSWD
    ^C

## update mongoDB

Add new property to existing data, like *family* attribute:

    mongo
    use bintra
    db.packagemodels.updateMany({}, {$set: {"family": "debian"}})

## backup mongoDB

    docker-compose exec -T database mongodump --gzip --archive|cat >dump_$(date '+%d-%m-%Y_%H-%M-%S').gz

## restore mongoDB

    docker-compose exec -T database mongorestore --archive --gzip < dump_xxx.gz

## adapt oas3 middleware

Copies the oas3-tools dist folder to own location in the project and changed the app object handling.
Still leaving the packages.json oas3 reference to keep dependencies.
Bloody fix until the main module has support for own app modifications included.

## CI stuff

### prepare docker container for gitlab stages

    docker login gitlab.kretschmann.software:5050 -u kai -p xxxx
    
    docker build -t gitlab.kretschmann.software:5050/kai/bintra:fat - <Dockerfile_fat
    docker push gitlab.kretschmann.software:5050/kai/bintra:fat
    
    docker build -t gitlab.kretschmann.software:5050/kai/bintra:deb - <Dockerfile_deb
    docker push gitlab.kretschmann.software:5050/kai/bintra:deb

Where using these files as docker configurations:

#### Dockerfile\_fat

    FROM node:14
    MAINTAINER Kai Kretschmann
    
    RUN apt-get update && apt-get install -y \
        mongodb

#### Dockerfile\_deb

    FROM debian:latest
    MAINTAINER Kai KRETSCHMANN
    
    RUN apt-get update && apt-get upgrade -y
    RUN apt-get install -y git dh-make build-essential
