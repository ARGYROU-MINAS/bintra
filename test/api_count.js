/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

const service = require('../service/PackagesService.js');

describe('getCount', function() {

	context('[BINTRA-1] get count', function() {
		it('[STEP-1] should generate number property', async () => {
			const countSchema = {
				title: 'count schema',
				type: 'object',
				required: ['count'],
				properties: {
					count: {
						type: 'number',
						minimum: 0
					}
				}
			};
			var result = await service.countPackage();
			return expect(result).to.be.jsonSchema(countSchema);
		});
	})

});

