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

var tokenUser;

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiHttp);

describe('server', () => {
    captureLogs();

    describe('[BINTRA-] GET summary', () => {
        before(async () => {
            var tsnow = new Date();
            var packageNew = new PackageModel({
                name: 'theName',
                version: 'theVersion',
                arch: 'theArchitecture',
                family: 'theFamily',
                hash: 'theHash',
                tscreated: tsnow,
                tsupdated: tsnow
            });
            await packageNew.save();

            await LoginModel.deleteMany({
                name: 'max'
            });
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
        });

	it('[STEP-] get countPerCreator', (done) => {
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
    });
});
