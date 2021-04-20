/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let request = require('supertest');

var PackageModel = require('../models/package.js');

chai.use(chaiHttp);

var LoginModel = require('../models/login.js');
var DomainModel = require('../models/domain.js');
const UsersService = require('../service/UsersService.js');
const PackageService = require('../service/PackagesService.js');

const uauth = require('../utils/auth.js');

var packageid = "";
var tokenUser = "";
var idUser = "";

const pName = 'theName';
const pVersion = 'theVersion';
const pArch = 'theArchitecture';
const pFamily = 'debian';
const pHash = '44e978970ac5a511d4ba83364a76d81041ccd71129e57cdd8384cd460ff9bd35';

const dName = 'example.xyz';

describe('PFilter put server tests', function() {
	before(async () => {
		console.log("run before");
		await DomainModel.deleteMany({});

                await LoginModel.deleteMany({name: 'max'});
                var oUserDefault = {username: 'max', email: 'test@example.com', password: 'xxx'};
                await UsersService.createUser(oUserDefault);
                await LoginModel.updateMany({name: 'max'}, { $set: {role: 'admin', status: 'active'} });

		console.log("Login to get token");
		tokenUser = uauth.issueToken('max', 'user');
		console.log("Token: " + tokenUser);
	});

	context('Check user actions', () => {
		it('List users', (done) => {
			request(server)
				.get('/v1/user')
				.auth(tokenUser, { type: 'bearer' })
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body;
					reply.should.have.lengthOf.above(0);
					idUser = reply[0]._id;
					done();
				});
		});
		it('set user status', (done) => {
                        request(server)
                                .put('/v1/user/' + idUser)
				.query({
					status: 'active'
				})
                                .auth(tokenUser, { type: 'bearer' })
                                .end((err, res) => {
                                        res.should.have.status(200);
                                        var reply = res.body;
                                        done();
                                });
                });
		it('patch user', (done) => {
			console.log("IDuser=" + idUser + "!");
                        request(server)
                                .patch('/v1/user/' + idUser)
                                .send([{
					op: "replace",
					path: "/email",
					value: "new@example.com"
                                }])
                                .auth(tokenUser, { type: 'bearer' })
                                .end((err, res) => {
                                        res.should.have.status(200);
                                        var reply = res.body;
                                        done();
                                });
                });
	});

	context('Check domain actions', () => {
                it('List domains', (done) => {
                        request(server)
                                .get('/v1/domains')
                                .auth(tokenUser, { type: 'bearer' })
                                .end((err, res) => {
                                        res.should.have.status(200);
                                        var reply = res.body;
                                        reply.should.have.lengthOf(0);
                                        done();
                                });
                });
		it('Check non existing domains', (done) => {
                        request(server)
                                .get('/v1/domain/' + dName)
                                .auth(tokenUser, { type: 'bearer' })
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
                                .auth(tokenUser, { type: 'bearer' })
                                .end((err, res) => {
                                        res.should.have.status(200);
                                        var reply = res.body[0];
                                        done();
                                });
                });
		it('Check existing domains', (done) => {
                        request(server)
                                .get('/v1/domain/' + dName)
                                .auth(tokenUser, { type: 'bearer' })
                                .end((err, res) => {
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
                                .auth(tokenUser, { type: 'bearer' })
                                .end((err, res) => {
                                        res.should.have.status(200);
                                        done();
                                });
                });
        });

	after(async () => {
		console.log("after run");
		await LoginModel.deleteMany({name: 'max'});
	});
});

