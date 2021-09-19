const c = require('./common.js');
const bcrypt = require('bcrypt');

var username = c.cmdArgs[0];
var password = c.cmdArgs[1];
console.log("Add user name=" + username + " Password=" + password);

// salt, hash, and store
bcrypt.hash(password, c.saltRounds, async function(err, hash) {
    var login = new c.loginModel({
        name: username,
        passwd: hash
    });

    // store hash in database
    await login.save();

    process.exit();
});
