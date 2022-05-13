/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app').app;
let mongoose = require('../app').mongoose;
let should = chai.should();
let request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

var PackageModel = require('../models/package.js');

chai.use(chaiHttp);

var LoginModel = require('../models/login.js');
var DomainModel = require('../models/domain.js');
const UsersService = require('../service/UsersService.js');
const PackageService = require('../service/PackagesService.js');

const uauth = require('../utils/auth.js');

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

var packageid = "";
var tokenUser = "";
var idUser = "";

const pName = 'theName';
const pVersion = 'theVersion';
const pArch = 'theArchitecture';
const pFamily = 'debian';
const pHash = '44e978970ac5a511d4ba83364a76d81041ccd71129e57cdd8384cd460ff9bd35';

const dName = 'example.xyz';

before(function (done) {
    logger.warn('Wait for app server start');
    if(server.didStart) done();
    server.on("appStarted", function() {
        logger.info('app server started');
        done();
    });
});

describe('PFilter put server tests', function() {
    captureLogs();

    before(async () => {
        logger.info("run before");
	const adminUtil = mongoose.connection.db.admin();
	const result = await adminUtil.ping();

        await DomainModel.deleteMany({});

        await LoginModel.deleteMany({
            name: 'max'
        });
        var oUserDefault = {
            username: 'max',
            email: 'test@example.com',
            password: 'xxx'
        };
        await UsersService.createUser(oUserDefault);
        await LoginModel.updateMany({
            name: 'max'
        }, {
            $set: {
                role: 'admin',
                status: 'active'
            }
        });

        await LoginModel.deleteMany({
            name: 'bob'
        });
        var oUserDummy = {
            username: 'bob',
            email: 'trash@example.com',
            password: 'abc'
        };
        await UsersService.createUser(oUserDummy);
        await LoginModel.updateMany({
            name: 'bob'
        }, {
            $set: {
                role: 'user',
                status: 'active'
            }
        });

        logger.info("Login to get token");
        tokenUser = uauth.issueToken('max', 'user');
        logger.info("Token: " + tokenUser);
    });

    context('Check user actions', () => {
        it('List users', (done) => {
            request(server)
                .get('/v1/user')
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
			logger.error(err);
			done(err);
		    }
                    res.should.have.status(200);
		    res.should.be.json;
                    var reply = res.body;
                    reply.should.have.lengthOf.above(0);
                    done();
                });
        });
        it('Get bob users', (done) => {
            request(server)
                .get('/v1/username/bob')
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
		    res.should.be.json;
                    var reply = res.body;
                    idUser = reply._id;
                    logger.info("Bob user id=" + idUser);
                    done();
                });
        });
        it('Get wrong username', (done) => {
            request(server)
                .get('/v1/username/4huhu_')
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });
        it('List user', (done) => {
            request(server)
                .get('/v1/user/' + idUser)
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
		    res.should.be.json;
                    var reply = res.body;
                    done();
                });
        });
        it('set user status', (done) => {
            request(server)
                .put('/v1/user/' + idUser)
                .query({
                    status: 'active'
                })
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
		    res.should.be.json;
                    var reply = res.body;
                    done();
                });
        });
        it('patch user', (done) => {
            request(server)
                .patch('/v1/user/' + idUser)
                .send([{
                    op: "replace",
                    path: "/email",
                    value: "new@example.com"
                }])
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
		    res.should.be.json;
                    var reply = res.body;
                    done();
                });
        });
        it('delete user', (done) => {
            request(server)
                .delete('/v1/user/' + idUser)
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
		    res.should.be.json;
                    var reply = res.body;
                    done();
                });
        });
    });

    context('Check domain actions', () => {
        it('List domains', (done) => {
            request(server)
                .get('/v1/domains')
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
                    var reply = res.body;
                    reply.should.have.lengthOf(0);
                    done();
                });
        });
        it('Check non existing domains', (done) => {
            request(server)
                .get('/v1/domain/' + dName)
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
        it('Put domain', (done) => {
            request(server)
                .put('/v1/domains')
                .query({
                    name: dName
                })
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
                    var reply = res.body[0];
                    done();
                });
        });
        it('Check existing domains', (done) => {
            request(server)
                .get('/v1/domain/' + dName)
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
                    done();
                });
        });
        it('Delete domain', (done) => {
            request(server)
                .delete('/v1/domains')
                .query({
                    name: dName
                })
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
		    if(err) {
                        logger.error(err);
                        done(err);
                    }
                    res.should.have.status(200);
                    done();
                });
        });
        it('Delete non existing domain', (done) => {
            request(server)
                .delete('/v1/domains')
                .query({
                    name: 'sillyname'
                })
                .auth(tokenUser, {
                    type: 'bearer'
                })
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
    });

    after(async () => {
        logger.info("after run");
        await LoginModel.deleteMany({
            name: 'max'
        });
	await DomainModel.deleteMany({});
    });
});
