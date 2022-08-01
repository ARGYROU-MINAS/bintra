// During the test the env variable is set to test

const appWait = require('../utils/appwait').appWait;
const superagent = require('superagent');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

chai.use(chaiHttp);

const myip = process.env.MYIP || '127.0.0.1';
const myport = process.env.BIND_PORT || '8080';

function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

before(function (done) {
  logger.info('Wait before test');
  appWait(done);
  logger.info('Wait found app on ' + myip + ':' + myport);
});

describe('network', () => {

  before(async() => {
    logger.info('Sleep for connect');
    await sleep(2000);
    logger.info('Did sleep');
  });

  describe('[BINTRA-8] GET feeds', () => {
    it('[STEP-1] get rss', async () => {
      await superagent
        .get('http://' + myip + ':' + myport + '/v1/feed.rss')
        .then((res) => {
          res.should.have.status(200);
          res.should.have.header('content-type', 'application/rss+xml');
        });
    });
  });
});
