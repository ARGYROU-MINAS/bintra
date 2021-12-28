/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
let server = require('../app').app;
let request = require('supertest');

//const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var DomainModel = require('../models/domain.js');

const UsersService = require('../service/UsersService.js');

var JWT;

describe('Domain stuff', function() {
	//captureLogs();

	before(async () => {
		console.log("run before");

		tsnow = new Date();
		var domainNew = new DomainModel({
			name: 'theDomain',
			tscreated: tsnow
		});
		console.log(domainNew);
		await domainNew.save();
		console.log("B");

		await DomainModel.deleteMany({});
		console.log("C");
		await UsersService.addDomain('demo.xyz');
		console.log("D");
	});

	context('[BINTRA-18] handle domains', function() {
		it('[STEP-1] check get all domains', async () => {
			console.log("X");

			var result = await UsersService.listDomains();
			console.log(result);
			return expect(result).to.have.length(1);
		});
		it('[STEP-2] add domain', async () => {
			var result = await UsersService.addDomain('test.eu')
			console.log(result);
			return expect(result).to.have.property('name');
		});
		it('[STEP-3] list added domain', async () => {
			var result = await UsersService.listDomains()
			console.log(result);
			return expect(result).to.have.length(2);
		});
		it('[STEP-4] delete domain', async () => {
			var result = await UsersService.deleteDomain('test.eu')
			console.log(result);
			return expect(result).to.contain("OK");
		});
		it('[STEP-5] list with deleted domain', async () => {
			var result = await UsersService.listDomains()
			console.log(result);
			return expect(result).to.have.length(1);
		});
	});

	after(async () => {
		console.log("after run");
		// await DomainModel.deleteMany({});
	});
});
