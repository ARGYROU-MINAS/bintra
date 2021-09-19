const {
    loginModel,
    cmdArgs,
    saltRounds
} = require('./common.js');
var username = cmdArgs[0];
console.log("Disable user name=" + username);

// store
loginModel.updateOne(
    { name: username },
    { $set: {status: "deleted"} }
).then(result => {
    console.log(result);
    if(result.nModified != 1) {
        console.log("Entry not found");
    }
    process.exit();
}).catch(error => {
    console.log("Had an error " + error);
    process.exit();
});

