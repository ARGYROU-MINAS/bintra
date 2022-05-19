/**
 * Test API for admin level backend lib calls
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

describe('admin only functions', function () {
  captureLogs();

  context('[BINTRA-14] delete package by id', function () {
    before(async () => {
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
    it('[STEP-1] should have one reply', async () => {
      let result = await PackagesService.listPackagesFull();
      const theID = result[0]._id;
      logger.info('ID=' + theID);
      await PackagesService.deletePackageById(theID);
      result = await PackagesService.listPackagesFull();
      return expect(result).to.have.length(0);
    });
  });

  context('[BINTRA-15] get full package info', function () {
    before(async () => {
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
    it('[STEP-1] packagesFull', async () => {
      const result = await PackagesService.listPackagesFull(111);
      return expect(result).to.have.length(1);
    });
  });

  after(async () => {
    logger.info('after run');
    await PackageModel.deleteMany({});
  });
});
