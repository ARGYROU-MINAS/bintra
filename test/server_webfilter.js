// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Require the dev-dependencies
const appWait = require('../utils/appwait').appWait;
const chai = require('chai');
const mocha = require('mocha')
const describe = mocha.describe
const should = chai.should(); // eslint-disable-line no-unused-vars
const it = mocha.it
const before = mocha.before;
const chaiHttp = require('chai-http');
const server = require('../app').app;
const request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

chai.use(chaiHttp);

before(function (done) {
  appWait(done);
});

describe('webfilter', () => {
  captureLogs();

  describe('[BINTRA-29] GET good one', () => {
    it('[STEP-1] should redirect', (done) => {
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
  });

  describe('[BINTRA-30] Get bad urls', () => {
    it('[STEP-1] get double slashes', (done) => {
      request(server)
        .get('//v1/test')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(400);
          done();
        });
    });
    it('[STEP-2] get dot env from root', (done) => {
      request(server)
        .get('/.env')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(400);
          done();
        });
    });
    it('[STEP-3] get dot env from subfolder', (done) => {
      request(server)
        .get('/utils/.env')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(400);
          done();
        });
    });
    it('[STEP-4] get some php script', (done) => {
      request(server)
        .get('/file.php')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(400);
          done();
        });
    });
    it('[STEP-5] get some .git folder', (done) => {
      request(server)
        .get('/.git/config')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(400);
          done();
        });
    });
    it('[STEP-6] get wp-admin folder', (done) => {
      request(server)
        .get('/wp-admin/admin-ajax')
        .end((err, res) => {
          if (err) {
            done(err);
          }
          res.should.have.status(400);
          done();
        });
    });
    it('[STEP-7] get count with .git arg', (done) => {
      request(server)
        .get('/v1/count') // ?packageName=.git')
        .expect(200, done);
    });
  });
});
