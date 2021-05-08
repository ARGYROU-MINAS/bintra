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
        it('[STEP-2] should redirect', (done) => {
            request(server)
                .get('/')
                .end((err, res) => {
                    res.should.have.status(301);
                    done();
                });
        });
    });

    describe('[BINTRA-4] Check default auth', () => {
        it('[STEP-1] should get default', (done) => {
            request(server)
                .get('/v1/test')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('message', 'you called default');
                    done();
                });
        });
    });

    describe('[BINTRA-5] Check wrong login post', () => {
        it('[STEP-1] should get error', (done) => {
            request(server)
                .post('/v1/login')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    username: 'max',
                    password: 'nono'
                })
                .end((err, res) => {
                    res.should.have.status(403);
                    res.body.should.have.property('message', 'Error: Credentials incorrect');
                    done();
                });
        });
    });

    describe('[BINTRA-6] Check search api', () => {
        it('[STEP-1] should get empty reply 404', (done) => {
            request(server)
                .post('/v1/search')
                .set('content-type', 'application/json')
                .expect('Content-Type', /json/)
                .send({
                    packageName: 'a*'
                })
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
    });
});