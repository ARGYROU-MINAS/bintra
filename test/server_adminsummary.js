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
let mongoose = require('../app').mongoose;
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

before(function (done) {
    logger.warn('Wait for app server start');
    if(server.didStart) done();
    server.on("appStarted", function() {
        logger.info('app server started');
        done();
    });
});

describe('server', () => {
	captureLogs();

	describe('[BINTRA-28] GET admin summary', () => {
		before(async () => {
			const adminUtil = mongoose.connection.db.admin();
			const result = await adminUtil.ping();

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
			logger.info("Token: " + tokenUser);

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
			logger.info("Call family API");
			request(server)
				.get('/v1/countPerCreator')
				.auth(tokenUser, {
					type: 'bearer'
				})
				.expect('Content-Type', /json/)
				.expect(200, done);
/*
				.end((err, res) => {
					logger.info("did get reply");
					res.should.have.status(200);
					res.body.should.have.property('summary');
					done();
				}); */
		});
	});

	after(async () => {
		logger.info("after run");
		await PackageModel.deleteMany({});
		await LoginModel.deleteMany({});
	});
});
