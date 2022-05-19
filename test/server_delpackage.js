/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

const appWait = require('../utils/appwait').appWait;
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app').app;
const mongoose = require('../app').mongoose;
const should = chai.should();
const request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

const PackageModel = require('../models/package.js');

chai.use(chaiHttp);

const LoginModel = require('../models/login.js');
const UsersService = require('../service/UsersService.js');

const uauth = require('../utils/auth.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

let idPackage = '';
let tokenUser = '';

const pName = 'theName';
const pVersion = 'theVersion';
const pArch = 'theArchitecture';
const pFamily = 'debian';
const pHash = '44e978970ac5a511d4ba83364a76d81041ccd71129e57cdd8384cd460ff9bd35';

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

describe('PFilter put server tests', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');
    const adminUtil = mongoose.connection.db.admin();
    await adminUtil.ping();

    await PackageModel.deleteMany({});
    await LoginModel.deleteMany({
      name: 'max'
    });
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

    logger.info('Login to get token');
    tokenUser = uauth.issueToken('max', 'user');
    logger.info('Token: ' + tokenUser);

    const userObject = await getUserObject('max');
    const tsnow = new Date();
    const packageNew = new PackageModel({
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

  context('[BINTRA-7] Check PUT/DELETE action', () => {
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
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          const reply = res.body[0];
          reply.should.have.property('count', 2);
          idPackage = reply._id;
          done();
        });
    });
    it('[STEP-2] remove one wrong named package', (done) => {
      request(server)
        .delete('/v1/package')
        .query({
          packageName: 'sillyname',
          packageVersion: pVersion,
          packageArch: pArch,
          packageFamily: pFamily,
          packageHash: pHash
        })
        .auth(tokenUser, {
          type: 'bearer'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });
    it('[STEP-3] remove one named package', (done) => {
      request(server)
        .delete('/v1/package')
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
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          done();
        });
    });
    it('[STEP-4] remove one ID package which is gone already', (done) => {
      request(server)
        .delete('/v1/package/' + idPackage)
        .auth(tokenUser, {
          type: 'bearer'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });
    it('[STEP-5] Put one more package', (done) => {
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
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          const reply = res.body[0];
          reply.should.have.property('count', 1);
          idPackage = reply._id;
          done();
        });
    });
    it('[STEP-6] remove one ID package', (done) => {
      request(server)
        .delete('/v1/package/' + idPackage)
        .auth(tokenUser, {
          type: 'bearer'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          done();
        });
    });
  });

  after(async () => {
    logger.info('after run');
    await PackageModel.deleteMany({});
  });
});
