/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');

const service = require('../service/PackagesService.js');

describe('getDefault', function() {
	before(async () => {
		console.log("run before");
		await PackageModel.deleteMany({});
	});

	context('[BINTRA-] get packages', function() {
		it('[STEP-] should have empty reply', async () => {
			var result = await service.listPackages();
			return expect(result).to.have.length(0);
		});
	});

	context('[BINTRA-] get packages', function() {
		before(async () => {
			var tsnow = new Date();
			var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                	await packageNew.save();
        	});
                it('[STEP-] should have one reply', async () => {
                        var result = await service.listPackages();
                        return expect(result).to.have.length(1);
                });
		it('[STEP-] get package by values', async () => {
                        var result = await service.listPackage('theName', 'theVersion', 'theArchitecture', 'theFamily');
                        return expect(result).to.have.length(1);
                });
		it('[STEP-] search packages by name', async () => {
                        var result = await service.searchPackages({ packageName: 'theName' });
                        return expect(result).to.have.length(1);
                });
		it('[STEP-] search packages by wildcard name', async () => {
                        var result = await service.searchPackages({ packageName: 'the*' });
                        return expect(result).to.have.length(1);
                });
        });

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
	});
});

