/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const server = require('../app').app;
const request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

const PackageModel = require('../models/package.js');
const LoginModel = require('../models/login.js');

const UsersService = require('../service/UsersService.js');
const PackagesService = require('../service/PackagesService.js');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

let JWT;

describe('User stuff', function () {
  captureLogs();

  before(async () => {
    logger.info('run before');

    await PackageModel.deleteMany({});
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

  context('[BINTRA-20] login', function () {
    it('[STEP-1] Check user was created', (done) => {
      LoginModel.find({})
        .then(itemFound => {
          logger.info('Query logins worked, mount=' + itemFound.length);
          done();
        });
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
          response.body.should.have.property('token');
          done();
        })
        .catch(err => done(err));
    });
    it('[STEP-3] List users', (done) => {
      UsersService.listUsers()
        .then(itemFound => {
          itemFound.should.have.length(1);
          idUser = itemFound[0]._id;
          done();
        });
    });
    it('[STEP-4] List user', (done) => {
      UsersService.listUser(idUser)
        .then(itemFound => {
          itemFound.should.have.property('email');
          done();
        });
    });
    it('[STEP-5] Check role', (done) => {
      UsersService.hasRole('max', ['user'])
        .then(itemFound => {
          done();
        });
    });
    it('[STEP-6] Check role with wrong role', (done) => {
      UsersService.hasRole('max', ['admin'])
        .then(itemFound => {
          logger.error('Sould not pass');
        })
        .catch(err => {
          logger.info('expected error');
          done();
        });
    });
    it('[STEP-7] Check role with wrong user', (done) => {
      UsersService.hasRole('sam', ['user'])
        .then(itemFound => {
          logger.error('should not pass');
        })
        .catch(err => {
          logger.info('expected error');
          done();
        });
    });
    it('[STEP-8] Check active user', (done) => {
      UsersService.isActiveUser('max')
        .then(itemFound => {
          done();
        });
    });
    it('[STEP-9] Check active with wrong user', (done) => {
      UsersService.isActiveUser('sam')
        .then(itemFound => {
          logger.error('should not pass');
        })
        .catch(err => {
          logger.info('expected error');
          done();
        });
    });
  });

  context('[BINTRA-21] add package as user', () => {
    it('[STEP-1] Add package in users name', (done) => {
      PackagesService.validatePackage('theName', 'theVersion', 'theArch', 'debian', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'max')
        .then(itemFound => {
          itemFound.should.have.length(1);
          done();
        });
    });
    it('[STEP-2] Add again package in users name', (done) => {
      PackagesService.validatePackage('theName', 'theVersion', 'theArch', 'debian', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'max')
        .then(itemFound => {
          itemFound.should.have.length(1);
          done();
        });
    });
    it('[STEP-3] Add again package in wrong users name', (done) => {
      PackagesService.validatePackage('theName', 'theVersion', 'theArch', 'debian', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'maria')
        .then(itemFound => {
          logger.error('should not pass');
          done();
        })
        .catch(err => {
          logger.info('expected error');
          done();
        });
    });
  });

  context('[BINTRA-22] Destroy user', () => {
    let idUser;
    it('[STEP-1] List users once more', (done) => {
      UsersService.listUsers()
        .then(itemFound => {
          itemFound.should.have.length(1);
          idUser = itemFound[0]._id;
          done();
        });
    });
    it('[STEP-2] Delete user', (done) => {
      UsersService.deleteUser(idUser)
        .then(itemFound => {
          itemFound.should.have.property('status', 'deleted');
          done();
        });
    });
  });

  after(async () => {
    logger.info('after run');
    await PackageModel.deleteMany({});
    await LoginModel.deleteMany({});
  });
});
