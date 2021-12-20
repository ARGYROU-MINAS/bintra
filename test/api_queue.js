/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
chai.use(require('chai-json-schema'));
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

const QueueService = require('../service/QueueService.js');

describe('getQueues', function() {
	captureLogs();

	context('[BINTRA-23] get queues and count', function() {
		it('[STEP-1] should generate number property', async () => {
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
			var result = await QueueService.listQueues();
			return result.forEach(entry => expect(entry).to.be.jsonSchema(queueSchema));
		});
	})

});
