/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

const PackageModel = require('../models/package.js');
const LoginModel = require('../models/login.js');

const PackagesService = require('../service/PackagesService.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

describe('get default role funtions', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');
    await PackageModel.deleteMany({});
  });

  context('[BINTRA-16] get packages from empty db', function () {
    it('[STEP-1] should have empty reply', async () => {
      const result = await PackagesService.listPackagesFull();
      return expect(result).to.have.length(0);
    });
  });

  context('[BINTRA-17] get packages from filled db', function () {
    let tsnow;
    before(async () => {
      tsnow = new Date();
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
    it('[STEP-1] should have one reply', async () => {
      const result = await PackagesService.listPackagesFull();
      return expect(result).to.have.length(1);
    });
    it('[STEP-2] get package by values', async () => {
      const result = await PackagesService.listPackage('theName', 'theVersion', 'theArchitecture', 'theFamily');
      return expect(result).to.have.length(1);
    });
    it('[STEP-3] search packages by name', async () => {
      const result = await PackagesService.searchPackages({
        packageName: 'theName'
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-4] search packages by version', async () => {
      const result = await PackagesService.searchPackages({
        packageVersion: 'theVersion'
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-5] search packages by arch', async () => {
      const result = await PackagesService.searchPackages({
        packageArch: 'theArchitecture'
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-6] search packages by fanily', async () => {
      const result = await PackagesService.searchPackages({
        packageFamily: 'theFamily'
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-7] search packages by hash', async () => {
      const result = await PackagesService.searchPackages({
        packageHash: 'theHash'
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-8] search packages by count', async () => {
      const result = await PackagesService.searchPackages({
        count: 1
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-9] search packages by tscreated', async () => {
      const result = await PackagesService.searchPackages({
        tscreated: tsnow
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-10] search packages by tsupdated', async () => {
      const result = await PackagesService.searchPackages({
        tsupdated: tsnow
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-11] search packages by wildcard name', async () => {
      const result = await PackagesService.searchPackages({
        packageName: 'the*'
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-12] search packages by name and version', async () => {
      const result = await PackagesService.searchPackages({
        packageName: 'theName',
        packageVersion: 'theVersion'
      });
      return expect(result).to.have.length(1);
    });
    it('[STEP-13] list single non existing package', (done) => {
      PackagesService.listPackageSingle('00112233445566778899aabb')
        .then(itemFound => {
          logger.error('Should not pass');
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
    await PackageModel.deleteMany({});
  });
});
