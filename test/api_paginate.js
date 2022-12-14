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

const PackageService = require('../service/PackagesService.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

describe('Paginate', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');
    await PackageModel.deleteMany({});
  });

  context('[BINTRA-19] show moving window of packages', function () {
    before(async () => {
      let tsnow = new Date();
      let packageNew = new PackageModel({
        name: 'theName',
        version: 'theVersion',
        arch: 'theArchitecture',
        family: 'theFamily',
        hash: 'theHash',
        tscreated: tsnow,
        tsupdated: tsnow
      });
      await packageNew.save();
      tsnow = new Date();
      packageNew = new PackageModel({
        name: 'secondName',
        version: 'theVersion',
        arch: 'theArchitecture',
        family: 'theFamily',
        hash: 'theHash',
        tscreated: tsnow,
        tsupdated: tsnow
      });
      await packageNew.save();
    });

    it('[STEP-1] should have two reply', async () => {
      const result = await PackageService.listPackages(0, 10, 'tsupdated', 'up', 99);
      return expect(result).to.have.length(2);
    });
    it('[STEP-2] get package start window', async () => {
      const result = await PackageService.listPackages(0, 2, 'tsupdated', 'up', 99);
      return expect(result).to.have.length(2);
    });
    it('[STEP-3] get package start window small', async () => {
      const result = await PackageService.listPackages(0, 1, 'tsupdated', 'up', 99);
      return expect(result).to.have.length(1);
    });
    it('[STEP-4] get package next window small', async () => {
      const result = await PackageService.listPackages(1, 1, 'tsupdated', 'up', 99);
      return expect(result).to.have.length(1);
    });
    it('[STEP-5] get package empty window', async () => {
      const result = await PackageService.listPackages(2, 1, 'tsupdated', 'up', 99);
      return expect(result).to.have.length(0);
    });
  });

  after(async () => {
    logger.info('after run');
    await PackageModel.deleteMany({});
  });
});
