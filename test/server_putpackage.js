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
const UsersService = require('../service/UsersService.js');
const PackageService = require('../service/PackagesService.js');

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

const uauth = require('../utils/auth.js');

var packageid = "";
var tokenUser = "";

const pName = 'theName';
const pVersion = 'theVersion';
const pArch = 'theArchitecture';
const pFamily = 'debian';
const pHash = '44e978970ac5a511d4ba83364a76d81041ccd71129e57cdd8384cd460ff9bd35';

/**
 * Helper functions
 */
function getUserObject(username) {
	return new Promise(function(resolve, reject) {
		LoginModel.find({
			name: username
		})
			.then(itemFound => {
				if (1 == itemFound.length) {
					logger.info("Found user");
					resolve(itemFound[0]);
				} else {
					reject("Not found");
				}
			})
			.catch(err => {
				logger.error("getUser failed: " + err);
				reject("getUser failed");
			});
	});
}

describe('PFilter put server tests', function() {
	captureLogs();

	before(async () => {
		console.log("run before");
		const adminUtil = mongoose.connection.db.admin();
		const result = await adminUtil.ping();

		await LoginModel.deleteMany({});
		await PackageModel.deleteMany({});

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
				role: 'user',
				status: 'active'
			}
		});

		console.log("Login to get token");
		tokenUser = uauth.issueToken('max', 'user');
		console.log("Token: " + tokenUser);

		var userObject = await getUserObject("max");
		var tsnow = new Date();
		var packageNew = new PackageModel({
			name: pName,
			version: pVersion,
			arch: pArch,
			family: pFamily,
			hash: pHash,
			tscreated: tsnow,
			tsupdated: tsnow,
			creator: userObject
		});
		await packageNew.save();
	});

	context('[BINTRA-10] Check PUT action', () => {
		it('[STEP-1] Put one package again', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: pFamily,
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					reply.should.have.property('count', 2);
					done();
				});
		});
		it('[STEP-2] Put defect hash package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: pFamily,
					packageHash: pHash + 'Z'
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					reply.should.have.property('count', 3);
					done();
				});
		});
	});

	context('[BINTRA-11] Check paging', () => {
		it('[STEP-1] show paging interface', (done) => {
			request(server)
				.get('/v1/tableview')
				.query({
					page: 1,
					size: 10,
					sorters: 'tsupdated'
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body.data[0];
					reply.should.have.property('count', 3);
					done();
				});
		});
	});

	context('[BINTRA-] Add families', () => {
		it('[STEP-1] Put debian package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: 'debian',
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					done();
				});
		});
		it('[STEP-2] Put CentOS package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: 'CentOS',
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					done();
				});
		});
		it('[STEP-3] Put Fedora package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: 'Fedora',
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					done();
				});
		});
		it('[STEP-4] Put RedHat package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: 'RedHat',
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					done();
				});
		});
		it('[STEP-5] Put Windows package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: 'Windows',
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(200);
					var reply = res.body[0];
					done();
				});
		});
		it('[STEP-6] Put wrong case wINDows package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: 'wINDows',
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(400);
					done();
				});
		});
		it('[STEP-7] Put very wrong package', (done) => {
			request(server)
				.put('/v1/package')
				.query({
					packageName: pName,
					packageVersion: pVersion,
					packageArch: pArch,
					packageFamily: 'lalala',
					packageHash: pHash
				})
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					res.should.have.status(400);
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
