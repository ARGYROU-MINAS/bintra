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

	describe('[BINTRA-] GET feeds', () => {
		it('[STEP-] get rss', (done) => {
		  request(server)
		      .get('/v1/feed.rss')
		      .end((err, res) => {
			    res.should.have.status(200);
			    res.should.have.header('content-type', 'application/rss+xml');
			    done();
		        });
		});
		it('[STEP-] get atom', (done) => {
                  request(server)
                      .get('/v1/feed.atom')
                      .end((err, res) => {
                            res.should.have.status(200);
			    res.should.have.header('content-type', 'application/rss+xml');
                            done();
                        });
                });
		it('[STEP-] get json', (done) => {
                  request(server)
                      .get('/v1/feed.json')
                      .end((err, res) => {
                            res.should.have.status(200);
			    res.should.have.header('content-type', 'application/json');
                            done();
                        });
                });
	});
});
