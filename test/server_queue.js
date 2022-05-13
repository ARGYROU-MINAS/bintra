/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
chai.use(require('chai-json-schema'));
var expect = chai.expect;
let chaiHttp = require('chai-http');
let server = require('../app').app;
let should = chai.should();
let request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = process.env.LOGLEVEL || "warn";

chai.use(chaiHttp);

before(function (done) {
    logger.warn('Wait for app server start');
    if(server.didStart) done();
    server.on("appStarted", function() {
        logger.info('app server started');
        done();
    });
});

describe('Queue server tests', function() {
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
