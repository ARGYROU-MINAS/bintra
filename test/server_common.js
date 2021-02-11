//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let request = require('supertest');

chai.use(chaiHttp);

describe('server', () => {

	describe('[BINTRA-2] GET home', () => {
		it('[STEP-1] should redirect', (done) => {
		  request(server)
		      .get('/')
		      .end((err, res) => {
			    res.should.have.status(301);
			    done();
		        });
		});
	});
});
