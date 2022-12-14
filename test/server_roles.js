// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the dev-dependencies
const appWait = require('../utils/appwait').appWait;
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app').app;
const mongoose = require('../app').mongoose;
const should = chai.should();
const request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

const LoginModel = require('../models/login.js');
const UsersService = require('../service/UsersService.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

chai.use(chaiHttp);

let tokenUser = '';
let tokenAdmin = '';

before(function (done) {
  appWait(done);
});

describe('server roles', () => {
  captureLogs();

  before(async () => {
    logger.info('prepare DB before');
    const adminUtil = mongoose.connection.db.admin();
    await adminUtil.ping();

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
        role: 'user',
        status: 'active'
      }
    });

    await LoginModel.deleteMany({
      name: 'bob'
    });
    const oUserAdmin = {
      username: 'bob',
      email: 'test@example.com',
      password: 'yyy'
    };
    await UsersService.createUser(oUserAdmin);
    await LoginModel.updateMany({
      name: 'bob'
    }, {
      $set: {
        role: 'admin',
        status: 'active'
      }
    });

    await LoginModel.deleteMany({
      name: 'joe'
    });
    const oUserInactive = {
      username: 'joe',
      email: 'test@example.com',
      password: 'zzz'
    };
    await UsersService.createUser(oUserInactive);
    await LoginModel.updateMany({
      name: 'joe'
    }, {
      $set: {
        role: 'user',
        status: 'register'
      }
    });
  });

  describe('[BINTRA-12] Check user role logins', () => {
    it('[STEP-1] wrong passsword for MAX should get error', (done) => {
      request(server)
        .post('/v1/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          username: 'max',
          password: 'nono'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(403);
          res.body.should.have.property('message', 'Error: Credentials incorrect');
          done();
        });
    });
    it('[STEP-2] inactive user JOE should get error', (done) => {
      request(server)
        .post('/v1/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          username: 'joe',
          password: 'zzz'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(403);
          res.body.should.have.property('message', 'Error: Credentials incorrect');
          done();
        });
    });
    it('[STEP-3] max as user should work', (done) => {
      request(server)
        .post('/v1/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          username: 'max',
          password: 'xxx'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.body.should.have.property('token');
          tokenUser = res.body.token;
          done();
        });
    });
    it('[STEP-4] bob as admin should work', (done) => {
      request(server)
        .post('/v1/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          username: 'bob',
          password: 'yyy'
        })
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.body.should.have.property('token');
          tokenAdmin = res.body.token;
          done();
        });
    });
  });

  describe('[BINTRA-13] Check admin only api calls', () => {
    it('[STEP-1] no token should get error', (done) => {
      request(server)
        .get('/v1/packagesfull')
        .end((err, res) => {
          if (err) {
            logger.error(err);
            done(err);
          }
          res.should.have.status(401);
          done();
        });
    });
    it('[STEP-2] user token should get error', (done) => {
      request(server)
        .get('/v1/packagesfull')
        .auth(tokenUser, {
          type: 'bearer'
        })
        .end((err, res) => {
          if (err) {
            logger.error(err);
            done(err);
          }
          res.should.have.status(401);
          done();
        });
    });
    it('[STEP-3] admintoken should work', (done) => {
      request(server)
        .get('/v1/packagesfull')
        .auth(tokenAdmin, {
          type: 'bearer'
        })
        .end((err, res) => {
          if (err) {
            logger.error(err);
            done(err);
          }
          res.should.have.status(200);
          done();
        });
    });
    it('[STEP-4] get versions', (done) => {
      request(server)
        .get('/v1/versions')
        .auth(tokenAdmin, {
          type: 'bearer'
        })
        .end((err, res) => {
          if (err) {
            logger.error(err);
            done(err);
          }
          res.should.have.status(200);
          logger.info(res.body);
          res.body.should.have.property('node');
          done();
        });
    });
  });

  after(async () => {
    logger.info('after run');
    await LoginModel.deleteMany({});
  });
});
