//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var PackageModel = require('../models/package.js');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let request = require('supertest');

chai.use(chaiHttp);

describe('server', () => {

    describe('[BINTRA-] GET summary', () => {
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

        it('[STEP-] get arch', (done) => {
            request(server)
                .get('/v1/summary/arch')
                .end((err, res) => {
                    res.should.have.status(200);
		    res.body.should.have.property('summary');
                    done();
                });
        });
        it('[STEP-] get family', (done) => {
            request(server)
                .get('/v1/summary/family')
                .end((err, res) => {
                    res.should.have.status(200);
		    res.body.should.have.property('summary');
                    done();
                });
        });
    });

    after(async () => {
        console.log("after run");
        await PackageModel.deleteMany({});
    });
});
