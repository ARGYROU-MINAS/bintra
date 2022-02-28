//During the test the env variable is set to test

const superagent = require("superagent");
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

chai.use(chaiHttp);

let myip = process.env.MYIP || '127.0.0.1';

describe('network', () => {

    describe('[BINTRA-] webfilter', () => {

        it('[STEP-1] get good one', async () => {
            await superagent
                .get('http://' + myip + ':8080/v1/feed.rss')
                .then((res) => {
                    res.should.have.status(200);
                    res.should.have.header('content-type', 'application/rss+xml');
                });
        });
	it('[STEP-2] get slashes', async () => {
            await superagent
                .get('http://' + myip + ':8080//v1/feed.rss')
                .then((res) => {
                    res.should.have.status(400);
                });
        });
	it('[STEP-2] get dot env', async () => {
            await superagent
                .get('http://' + myip + ':8080/.env')
                .then((res) => {
                    res.should.have.status(400);
                });
        });

    });

});
