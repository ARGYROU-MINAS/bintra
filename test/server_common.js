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
		it('[STEP-1] should crash', (done) => {
		  request(server)
		      .get('/abc')
		      .end((err, res) => {
			    res.should.have.status(404);
			    done();
		        });
		});
		it('[STEP-] should redirect', (done) => {
                  request(server)
                      .get('/')
                      .end((err, res) => {
                            res.should.have.status(301);
                            done();
                        });
                });
	});

	describe('[BINTRA-] Check default auth', () => {
                it('[STEP-] should get default', (done) => {
                  request(server)
                      .get('/v1/test')
                      .end((err, res) => {
                            res.should.have.status(200);
			    res.body.should.have.property('message', 'you called default');
                            done();
                        });
                });
        });

	describe('[BINTRA-] Check wrong login post', () => {
                it('[STEP-] should get error', (done) => {
                  request(server)
                      .post('/v1/login')
		      .set('content-type', 'application/x-www-form-urlencoded')
		      .send({username: 'max', password: 'nono'})
                      .end((err, res) => {
                            res.should.have.status(403);
                            res.body.should.have.property('message', 'Error: Credentials incorrect');
                            done();
                        });
                });
        });

	describe('[BINTRA-] Check search api', () => {
                it('[STEP-] should get at least empty reply', (done) => {
                  request(server)
                      .post('/v1/search')
                      .set('content-type', 'application/json')
		      .expect('Content-Type', /json/)
                      .send({packageName: 'a*'})
                      .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
        });
});
