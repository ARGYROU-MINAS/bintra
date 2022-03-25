//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');
var util = require('util');
const UsersService = require('../service/UsersService.js');

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

	describe('[BINTRA-27] GET user summary', () => {
		before(async () => {
			logger.info("In before method");
			const adminUtil = mongoose.connection.db.admin();
			logger.debug("do ping");
			const result = await adminUtil.ping();

			logger.debug("Do delete max");
			await LoginModel.deleteMany({
				name: 'max'
			});

			var oUserDefault = {
				username: 'max',
				email: 'test@example.com',
				password: 'xxx'
			};
			logger.debug("Do create max");
			await UsersService.createUser(oUserDefault);

			logger.debug("Do update max");
			await LoginModel.updateMany({
				name: 'max'
			}, {
				$set: {
					role: 'admin',
					status: 'active'
				}
			});

			logger.debug("Do get max");
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
			logger.debug("Add new package");
			await packageNew.save();

			logger.info("End before method");
		});

		it('[STEP-1] get arch', (done) => {
			request(server)
				.get('/v1/summary/arch')
				.end((err, res) => {
					res.should.have.status(200);
					res.body.should.have.property('summary');
					done();
				});
		});
		it('[STEP-2] get family', (done) => {
			logger.info("Call family API");
			request(server)
				.get('/v1/summary/family')
				.end((err, res) => {
					logger.info("did get reply");
					res.should.have.status(200);
					res.body.should.have.property('summary');
					done();
				});
		});
	});

	after(async () => {
		logger.info("In after method");
		await PackageModel.deleteMany({});
		logger.info("End after method");
	});
});
