/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
var chaiAsPromised = require('chai-as-promised');
let server = require('../app').app;
let request = require('supertest');

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "info";

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var LoginModel = require('../models/login.js');

const UsersService = require('../service/UsersService.js');

var JWT;

before(function (done) {
    logger.warn('Wait for app server start');
    if(server.didStart) done();
    server.on("appStarted", function() {
        logger.info('app server started');
        done();
    });
});

describe('User stuff', function() {
    captureLogs();

    before(async () => {
        logger.info("run before");

        await LoginModel.deleteMany({});

        var u = {
            username: 'max',
            email: 'test@example.com',
            password: 'xxx'
        };
        await UsersService.createUser(u);
        await LoginModel.updateMany({}, {
            $set: {
                status: 'active'
            }
        });
    });

    context('[BINTRA-31] login', function() {
        it('[STEP-1] Check user was created', (done) => {
            LoginModel.find({})
                .then(itemFound => {
                    logger.info("Login database filled: " + itemFound.length);
                    done();
                });
        });
        it('[STEP-2] should get token', (done) => {
            request(server)
                .post('/v1/login')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    username: 'max',
                    password: 'xxx'
                })
		.expect('Content-Type', /json/)
		.expect(200)
		.then(response => {
			logger.debug(response.body.token);
			response.body.should.have.property('token');
			done();
		})
		.catch(err => done(err));
        });
    });

    after(async () => {
        logger.info("after run");
        await LoginModel.deleteMany({});
    });
});
