const c = require('./common.js');
const bcrypt = require('bcrypt');

var username = c.cmdArgs[0];
var password = c.cmdArgs[1];
console.log("Change user name=" + username + " Password=" + password);

c.doconnect().then(function(db) {
        c.setUserPasswd(username, password)
                .then(function(payload) {
                        console.log("Did update");
                        process.exit(0);
                })
                .catch(function(payload) {
                        console.error("Had error");
                        process.exit(1);
                })
})
.catch(function(err) {
        console.error("connect error " + err);
        process.exit(1);
});
