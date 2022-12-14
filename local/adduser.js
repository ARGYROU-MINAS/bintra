const c = require('./common.js');
const bcrypt = require('bcrypt');

const username = c.cmdArgs[0];
const password = c.cmdArgs[1];
console.log('Add user name=' + username + ' Password=' + password);

// salt, hash, and store
bcrypt.hash(password, c.saltRounds, async function (err, hash) {
  if (err) {
    throw err;
  }
  const login = new c.LoginModel({
    name: username,
    passwd: hash
  });

  // store hash in database
  await login.save();

  process.exit();
});
