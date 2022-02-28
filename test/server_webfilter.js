//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app').app;
let should = chai.should();
let request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiHttp);

describe('webfilter', () => {
    captureLogs();

    describe('[BINTRA-29] GET good one', () => {
        it('[STEP-1] should redirect', (done) => {
            request(server)
                .get('/')
                .end((err, res) => {
                    res.should.have.status(301);
                    done();
                });
        });
    });

    describe('[BINTRA-30] Get bad urls', () => {
        it('[STEP-1] get double slashes', (done) => {
            request(server)
                .get('//v1/test')
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });
        it('[STEP-2] get dot env', (done) => {
            request(server)
                .get('/.env')
                .end((err, res) => {
                    res.should.have.status(400);
                    done();
                });
        });
    });

});
