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

describe('getDefault', function() {

	context('[BINTRA-] get packages', function() {
		it('[STEP-] should have empty reply', async () => {
			var result = await service.listPackages();
			return expect(result).to.have.length(0);
		});
	})

});

