/**
 * Test API for admin level backend lib calls
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');

const PackagesService = require('../service/PackagesService.js');

describe('getDefault', function() {
	before(async () => {
		console.log("run before");
		await PackageModel.deleteMany({});
	});

	context('[BINTRA-] cleanup packages', function() {
		before(async () => {
			var tsnow = new Date();
			var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                	await packageNew.save();
        	});
                it('[STEP-] should have one reply', async () => {
                        await PackagesService.cleanupPackages();
			var result = await PackagesService.listPackages();
			return expect(result).to.have.length(0);
                });
        });

	context('[BINTRA-] delete package by id', function() {
                before(async () => {
			await PackageModel.deleteMany({});
                        var tsnow = new Date();
                        var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                        await packageNew.save();
                });
                it('[STEP-] should have one reply', async () => {
                        var result = await PackagesService.listPackages();
			var theID = result[0]._id;
			console.log("ID=" + theID);
			await PackagesService.deletePackageById(theID);
			result = await PackagesService.listPackages();
                        return expect(result).to.have.length(0);
                });
        });

	context('[BINTRA-] get full package info', function() {
                before(async () => {
                        await PackageModel.deleteMany({});
                        var tsnow = new Date();
                        var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                        await packageNew.save();
                });
                it('[STEP-] packagesFull', async () => {
                        var result = await PackagesService.listPackagesFull(111);
                        return expect(result).to.have.length(1);
                });
        });

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
	});
});

