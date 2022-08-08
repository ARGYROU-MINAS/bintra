# bintra

Binary Transparency

## Sidekiq like queue

Using [node-resque](https://github.com/actionhero/node-resque) for running delayed mastodon toots and more in future.

## run local for testing

    NODE_ENV=develop npm start
    NODE_ENV=test npm test
    NODE_ENV=test npm run testlink
    NODE_ENV=test npm run combined

The combined is a special testrun, configured by an additional json file runnin gmultiple output formats from onw testrun.

## Mongo commands

Using *mongosh* to manually work within the tables:

    db.adminCommand({listDatabases:1})
    show dbs
    use bintra
    show collections
    db.loginmodels.find()

## add user manually

    docker exec -it bintra-nodejs bash
    root@bfedf154d642:/usr/src/app# npm run adduser USER PASSWD
    ^C

## update mongoDB

Add new property to existing data, like *family* attribute:

    mongo
    use bintra
    db.packagemodels.updateMany({}, {$set: {"family": "debian"}})

Setting a simple attribute on a user entry:

    db.loginmodels.updateOne({_id: ObjectId("60279...53d")}, { $set: { email: "kai@example.com"} })

## cleanup test db

To remove old entries before running a local test:

    test> use bintratemp
    switched to db bintratemp
    bintratemp> show collections
    domainmodels
    loginmodels
    packagemodels
    bintratemp> db.packagemodels.deleteMany({})
    { acknowledged: true, deletedCount: 0 }
    bintratemp> db.loginmodles.deleteMany({})
    { acknowledged: true, deletedCount: 0 }
    bintratemp> db.domainmodles.deleteMany({})
    { acknowledged: true, deletedCount: 0 }


## other mongodb stuff

To read out the existing index definitions run from mongosh:

    bintra> db.packagemodels.getIndexes()

and to get the usage stats per index

    bintra> db.packagemodels.aggregate( [ { $indexStats: { } } ] )

## docker logs

Looking into a running service log:

    docker logs bintra-nodejs
    docker logs bintra-mongo

## backup mongoDB

    docker-compose exec -T database mongodump --gzip --archive|cat >dump_$(date '+%d-%m-%Y_%H-%M-%S').gz

## restore mongoDB

    docker-compose exec -T database mongorestore --archive --gzip < dump_xxx.gz

## adapt oas3 middleware

Copies the oas3-tools dist folder to own location in the project and changed the app object handling.
Still leaving the packages.json oas3 reference to keep dependencies.
Bloody fix until the main module has support for own app modifications included.

## CI stuff

Gitlab feature _environment_ is going to be used. First for production only, later also for staging test purposes.

### prepare docker container for gitlab stages

Can be run by setting _DODOCKER_ variable in CI run, or manually:

    docker login registry.kretschmann.software -u kai -p xxxx
    
    docker build -t registry.kretschmann.software/kai/bintra:fat - <Dockerfile_fat
    docker push registry.kretschmann.software/kai/bintra:fat
    
    docker build -t registry.kretschmann.software/kai/bintra:deb - <Dockerfile_deb
    docker push registry.kretschmann.software/kai/bintra:deb

    docker build -t kkretsch/bintra:latest -f Dockerfile .
    docker push kkretsch/bintra:latest

Where using these files as docker configurations:

#### Dockerfile\_fat

    FROM node:16
    MAINTAINER Kai Kretschmann
    
    RUN apt-get update && apt-get install -y \
        mongodb

#### Dockerfile\_deb

    FROM debian:latest
    MAINTAINER Kai KRETSCHMANN
    
    RUN apt-get update && apt-get upgrade -y
    RUN apt-get install -y git dh-make build-essential

## Versions

Things to update in the moment before tagging:

* package.json: version
* package-lock.json: version
* sonar-project.properties: sonar.projectVersion
* api/swagger.yaml: info.version
* VERSION.cpe
* VERSION.xml
* CHANGELOG

# Automated documentation

Gitlab pages found here: [pages](https://kgroup.kretschmann.fyi/bintra/)
