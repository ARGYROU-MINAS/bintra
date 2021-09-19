const {
    loginModel,
    cmdArgs
} = require('./common.js');

var username = cmdArgs[0];
console.log("Enable user name=" + username);

// store
loginModel.updateOne(
    { name: username },
    { $set: {status: "active"} }
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

