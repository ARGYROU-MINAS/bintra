// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const PackageModel = require('../models/package.js');
const LoginModel = require('../models/login.js');
const UsersService = require('../service/UsersService.js');
const util = require('util');
const uauth = require('../utils/auth.js');

// Require the dev-dependencies
const appWait = require('../utils/appwait').appWait;
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app').app;
const mongoose = require('../app').mongoose;
const should = chai.should();
const request = require('supertest');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

let tokenUser;

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiHttp);

/**
 * Helper functions
 */
function getUserObject (username) {
  return new Promise(function (resolve, reject) {
    LoginModel.find({
      name: username
    })
      .then(itemFound => {
        if (itemFound.length == 1) {
          logger.info('Found user');
          resolve(itemFound[0]);
        } else {
          reject('Not found');
        }
      })
      .catch(err => {
        logger.error('getUser failed: ' + err);
        reject('getUser failed');
      });
  });
}

before(function (done) {
  appWait(done);
});

describe('server', () => {
  captureLogs();

  describe('[BINTRA-28] GET admin summary', () => {
    before(async () => {
      const adminUtil = mongoose.connection.db.admin();
      const result = await adminUtil.ping();

      await PackageModel.deleteMany({});
      await LoginModel.deleteMany({});

      const oUserDefault = {
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
      logger.info('Token: ' + tokenUser);

      const userObject = await getUserObject('max');
      const tsnow = new Date();
      const packageNew = new PackageModel({
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
      logger.info('Call family API');
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
    logger.info('after run');
    await PackageModel.deleteMany({});
    await LoginModel.deleteMany({});
  });
});
