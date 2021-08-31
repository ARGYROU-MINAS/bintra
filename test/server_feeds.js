//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var PackageModel = require('../models/package.js');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app').app;
let should = chai.should();
let request = require('supertest');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiHttp);

describe('server', () => {
    captureLogs();

    describe('[BINTRA-8] GET feeds', () => {
        before(async () => {
            var tsnow = new Date();
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

        it('[STEP-1] get rss', (done) => {
            request(server)
                .get('/v1/feed.rss')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.have.header('content-type', 'application/rss+xml');
                    done();
                });
        });
        it('[STEP-2] get atom', (done) => {
            request(server)
                .get('/v1/feed.atom')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.have.header('content-type', 'application/rss+xml');
                    done();
                });
        });
        it('[STEP-3] get json', (done) => {
            request(server)
                .get('/v1/feed.json')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.have.header('content-type', 'application/json');
                    done();
                });
        });
    });

    after(async () => {
        console.log("after run");
        await PackageModel.deleteMany({});
    });
});
