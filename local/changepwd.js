const {
    loginModel,
    cmdArgs,
    saltRounds
} = require('./common.js');
const bcrypt = require('bcrypt');

var username = cmdArgs[0];
var password = cmdArgs[1];
console.log("Change user name=" + username + " Password=" + password);

// salt, hash, and store
bcrypt.hash(password, saltRounds, async function(err, hash) {
    await LoginModel.updateOne(
        {name: username},
        { $set: {passwd: hash}}
    );
    console.log("Did change");

    process.exit();
});
