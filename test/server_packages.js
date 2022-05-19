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
const PackageService = require('../service/PackagesService.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

chai.use(chaiHttp);

let packageid = '';

before(function (done) {
  appWait(done);
});

describe('PFilter server tests', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');
    const adminUtil = mongoose.connection.db.admin();
    const result = await adminUtil.ping();

    await PackageModel.deleteMany({});

    const tsnow = new Date();
    const packageNew = new PackageModel({
      name: 'theName',
      version: 'theVersion',
      arch: 'theArchitecture',
      family: 'theFamily',
      hash: 'theHash',
      tscreated: tsnow,
      tsupdated: tsnow
    });
    await packageNew.save();
  });

  context('[BINTRA-9] search for package', () => {
    it('[STEP-1] get package count', (done) => {
      request(server)
        .get('/v1/count')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('count', 1);
          done();
        });
    });
    it('[STEP-2] get some packages listed', (done) => {
      request(server)
        .get('/v1/packages')
        .query({
          skip: 0,
          count: 10,
          sort: 'tsupdated',
          direction: 'down'
        })
        .end((err, res) => {
          res.should.have.status(200);
          packageid = res.body[0]._id;
          logger.info(packageid);
          done();
        });
    });
    it('[STEP-3] Use wrong chars in params', (done) => {
      request(server)
        .get('/v1/packages')
        .query({
          skip: 'a',
          count: -10,
          sort: '"tsupdated',
          direction: 'do wn'
        })
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });
    it('[STEP-4] get special package data', (done) => {
      request(server)
        .get('/v1/package/' + packageid)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('id', packageid);
          done();
        });
    });
  });

  after(async () => {
    logger.info('after run');
    await PackageModel.deleteMany({});
  });
});
