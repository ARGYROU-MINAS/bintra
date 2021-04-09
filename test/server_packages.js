/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let request = require('supertest');

var PackageModel = require('../models/package.js');

chai.use(chaiHttp);

const PackageService = require('../service/PackagesService.js');

describe('PFilter server tests', function() {
	before(async () => {
		console.log("run before");
		await PackageModel.deleteMany({});

		var tsnow = new Date();
		var packageNew = new PackageModel({name: 'theName', version: 'theVersion',
                                                   arch: 'theArchitecture', family: 'theFamily',
                                                   hash: 'theHash', tscreated: tsnow, tsupdated: tsnow});
		await packageNew.save();
	});

	context('[BINTRA-] search for package', () => {
		it('[STEP-] get some packages listed', (done) => {
                  request(server)
                      .get('/v1/packages')
		      .query({
			      skip: 0,
			      count: 10,
			      sort: 'tsupdated',
			      direction: 'down'
		      })
                      .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
		it('[STEP-] Use wrong chars in params', (done) => {
                  request(server)
                      .get('/v1/packages')
                      .query({
                              skip: 'a',
                              count: -10,
                              sort: '"tsupdated',
                              direction: 'do wn'
                      })
                      .end((err, res) => {
                            res.should.have.status(400);
                            done();
                        });
                });
        });

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
	});
});

