/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');

const PackagesService = require('../service/PackagesService.js');

describe('get default role funtions', function() {
    captureLogs();

    before(async () => {
        console.log("run before");
        await PackageModel.deleteMany({});
    });

    context('[BINTRA-16] get packages from empty db', function() {
        it('[STEP-1] should have empty reply', async () => {
            var result = await PackagesService.listPackagesFull();
            return expect(result).to.have.length(0);
        });
    });

    context('[BINTRA-17] get packages from filled db', function() {
        var tsnow;
        before(async () => {
            tsnow = new Date();
            var packageNew = new PackageModel({
                name: 'theName',
                version: 'theVersion',
                arch: 'theArchitecture',
                family: 'theFamily',
                hash: 'theHash',
                tscreated: tsnow,
                tsupdated: tsnow
            });
            await packageNew.save();
        });
        it('[STEP-1] should have one reply', async () => {
            var result = await PackagesService.listPackagesFull();
            return expect(result).to.have.length(1);
        });
        it('[STEP-2] get package by values', async () => {
            var result = await PackagesService.listPackage('theName', 'theVersion', 'theArchitecture', 'theFamily');
            return expect(result).to.have.length(1);
        });
        it('[STEP-3] search packages by name', async () => {
            var result = await PackagesService.searchPackages({
                packageName: 'theName'
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-4] search packages by version', async () => {
            var result = await PackagesService.searchPackages({
                packageVersion: 'theVersion'
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-5] search packages by arch', async () => {
            var result = await PackagesService.searchPackages({
                packageArch: 'theArchitecture'
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-6] search packages by fanily', async () => {
            var result = await PackagesService.searchPackages({
                packageFamily: 'theFamily'
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-7] search packages by hash', async () => {
            var result = await PackagesService.searchPackages({
                packageHash: 'theHash'
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-8] search packages by count', async () => {
            var result = await PackagesService.searchPackages({
                count: 1
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-9] search packages by tscreated', async () => {
            var result = await PackagesService.searchPackages({
                tscreated: tsnow
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-10] search packages by tsupdated', async () => {
            var result = await PackagesService.searchPackages({
                tsupdated: tsnow
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-11] search packages by wildcard name', async () => {
            var result = await PackagesService.searchPackages({
                packageName: 'the*'
            });
            return expect(result).to.have.length(1);
        });
        it('[STEP-12] search packages by name and version', async () => {
            var result = await PackagesService.searchPackages({
                packageName: 'theName',
                packageVersion: 'theVersion'
            });
            return expect(result).to.have.length(1);
        });
    });

    after(async () => {
        console.log("after run");
        await PackageModel.deleteMany({});
    });
});
