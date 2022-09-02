const c = require('./common.js');
const bcrypt = require('bcrypt');

const username = c.cmdArgs[0];
const password = c.cmdArgs[1];
console.log('Add admin name=' + username + ' Password=' + password);

c.doconnect().then(function (db) {
  console.log('db connected');

  // salt, hash, and store
  bcrypt.hash(password, c.saltRounds, async function (err, hash) {
    if (err) {
      throw err;
    }
    console.log('calculated pwd hash ' + hash);
    const login = new c.LoginModel({
      name: username,
      passwd: hash,
      role: 'admin',
      status: 'active'
    });

    // store hash in database
    await login.save();


    process.exit();
  }); // hash
}); // doconnect
