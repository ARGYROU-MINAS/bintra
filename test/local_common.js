/**
 * Test local interface for manual admin commands, see requirements.
 * @see DDATA-functional-API-numbers
 */

const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

const PackageModel = require('../models/package.js');
const LoginModel = require('../models/login.js');
const Common = require('../local/common.js');
const {
  mongoHost,
  mongoPort,
  mongoDb,
  mongoUrl
} = require('../conf');

const UsersService = require('../service/UsersService.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

const userName = 'max';
let db;

describe('Local common functions', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');
    await Common.doconnect();

    await PackageModel.deleteMany({});
    await LoginModel.deleteMany({});

    const u = {
      username: userName,
      email: 'test@example.com',
      password: 'xxx',
      status: 'register'
    };
    await UsersService.createUser(u);
  });

  context('[BINTRA-26] local', function () {
    it('[STEP-1] Check user is not yet active', function () {
      return expect(UsersService.isActiveUser(userName)).to.be.rejectedWith(false);
    });
    it('[STEP-2] Check user is now active', function () {
      Common.setUserStatus(userName, 'active').then(result => {
        return expect(UsersService.isActiveUser(userName)).to.eventually.equal(true);
      });
    });
    it('[STEP-3] Check user is now inactive again', function () {
      Common.setUserStatus(userName, 'disabled').then(result => {
        return expect(UsersService.isActiveUser(userName)).to.be.rejectedWith(false);
      });
    });
    it('[STEP-4] Check set user password', function () {
      Common.setUserPasswd(userName, 'newpwd').then(result => {
        return expect(UsersService.isActiveUser(userName)).to.eventually.equal(false);
      });
    });
  });

  after(async () => {
    logger.info('after run');
    await PackageModel.deleteMany({});
    await LoginModel.deleteMany({});
    await mongoose.connection.close();
  });
});
