// auth.js fungsinya untuk manajemen data user


const { dbConf, dbQuery } = require('../config/db');
const { hashPassword, createToken } = require('../config/encrypt');
const fs = require('fs');
const { transport } = require('../config/nodemailer');

module.exports = {
    getData: async (req, res) => {
        try {
            let result = await dbQuery(`SELECT * FROM dbgazebo.users u JOIN status s ON u.user_status = s.idstatus;`);

            //console.log(result);
            res.status(200).send(result);

        } catch (error) {
            console.log("Error GET dbgazebo.users data SQL", error);
            res.status(500).send(error);
        };
    },

    register: async (req, res) => {
        try {
            //console.log(req.body);
            const { username, email, password } = req.body;

            let sqlInsert = await dbQuery(`INSERT INTO dbgazebo.users (username, email, password) VALUES
            ('${username}', '${email}', '${hashPassword(password)}');`);

            //console.log(sqlInsert);

            if (sqlInsert.insertId) {
                let sqlGet = await dbQuery(`SELECT idusers, username, email, user_status FROM dbgazebo.users WHERE idusers = ${dbConf.escape(sqlInsert.insertId)};`)

                let token = createToken({ ...sqlGet[0] }, '15m');

                let oldTime = new Date();
                let newTime = new Date(oldTime.getTime() + 15 * 60000);

                await transport.sendMail({
                    from: 'ADMIN @GAZEBO',
                    to: sqlGet[0].email,
                    subject: 'Verification Email Account',
                    html: `
                    <div style="text-align:center">
                        <h2 style="color: #006442">Thanks for signing up for Gazebo!</h2>
                        </br>
                        <h4 style="color: #231f20, ">We're happy you're here. Let's get your email address verified</h4>
                        <a href="http://localhost:3000/verification/${token}"
                            style="padding: 10px; color: #eee8da; background-color: #006442; font-weight: 600; border-radius:  10px; border: none; text-decoration: none;"
                        >Click to Verify Email</a>
                        <h5>Link Expired at ${newTime.toLocaleString()}</h5>
                        </br>
                        <h4>Thank You.</h4>
                        <h2 style="color: #006442">The Gazebo Team</h2>
                    </div>`
                });

                await dbQuery(`UPDATE dbgazebo.users SET verifToken = ${dbConf.escape(token)} WHERE idusers = ${dbConf.escape(sqlInsert.insertId)};`)

                res.status(200).send({
                    success: true,
                    message: 'Register Success ✅'
                });
            }
        } catch (error) {
            console.log("Error Query SQL", error);
            res.status(500).send(error);
        }

    },

    getVerify: async (req, res) => {
        try {
            //console.log(req.dataToken);

            if (req.dataToken.idusers) {
                await dbQuery(`UPDATE dbgazebo.users SET user_status = 1 WHERE idusers = ${dbConf.escape(req.dataToken.idusers)} AND email = ${dbConf.escape(req.dataToken.email)};`)

                res.status(200).send({
                    success: true,
                    message: "Update Status Success ✅"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send(error)
        }
    },

    resendEmail: async (req, res) => {
        try {
            let data = req.dataToken;

            //console.log(data);

            if (data.idusers) {
                delete data.iat;
                delete data.exp;
                delete data.verifToken;
                delete data.passToken;

                await dbQuery(`UPDATE dbgazebo.users SET verifToken = null WHERE idusers = ${dbConf.escape(data.idusers)};`);

                let token = createToken({ ...data }, '15m');

                console.log('token', token);
                console.log('data', data);

                let oldTime = new Date();
                let newTime = new Date(oldTime.getTime() + 15 * 60000);

                await transport.sendMail({
                    from: 'ADMIN @GAZEBO',
                    to: data.email,
                    subject: 'Verification Email Account',
                    html: `
                    <div style="text-align:center">
                        <h2 style="color: #006442">Thanks for signing up for Gazebo!</h2>
                        </br>
                        <h4 style="color: #231f20, ">We're happy you're here. Let's get your email address verified</h4>
                        <a href="http://localhost:3000/verification/${token}"
                            style="padding: 10px; color: #eee8da; background-color: #006442; font-weight: 600; border-radius:  10px; border: none; text-decoration: none;"
                        >Click to Verify Email</a>
                        <h5>Link Expired at ${newTime.toLocaleString()}</h5>
                        </br>
                        <h4>Thank You.</h4>
                        <h2 style="color: #006442">The Gazebo Team</h2>
                    </div>`
                });

                await dbQuery(`UPDATE dbgazebo.users SET verifToken = ${dbConf.escape(token)} WHERE idusers = ${dbConf.escape(data.idusers)};`)

                res.status(200).send({
                    success: true,
                    message: 'Register Success ✅'
                });
            }
        } catch (error) {
            console.log(error)
            res.status(500).send(error)
        }
    },

    login: async (req, res) => {
        try {
            const filter = [];
            for (const prop in req.body) {
                console.log(prop, req.body[prop]);
                if (req.body[prop] != "" && prop != "password") {
                    filter.push(`${prop} = ${dbConf.escape((req.body[prop]))}`);
                } else if (req.body[prop] != "" && prop == "password") {
                    filter.push(`${prop} = ${dbConf.escape(hashPassword(req.body[prop]))}`);
                }
            };
            let search = filter.join(" AND ");

            let sqlGet = await dbQuery(`SELECT * FROM dbgazebo.users u JOIN status s ON u.user_status = s.idstatus 
            WHERE ${search};`);

            //console.log(sqlGet);
            if (sqlGet.length > 0) {
                let token = createToken({ ...sqlGet[0] }, '24h')

                res.status(200).send({ ...sqlGet[0], token });
            } else {
                res.status(200).send({ ...sqlGet[0] });
            }
        } catch (error) {
            console.log("login failed", error);
            res.status(500).send(error)
        };
    },

    keepLogin: async (req, res) => {
        try {
            //console.log(req.dataToken)

            let result = await dbQuery(`SELECT * FROM dbgazebo.users u JOIN status s ON u.user_status = s.idstatus 
            WHERE idusers = ${req.dataToken.idusers};`)

            // console.log(result[0]);
            let token = createToken({ ...result[0] })
            res.status(200).send({ ...result[0], token });

        } catch (error) {
            console.log(error)
            res.status(500).send(error)
        }
    },

    editProfile: async (req, res) => {
        try {
            //console.log('data token',req.dataToken);
            console.log('reqbody',req.body);
            //console.log('req file', req.files);

            let data = JSON.parse(req.body.editprofile);
            console.log(data)
            console.log(data.username)

            if (req.files.length > 0) {

                let filter = [];

                filter.push(`user_profileimage = '/profilepic/${req.files[0].filename}'`);

                for (const prop in data) {
                    console.log(prop, data[prop])
                    filter.push(`${prop} = ${dbConf.escape(data[prop])}`)
                };

                await dbQuery(`UPDATE dbgazebo.users SET ${filter.join(" , ")} WHERE idusers = ${req.dataToken.idusers};`);
                await dbQuery(`UPDATE dbgazebo.post SET post_username = ${dbConf.escape(data.username)} WHERE post_user_id = ${req.dataToken.idusers};`);
                await dbQuery(`UPDATE dbgazebo.post SET post_user_image = '/profilepic/${req.files[0].filename}' WHERE post_user_id = ${req.dataToken.idusers};`);
                await dbQuery(`UPDATE dbgazebo.likes SET like_username = ${dbConf.escape(data.username)} WHERE like_user_id = ${req.dataToken.idusers};`);
                await dbQuery(`UPDATE dbgazebo.comments SET comment_username = ${dbConf.escape(data.username)} WHERE comment_user_id = ${req.dataToken.idusers};`);

                let getPic = await dbQuery(`SELECT user_profileimage FROM dbgazebo.users WHERE idusers = ${req.dataToken.idusers};`);
                
                console.log(getPic[0].user_profileimage)
                res.status(200).send({
                    success: true,
                    message: "Profile Updated",
                    newPic: getPic[0].user_profileimage
                });

            } else {

                let filter = [];

                for (const prop in data) {
                    console.log(prop, data[prop])
                    filter.push(`${prop} = ${dbConf.escape(data[prop])}`)
                };

                await dbQuery(`UPDATE dbgazebo.users SET ${filter.join(" , ")} WHERE idusers = ${req.dataToken.idusers};`);
                await dbQuery(`UPDATE dbgazebo.post SET post_username = ${dbConf.escape(data.username)} WHERE post_user_id = ${req.dataToken.idusers};`);
                await dbQuery(`UPDATE dbgazebo.likes SET like_username = ${dbConf.escape(data.username)} WHERE like_user_id = ${req.dataToken.idusers};`);
                await dbQuery(`UPDATE dbgazebo.comments SET comment_username = ${dbConf.escape(data.username)} WHERE comment_user_id = ${req.dataToken.idusers};`);
              
                res.status(200).send({
                    success: true,
                    message: "Profile Updated"
                });

            }

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },

    forgotPass: async (req, res) => {
        try {
            // console.log(req.body);

            let temp = [];
            for (let prop in req.body) {
                //console.log(prop, req.body[prop])
                temp.push(`${prop} = ${dbConf.escape(req.body[prop])}`);
            };

            let findSql = await dbQuery(`SELECT * FROM dbgazebo.users WHERE ${temp}`);

            if (findSql.length > 0){

                await dbQuery(`UPDATE dbgazebo.users SET passToken = null WHERE idusers = ${dbConf.escape(findSql[0].idusers)};`);

                let token = createToken({ ...findSql[0] }, '15m');

                let oldTime = new Date();
                let newTime = new Date(oldTime.getTime() + 15 * 60000);

                await transport.sendMail({
                    from: 'ADMIN @GAZEBO',
                    to: findSql[0].email,
                    subject: 'Reset Password',
                    html: `
                    <div style="text-align:center">
                        <h2 style="color: #006442">Reset Password</h2>
                        </br>
                        <h4 style="color: #231f20, ">A request has been recieved to change the password for your <span style="color: #006442; font-weight: 600">Gazebo</span> account</h4>
                        <a href="http://localhost:3000/resetpass/${token}"
                            style="padding: 10px; color: #eee8da; background-color: #006442; font-weight: 600; border-radius:  10px; border: none; text-decoration: none;"
                        >Reset Password</a>
                        <h5>Link Expired at ${newTime.toLocaleString()}</h5>
                        </br>
                        <h4>Thank You.</h4>
                        <h2 style="color: #006442">The Gazebo Team</h2>
                    </div>`
                });

                await dbQuery(`UPDATE dbgazebo.users SET passToken = ${dbConf.escape(token)} WHERE ${temp};`);

                res.status(200).send({
                    success: true,
                    message: 'Send Email Reset Password Success ✅'
                });
            }

        } catch (error) {
            res.status(500).send(error)
        }
    },

    updatePass: async (req, res) => {
        try {
            console.log(req.body);
            let data = req.dataToken;
            
            await dbQuery(`UPDATE dbgazebo.users SET password = ${dbConf.escape(hashPassword(req.body.password))} WHERE idusers = ${dbConf.escape(data.idusers)};`);
            
            res.status(200).send({
                success: true,
                message: "Password has been Updated ✅"
            });

        } catch (error) {
            res.status(500).send(error)
        }
    }
};