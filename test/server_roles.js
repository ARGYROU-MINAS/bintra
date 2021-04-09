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

describe('server roles', () => {
	before(async () => {
		console.log("prepare DB before");
		await LoginModel.deleteMany({name: 'max'});
		var oUserDefault = {username: 'max', email: 'test@example.com', password: 'xxx'};
		await UsersService.createUser(oUserDefault);
		await LoginModel.updateMany({name: 'max'}, { $set: {role: 'user', status: 'active'} });
	});

	describe('[BINTRA-] Check login post', () => {
                it('[STEP-] should get error', (done) => {
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
		it('[STEP-] should work', (done) => {
                  request(server)
                      .post('/v1/login')
                      .set('content-type', 'application/x-www-form-urlencoded')
                      .send({username: 'max', password: 'xxx'})
                      .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            done();
                        });
                });
        });

});
