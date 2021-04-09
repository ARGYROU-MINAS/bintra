//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let request = require('supertest');

var LoginModel = require('../models/login.js');
const UsersService = require('../service/UsersService.js');

chai.use(chaiHttp);

var tokenUser = "";
var tokenAdmin = "";

describe('server roles', () => {
	before(async () => {
		console.log("prepare DB before");

		await LoginModel.deleteMany({name: 'max'});
		var oUserDefault = {username: 'max', email: 'test@example.com', password: 'xxx'};
		await UsersService.createUser(oUserDefault);
		await LoginModel.updateMany({name: 'max'}, { $set: {role: 'user', status: 'active'} });

		await LoginModel.deleteMany({name: 'bob'});
                var oUserAdmin = {username: 'bob', email: 'test@example.com', password: 'yyy'};
                await UsersService.createUser(oUserAdmin);
                await LoginModel.updateMany({name: 'bob'}, { $set: {role: 'admin', status: 'active'} });

		await LoginModel.deleteMany({name: 'joe'});
                var oUserInactive = {username: 'joe', email: 'test@example.com', password: 'zzz'};
                await UsersService.createUser(oUserInactive);
                await LoginModel.updateMany({name: 'joe'}, { $set: {role: 'user', status: 'register'} });
	});

	describe('[BINTRA-] Check login post', () => {
                it('[STEP-] wrong passsword for MAX should get error', (done) => {
                  request(server)
                      .post('/v1/login')
		      .set('content-type', 'application/x-www-form-urlencoded')
		      .send({username: 'max', password: 'nono'})
                      .end((err, res) => {
                            res.should.have.status(403);
                            res.body.should.have.property('message', 'Error: Credentials incorrect');
                            done();
                        });
                });
		it('[STEP-] inactive user JOE should get error', (done) => {
                  request(server)
                      .post('/v1/login')
                      .set('content-type', 'application/x-www-form-urlencoded')
                      .send({username: 'joe', password: 'zzz'})
                      .end((err, res) => {
                            res.should.have.status(403);
                            res.body.should.have.property('message', 'Error: Credentials incorrect');
                            done();
                        });
                });
		it('[STEP-] max as user should work', (done) => {
                  request(server)
                      .post('/v1/login')
                      .set('content-type', 'application/x-www-form-urlencoded')
                      .send({username: 'max', password: 'xxx'})
                      .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
			    tokenUser = res.body.token;
                            done();
                        });
                });
		it('[STEP-] bob as admin should work', (done) => {
                  request(server)
                      .post('/v1/login')
                      .set('content-type', 'application/x-www-form-urlencoded')
                      .send({username: 'bob', password: 'yyy'})
                      .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
			    tokenAdmin = res.body.token;
                            done();
                        });
                });
        });

	describe('[BINTRA-] Check admin only api calls', () => {
		it('[STEP-] no token should get error', (done) => {
                  request(server)
                      .get('/v1/packagesfull')
                      .end((err, res) => {
                            res.should.have.status(401);
                            done();
                        });
                });
		it('[STEP-] user token should get error', (done) => {
                  request(server)
                      .get('/v1/packagesfull')
		      .auth(tokenUser, { type: 'bearer' })
                      .end((err, res) => {
                            res.should.have.status(401);
                            done();
                        });
                });
		it('[STEP-] admintoken should work', (done) => {
                  request(server)
                      .get('/v1/packagesfull')
		      .auth(tokenAdmin, { type: 'bearer' })
                      .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
	});

});
