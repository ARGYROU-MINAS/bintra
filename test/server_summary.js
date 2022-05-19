// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const PackageModel = require('../models/package.js');
const LoginModel = require('../models/login.js');
const util = require('util');
const UsersService = require('../service/UsersService.js');

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
        if (itemFound.length === 1) {
          logger.info('Found user');
          resolve(itemFound[0]);
        } else {
          reject(new Error('Not found'));
        }
      })
      .catch(err => {
        logger.error('getUser failed: ' + err);
        reject(new Error('getUser failed'));
      });
  });
}

before(function (done) {
  appWait(done);
});

describe('server', () => {
  captureLogs();

  describe('[BINTRA-27] GET user summary', () => {
    before(async () => {
      logger.info('In before method');
      const adminUtil = mongoose.connection.db.admin();
      logger.debug('do ping');
      await adminUtil.ping();

      logger.debug('Do delete max');
      await LoginModel.deleteMany({
        name: 'max'
      });

      const oUserDefault = {
        username: 'max',
        email: 'test@example.com',
        password: 'xxx'
      };
      logger.debug('Do create max');
      await UsersService.createUser(oUserDefault);

      logger.debug('Do update max');
      await LoginModel.updateMany({
        name: 'max'
      }, {
        $set: {
          role: 'admin',
          status: 'active'
        }
      });

      logger.debug('Do get max');
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
      logger.debug('Add new package');
      await packageNew.save();

      logger.info('End before method');
    });

    it('[STEP-1] get arch', (done) => {
      request(server)
        .get('/v1/summary/arch')
        .end((err, res) => {
          if (err) {
            logger.error(err);
            done(err);
          }
          res.should.have.status(200);
          res.should.be.json; // eslint-disable-line no-unused-expressions
          res.body.should.have.property('summary');
          done();
        });
    });
    it('[STEP-2] get family', (done) => {
      logger.info('Call family API');
      request(server)
        .get('/v1/summary/family')
        .end((err, res) => {
          if (err) {
            logger.error(err);
            done(err);
          }
          logger.info('did get reply');
          res.should.have.status(200);
          res.should.be.json; // eslint-disable-line no-unused-expressions
          res.body.should.have.property('summary');
          done();
        });
    });
  });

  after(async () => {
    logger.info('In after method');
    await PackageModel.deleteMany({});
    logger.info('End after method');
  });
});
