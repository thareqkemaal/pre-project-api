const Crypto = require('crypto');

module.exports = {
    hashPassword: (pass) => {
        return Crypto.createHmac("sha256", "gazebo555").update(pass).digest("hex");
    }
};