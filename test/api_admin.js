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

describe('admin only functions', function() {

	context('[BINTRA-14] delete package by id', function() {
                before(async () => {
			await PackageModel.deleteMany({});
                        var tsnow = new Date();
                        var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                        await packageNew.save();
                });
                it('[STEP-1] should have one reply', async () => {
                        var result = await PackagesService.listPackages();
			var theID = result[0]._id;
			console.log("ID=" + theID);
			await PackagesService.deletePackageById(theID);
			result = await PackagesService.listPackages();
                        return expect(result).to.have.length(0);
                });
        });

	context('[BINTRA-15] get full package info', function() {
                before(async () => {
                        await PackageModel.deleteMany({});
                        var tsnow = new Date();
                        var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
                        await packageNew.save();
                });
                it('[STEP-1] packagesFull', async () => {
                        var result = await PackagesService.listPackagesFull(111);
                        return expect(result).to.have.length(1);
                });
        });

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
	});
});

