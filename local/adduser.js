const {
    loginModel,
    cmdArgs,
    saltRounds
} = require('./common.js');
const bcrypt = require('bcrypt');

var username = cmdArgs[0];
var password = cmdArgs[1];
console.log("Add user name=" + username + " Password=" + password);

// salt, hash, and store
bcrypt.hash(password, saltRounds, async function(err, hash) {
    var login = new LoginModel({
        name: username,
        passwd: hash
    });

    // store hash in database
    await login.save();

    process.exit();
});
