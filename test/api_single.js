/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

const appWait = require('../utils/appwait').appWait;
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
const server = require('../app').app;
const request = require('supertest');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'info';

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.use(require('chai-json-schema'));

const LoginModel = require('../models/login.js');

const UsersService = require('../service/UsersService.js');

let JWT;

before(function (done) {
  appWait(done);
});

describe('User stuff', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');

    await LoginModel.deleteMany({});

    const u = {
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

  context('[BINTRA-31] login', function () {
    it('[STEP-1] Check user was created', (done) => {
      LoginModel.find({})
        .then(itemFound => {
          logger.info('Login database filled: ' + itemFound.length);
          expect(itemFound).to.have.lengthOf(1);
          done();
        })
        .catch(err => done(err));
    });
    it('[STEP-2] should get token', (done) => {
      request(server)
        .post('/v1/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          username: 'max',
          password: 'xxx'
        })
        .expect(200)
        .then(response => {
          logger.debug(response.body.token);
          expect(response).to.be.json; // eslint-disable-line no-unused-expressions
          response.body.should.have.property('token');
          done();
        })
        .catch(err => done(err));
    });
  });

  after(async () => {
    logger.info('after run');
    await LoginModel.deleteMany({});
  });
});
