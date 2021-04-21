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
const UsersService = require('../service/UsersService.js');
const PackageService = require('../service/PackagesService.js');

const uauth = require('../utils/auth.js');

var packageid = "";
var tokenUser = "";

const pName = 'theName';
const pVersion = 'theVersion';
const pArch = 'theArchitecture';
const pFamily = 'debian';
const pHash = '44e978970ac5a511d4ba83364a76d81041ccd71129e57cdd8384cd460ff9bd35';

describe('PFilter put server tests', function() {
	before(async () => {
		console.log("run before");
		await PackageModel.deleteMany({});

		var tsnow = new Date();
		var packageNew = new PackageModel({name: pName, version: pVersion,
                                                   arch: pArch, family: pFamily,
                                                   hash: pHash, tscreated: tsnow, tsupdated: tsnow});
		await packageNew.save();

                await LoginModel.deleteMany({name: 'max'});
                var oUserDefault = {username: 'max', email: 'test@example.com', password: 'xxx'};
                await UsersService.createUser(oUserDefault);
                await LoginModel.updateMany({name: 'max'}, { $set: {role: 'admin', status: 'active'} });

		console.log("Login to get token");
		tokenUser = uauth.issueToken('max', 'user');
		console.log("Token: " + tokenUser);
	});

	context('Check PUT action', () => {
		it('Put one package again', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: pFamily,
					packageHash: pHash
				})
				.auth(tokenUser, { type: 'bearer' })
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					reply.should.have.property('count', 2);
					done();
				});
		});
	});
	context('finaly delete one package again', () => {
		it('remove one named package', (done) => {
                        request(server)
                                .delete('/v1/package')
                                .query({
                                        packageName: pName,
                                        packageVersion: pVersion,
                                        packageArch: pArch,
                                        packageFamily: pFamily,
                                        packageHash: pHash
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
		await PackageModel.deleteMany({});
	});
});

