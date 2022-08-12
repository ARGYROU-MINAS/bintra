// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const DomainModel = require('../models/domain.js');
const LoginModel = require('../models/login.js');
const UsersService = require('../service/UsersService.js');
const uauth = require('../utils/auth.js');

// Require the dev-dependencies
const appWait = require('../utils/appwait').appWait;
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app').app;
const mongoose = require('../app').mongoose;
const should = chai.should();
const request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

chai.use(chaiHttp);

let tokenUser = '';
let tokenShortUser = '';

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

before(function (done) {
  appWait(done);
});

describe('server', () => {
  captureLogs();

  before(async () => {
    logger.info('run before');
    const adminUtil = mongoose.connection.db.admin();
    await adminUtil.ping();

    await DomainModel.deleteMany({});

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

    await LoginModel.deleteMany({
      name: 'bob'
    });
    const oUserDummy = {
      username: 'bob',
      email: 'trash@example.com',
      password: 'abc'
    };
    await UsersService.createUser(oUserDummy);
    await LoginModel.updateMany({
      name: 'bob'
    }, {
      $set: {
        role: 'user',
        status: 'active'
      }
    });

    logger.info('Login to get token');
    tokenUser = uauth.issueToken('bob', 'user');
    logger.info('Token: ' + tokenUser);
    tokenShortUser = uauth.issueShortToken('bob', 'user');
    logger.info('Short living Token: ' + tokenShortUser);
    await sleep(1000);
  });

  describe('[BINTRA-2] GET home', () => {
    it('[STEP-1] should crash', (done) => {
      request(server)
        .get('/abc')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });
    it('[STEP-2] should redirect', (done) => {
      request(server)
        .get('/')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(301);
          done();
        });
    });
    it('[STEP-3] should not redirect', (done) => {
      request(server)
        .post('/')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(404);
          done();
        });
    });
  });

  describe('[BINTRA-4] Check default auth', () => {
    it('[STEP-1] should get default', (done) => {
      request(server)
        .get('/v1/test')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(200);
          res.body.should.have.property('message', 'you called default');
          done();
        });
    });
  });

  describe('[BINTRA-5] Check wrong login post', () => {
    it('[STEP-1] should get error', (done) => {
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
  });

  describe('[BINTRA-6] Check search api', () => {
    it('[STEP-1] should get empty reply 404', (done) => {
      request(server)
        .post('/v1/search')
        .set('content-type', 'application/json')
        .expect('Content-Type', /json/)
        .send({
          packageName: 'a*'
        })
        .end((err, res) => {
          if (err) {
            res.should.have.status(404);
            done();
          } else {
            done(new Error('should have failed'));
          }
        });
    });
  });

  describe('[BINTRA-32] Check token auth', () => {
    it('[STEP-1] should get valid token', (done) => {
      request(server)
        .get('/v1/token')
        .auth(tokenUser, {
          type: 'bearer'
        })
        .expect(200)
        .then(response => {
          response.body.should.have.property('name', 'bob');
          done();
        })
        .catch(err => done(err));
    });
    it('[STEP-2] should get expired token', (done) => {
      request(server)
        .get('/v1/token')
        .auth(tokenShortUser, {
          type: 'bearer'
        })
        .expect(401)
        .then(response => {
          response.body.should.have.property('message', 'jwt expired');
          done();
        })
        .catch(err => done(err));
    });
  });

  describe('[BINTRA-] Check matomo headers', () => {
    it('[STEP-1] request normal', (done) => {
      request(server)
        .get('/v1/count')
        .expect(200)
        .then(response => {
          done();
        })
        .catch(err => done(err));
    });
    it('[STEP-2] request forwarded for', (done) => {
      request(server)
        .get('/v1/count')
        .set('x-forwarded-for', '1.2.3.4')
        .expect(200)
        .then(response => {
          done();
        })
        .catch(err => done(err));
    });
    it('[STEP-3] request real-ip', (done) => {
      request(server)
        .get('/v1/count')
        .set('x-real-ip', '1.2.3.4')
        .expect(200)
        .then(response => {
          done();
        })
        .catch(err => done(err));
    });
    it('[STEP-3] request forwarded and real-ip', (done) => {
      request(server)
        .get('/v1/count')
        .set('x-real-ip', '1.2.3.4')
        .set('x-forwarded-for', '4.5.6.7')
        .expect(200)
        .then(response => {
          done();
        })
        .catch(err => done(err));
    });
  });

  after(async () => {
    logger.info('after run');
    await LoginModel.deleteMany({
      name: 'max'
    });
  });
});
