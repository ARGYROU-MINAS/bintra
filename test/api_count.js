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

const PackagesService = require('../service/PackagesService.js');

describe('getCount', function () {
  captureLogs();

  context('[BINTRA-1] get count', function () {
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
      const result = await PackagesService.countPackage();
      return expect(result).to.be.jsonSchema(countSchema);
    });
  })
});
