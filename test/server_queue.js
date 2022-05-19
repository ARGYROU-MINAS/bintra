/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

const appWait = require('../utils/appwait').appWait;
const chai = require('chai');
chai.use(require('chai-json-schema'));
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('../app').app;
const should = chai.should();
const request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || 'warn';

chai.use(chaiHttp);

before(function (done) {
  appWait(done);
});

describe('Queue server tests', function () {
  captureLogs();

  context('[BINTRA-23] call queue api', () => {
    it('[STEP-1] get package count', (done) => {
      const queueSchema = {
        title: 'queue schema',
        type: 'object',
        required: ['id', 'count'],
        properties: {
          id: {
            type: 'string'
          },
          count: {
            type: 'number',
            minimum: 0
          }
        }
      };
      request(server)
        .get('/v1/queue')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.forEach(entry => expect(entry).to.be.jsonSchema(queueSchema));
          done();
        });
    });
  });
});
