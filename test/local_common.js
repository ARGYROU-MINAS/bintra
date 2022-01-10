/**
 * Test local interface for manual admin commands, see requirements.
 * @see DDATA-functional-API-numbers
 */

var mongoose = require('mongoose');
var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

const captureLogs = require('../testutils/capture-logs');

chai.use(chaiAsPromised);
chai.use(require('chai-json-schema'));

var PackageModel = require('../models/package.js');
var LoginModel = require('../models/login.js');
var Common = require('../local/common.js');
const {
	mongoHost,
	mongoPort,
	mongoDb,
	mongoUrl
} = require('../conf');

const UsersService = require('../service/UsersService.js');

const userName = "max";
var db;

describe('Local common functions', function() {
	captureLogs();

	before(async () => {
		console.log("run before");
		await mongoose.connect(mongoUrl, {});

		db = mongoose.connection;
		db.on('error', console.error.bind(console, 'MongoDB connection error:'));
		db.once('open', function() {
			console.log('Connected to DB');
		});

		await PackageModel.deleteMany({});
		await LoginModel.deleteMany({});

		var u = {
			username: userName,
			email: 'test@example.com',
			password: 'xxx',
			status: 'register'
		};
		await UsersService.createUser(u);
	});

	context('[BINTRA-26] local', function() {
		it('[STEP-1] Check user is not yet active', function() {
			return expect(UsersService.isActiveUser(userName)).to.be.rejectedWith(false);
		});
		it('[STEP-2] Check user is now active', function() {
			console.log("Davor");
			if(Common.setUserStatus(userName, 'active')) {
				console.log("Danach");
				return expect(UsersService.isActiveUser(userName)).to.eventually.equal(true);
			} else {
				console.error("Fehler");
			}
		});
		it('[STEP-3] Check user is now inactive again', function() {
			Common.setUserStatus(userName, 'disabled');
			return expect(UsersService.isActiveUser(userName)).to.be.rejectedWith(false);
		});
	});

	after(async () => {
		console.log("after run");
		await PackageModel.deleteMany({});
		await LoginModel.deleteMany({});
		await mongoose.connection.close();
	});

});
