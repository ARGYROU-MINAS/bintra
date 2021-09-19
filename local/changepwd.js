const c = require('./common.js');
const bcrypt = require('bcrypt');

var username = c.cmdArgs[0];
var password = c.cmdArgs[1];
console.log("Change user name=" + username + " Password=" + password);

// salt, hash, and store
bcrypt.hash(password, c.saltRounds, async function(err, hash) {
    await c.loginModel.updateOne(
        {name: username},
        { $set: {passwd: hash}}
    );
    console.log("Did change");

    process.exit();
});
