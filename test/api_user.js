/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
let server = require('../app');
let request = require('supertest');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');

const service = require('../service/PackagesService.js');

var JWT;

describe('User stuff', function() {
	before(async () => {
		console.log("run before");
		await PackageModel.deleteMany({});
		await LoginModel.deleteMany({});
		var u = {username: 'max', email: 'test@example.com', password: 'xxx'};
		await service.createUser(u);
		await LoginModel.updateMany({}, { $set: {status: 'active' }});
	});

	context('[STEP-] login', function() {
		it('Check user was created', (done) => {
			LoginModel.find({})
				.then(itemFound => {
					console.log("Query logins worked, mount=" + itemFound.length);
					done();
				});
		});
	        it('[STEP-] should get token', (done) => {
                  request(server)
                      .post('/v1/login')
                      .set('content-type', 'application/x-www-form-urlencoded')
                      .send({username: 'max', password: 'xxx'})
                      .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
			    JWT = res.body.token;
			    console.log(JWT);
                            done();
                        });
                });
		it('List users', (done) => {
                        service.listUsers()
                                .then(itemFound => {
					itemFound.should.have.length(1);
					idUser = itemFound[0]._id;
                                        done();
                                });
                });
		it('List user', (done) => {
                        service.listUser(idUser)
                                .then(itemFound => {
                                        itemFound.should.have.property('email');
                                        done();
                                });
                });
	});

        context('[BINTRA-] Check default auth', () => {
                it('[STEP-] should get default', (done) => {
                  request(server)
                      .get('/v1/token')
		      .set('Authorization', 'Bearer ' + JWT)
                      .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('tsfrom');
                            done();
                        });
                });
        });

	/*context('Destroy user', () => {
		var idUser;
		it('List users once more', (done) => {
                        service.listUsers()
                                .then(itemFound => {
                                        itemFound.should.have.length(1);
                                        idUser = itemFound[0]._id;
                                        done();
                                });
                });
		it('Put user status', (done) => {
			console.log('set user ' + idUser + ' to disabled');
                        service.putUserStatus(idUser, 'disabled')
                                .then(itemFound => {
                                        itemFound.should.have.property('status', 'disabled');
                                        done();
                                });
                });
	}); */

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
                await LoginModel.deleteMany({});
	});
});

