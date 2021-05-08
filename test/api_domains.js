/**
 * Test API
 * @see DDATA-functional-API-numbers
 */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
let server = require('../app');
let request = require('supertest');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var DomainModel = require('../models/domain.js');

const UsersService = require('../service/UsersService.js');

var JWT;

describe('Domain stuff', function() {
    before(async () => {
        console.log("run before");
        await DomainModel.deleteMany({});
        await UsersService.addDomain('demo.xyz');
    });

    context('[BINTRA-18] handle domains', function() {
        it('[STEP-1] check get all domains', (done) => {
            UsersService.listDomains()
                .then(itemFound => {
                    itemFound.should.have.length(1);
                    done();
                });
        });
        it('[STEP-2] add domain', (done) => {
            UsersService.addDomain('test.eu')
                .then(itemFound => {
                    itemFound.should.have.property('name');
                    done();
                });
        });
        it('[STEP-3] list added domain', (done) => {
            UsersService.listDomains()
                .then(itemFound => {
                    itemFound.should.have.length(2);
                    done();
                });
        });
        it('[STEP-4] delete domain', (done) => {
            UsersService.deleteDomain('test.eu')
                .then(itemFound => {
                    done();
                });
        });
        it('[STEP-5] list with deleted domain', (done) => {
            UsersService.listDomains()
                .then(itemFound => {
                    itemFound.should.have.length(1);
                    done();
                });
        });
    });

    after(async () => {
        console.log("after run");
        await DomainModel.deleteMany({});
    });
});