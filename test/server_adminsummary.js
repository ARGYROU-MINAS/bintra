//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');
const UsersService = require('../service/UsersService.js');
var util = require('util');
const uauth = require('../utils/auth.js');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app').app;
let should = chai.should();
let request = require('supertest');

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

var tokenUser;

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiHttp);

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

describe('server', () => {
	captureLogs();

	describe('[BINTRA-28] GET admin summary', () => {
		before(async () => {
			await PackageModel.deleteMany({});
			await LoginModel.deleteMany({});

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
			tokenUser = uauth.issueToken('max', 'user');
			console.log("Token: " + tokenUser);

			var userObject = await getUserObject("max");
			var tsnow = new Date();
			var packageNew = new PackageModel({
				name: 'theName',
				version: 'theVersion',
				arch: 'theArchitecture',
				family: 'theFamily',
				hash: 'theHash',
				tscreated: tsnow,
				tsupdated: tsnow,
				creator: userObject
			});
			await packageNew.save();
		});

		it('[STEP-1] get countPerCreator', (done) => {
			console.log("Call family API");
			request(server)
				.get('/v1/countPerCreator')
				.auth(tokenUser, {
					type: 'bearer'
				})
				.end((err, res) => {
					console.log("did get reply");
					res.should.have.status(200);
					res.body.should.have.property('summary');
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
