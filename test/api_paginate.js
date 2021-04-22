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

const PackageService = require('../service/PackagesService.js');

describe('Paginate', function() {
	before(async () => {
		console.log("run before");
		await PackageModel.deleteMany({});
	});

	context('[BINTRA-19] show moving window of packages', function() {
		before(async () => {
			var tsnow = new Date();
			var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                	await packageNew.save();
			tsnow = new Date();
			packageNew = new PackageModel({name: 'secondName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                        await packageNew.save();
        	});

                it('[STEP-1] should have two reply', async () => {
                        var result = await PackageService.listPackages();
                        return expect(result).to.have.length(2);
                });
		it('[STEP-2] get package start window', async () => {
                        var result = await PackageService.listPackages(0, 2, 'tsupdated', 'up');
                        return expect(result).to.have.length(2);
                });
		it('[STEP-3] get package start window small', async () => {
                        var result = await PackageService.listPackages(0, 1, 'tsupdated', 'up');
                        return expect(result).to.have.length(1);
                });
		it('[STEP-4] get package next window small', async () => {
                        var result = await PackageService.listPackages(1, 1, 'tsupdated', 'up');
                        return expect(result).to.have.length(1);
                });
		it('[STEP-5] get package empty window', async () => {
                        var result = await PackageService.listPackages(2, 1, 'tsupdated', 'up');
                        return expect(result).to.have.length(0);
                });
        });

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
	});
});

