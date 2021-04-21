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

const UsersService = require('../service/UsersService.js');
const PackagesService = require('../service/PackagesService.js');

var JWT;

describe('User stuff', function() {
	before(async () => {
		console.log("run before");

		await PackageModel.deleteMany({});
		await LoginModel.deleteMany({});

		var u = {username: 'max', email: 'test@example.com', password: 'xxx'};
		await UsersService.createUser(u);
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
                        UsersService.listUsers()
                                .then(itemFound => {
					itemFound.should.have.length(1);
					idUser = itemFound[0]._id;
                                        done();
                                });
                });
		it('List user', (done) => {
                        UsersService.listUser(idUser)
                                .then(itemFound => {
                                        itemFound.should.have.property('email');
                                        done();
                                });
                });
		it('Check role', (done) => {
                        UsersService.hasRole('max', ['user'])
                                .then(itemFound => {
                                        done();
                                });
                });
		it('Check role with wrong role', (done) => {
                        UsersService.hasRole('max', ['admin'])
                                .then(itemFound => {
					console.error("Sould not pass");
				})
				.catch(err => {
					console.log("expected error");
					done();
                                });
                });
		it('Check role with wrong user', (done) => {
                        UsersService.hasRole('sam', ['user'])
                                .then(itemFound => {
					console.error("should not pass");
				 })
                                .catch(err => {
                                        console.log("expected error");
                                        done();
                                });
                });
		it('Check active user', (done) => {
                        UsersService.isActiveUser('max')
                                .then(itemFound => {
                                        done();
                                });
                });
		it('Check active with wrong user', (done) => {
                        UsersService.isActiveUser('sam')
                                .then(itemFound => {
                                        console.error("should not pass");
                                 })
                                .catch(err => {
                                        console.log("expected error");
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
		it('Add package in users name', (done) => {
                        PackagesService.validatePackage('theName', 'theVersion', 'theArch', 'debian', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'max')
                                .then(itemFound => {
                                        itemFound.should.have.length(1);
					//var oneItem = itemFound[0];
					//oneItem.shouldhave.property('name', 'theName');
                                        done();
                                });
                });
		it('Add again package in users name', (done) => {
                        PackagesService.validatePackage('theName', 'theVersion', 'theArch', 'debian', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'max')
                                .then(itemFound => {
                                        itemFound.should.have.length(1);
                                        done();
                                });
                });
        });

	context('Destroy user', () => {
		var idUser;
		it('List users once more', (done) => {
                        UsersService.listUsers()
                                .then(itemFound => {
                                        itemFound.should.have.length(1);
                                        idUser = itemFound[0]._id;
                                        done();
                                });
                });
	/*	it('Put user status', (done) => {
			console.log('set user ' + idUser + ' to disabled');
                        UsersService.putUserStatus(idUser, 'disabled')
                                .then(itemFound => {
                                        itemFound.should.have.property('status', 'disabled');
                                        done();
                                });
                });*/
		 it('Delete user', (done) => {
                        UsersService.deleteUser(idUser)
                                .then(itemFound => {
                                        itemFound.should.have.property('status', 'deleted');
                                        done();
                                });
                });
	});

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
                await LoginModel.deleteMany({});
	});
});

