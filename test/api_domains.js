/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const server = require('../app').app;
const request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

const DomainModel = require('../models/domain.js');

const UsersService = require('../service/UsersService.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

let JWT;

describe('Domain stuff', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');

    tsnow = new Date();
    const domainNew = new DomainModel({
      name: 'theDomain',
      tscreated: tsnow
    });
    await domainNew.save();

    await DomainModel.deleteMany({});
    await UsersService.addDomain('demo.xyz');
  });

  context('[BINTRA-18] handle domains', function () {
    it('[STEP-1] check get all domains', async () => {
      const result = await UsersService.listDomains();
      return expect(result).to.have.length(1);
    });
    it('[STEP-2] add domain', async () => {
      const result = await UsersService.addDomain('test.eu')
      return expect(result).to.have.property('name');
    });
    it('[STEP-3] list added domain', async () => {
      const result = await UsersService.listDomains()
      return expect(result).to.have.length(2);
    });
    it('[STEP-4] delete domain', async () => {
      const result = await UsersService.deleteDomain('test.eu')
      return expect(result).to.contain('OK');
    });
    it('[STEP-5] list with deleted domain', async () => {
      const result = await UsersService.listDomains()
      return expect(result).to.have.length(1);
    });
    it('[STEP-6] add colliding domain', (done) => {
      UsersService.addDomain('test.eu')
        .then(result => {
          logger.error('should not pass');
          done();
        })
        .catch(err => {
          logger.info('expected error');
          done();
        });
    });
  });

  after(async () => {
    logger.info('after run');
    await DomainModel.deleteMany({});
  });
});
