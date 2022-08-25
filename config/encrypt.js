const Crypto = require('crypto');
const jwt = require('jsonwebtoken');

module.exports = {
    hashPassword: (pass) => {
        return Crypto.createHmac("sha256", "gazebo555").update(pass).digest("hex");
    },

    createToken: (payload, expiresIn='24h') => {
        return jwt.sign(payload, 'gazebo123', {
            expiresIn
        });
    },

    readToken: (req, res, next) => {
        //console.log('req token', req.token);

        jwt.verify(req.token, 'gazebo123', (err, decode) => {
            if (err) {
                console.log("error token", err)
                return res.status(401).send({
                    message: "Authenticate Error/Token Invalid/Token Expire ❌"
                });
            };
            
            //console.log('translate token', decode);

            req.dataToken = decode;
            next();
        });
    }
};