// During the test the env variable is set to test

const appWait = require('../utils/appwait').appWait;
const superagent = require('superagent');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

chai.use(chaiHttp);

const myip = process.env.MYIP || '127.0.0.1';
const myport = process.env.BIND_PORT || '8080';

before(function (done) {
  appWait(done);
});

describe('network', () => {
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
