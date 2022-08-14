// auth.js fungsinya untuk manajemen data user

const { dbConf, dbQuery } = require('../config/db');
const { hashPassword, createToken } = require('../config/encrypt');
const fs = require('fs');
const { transport } = require('../config/nodemailer');

module.exports = {
    getData: async (req, res) => {
        try {
            let result = await dbQuery(`SELECT * FROM users u JOIN status s ON u.user_status = s.idstatus;`);

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

            let sqlInsert = await dbQuery(`INSERT INTO users (username, email, password) VALUES
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
                    html: `<div>
                    <h3>Click link below</h3>
                    <a href="http://localhost:3000/verification/${token}">http://localhost:3000/verification/${token}</a>
                    <h4>Link Expired at ${newTime.toLocaleString()}</h4>
                    </div>`
                });

                await dbQuery(`UPDATE users SET verifToken = ${dbConf.escape(token)} WHERE idusers = ${dbConf.escape(sqlInsert.insertId)};`)

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

    resendEmail: async (req, res) =>{
        try {
            let data = req.dataToken;

            //console.log(data);

            if (data.idusers) {
                delete data.iat;
                delete data.exp;
                let token = createToken({...data}, '15m');

                console.log('token',token);
                console.log('data',data);

                let oldTime = new Date();
                let newTime = new Date(oldTime.getTime() + 15 * 60000);

                await transport.sendMail({
                    from: 'ADMIN @GAZEBO',
                    to: data.email,
                    subject: 'Verification Email Account',
                    html: `<div>
                    <h3>Click link below</h3>
                    <a href="http://localhost:3000/verification/${token}">http://localhost:3000/verification/${token}</a>
                    <h4>Link Expired at ${newTime.toLocaleString()}</h4>
                    </div>`
                });

                await dbQuery(`UPDATE users SET verifToken = ${dbConf.escape(token)} WHERE idusers = ${dbConf.escape(data.idusers)};`)

                res.status(200).send({
                    success: true,
                    message: 'Register Success ✅'
                });
            }
        } catch (error){
            console.log(error)
            res.status(500).send(error)
        }
    },

    login: async (req, res) => {
        try {
            const filter = [];
            for (const prop in req.body){
                console.log(prop, req.body[prop]);
                if (req.body[prop] != "" && prop != "password"){
                    filter.push(`${prop} = ${dbConf.escape((req.body[prop]))}`);
                } else if (req.body[prop] != "" && prop == "password"){
                    filter.push(`${prop} = ${dbConf.escape(hashPassword(req.body[prop]))}`);
                }
            };
            let search = filter.join(" AND ");

            let sqlGet = await dbQuery(`SELECT * FROM users u JOIN status s ON u.user_status = s.idstatus 
            WHERE ${search};`);

            //console.log(sqlGet);
            if (sqlGet.length > 0){
                let token = createToken({ ...sqlGet[0] }, '24h')
    
                res.status(200).send({ ...sqlGet[0], token });
            } else {
                res.status(200).send({ ...sqlGet[0]});
            }
        } catch (error) {
            console.log("login failed", error);
            res.status(500).send(error)
        };
    },

    keepLogin: async (req, res) => {
        try {
            //console.log(req.dataToken)

            let result = await dbQuery(`SELECT * FROM users u JOIN status s ON u.user_status = s.idstatus 
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
            //console.log('reqbody',req.body);
            //console.log('req file', req.files);

            let data = JSON.parse(req.body.editprofile);

            if (req.files.length > 0){
                
                let filter = [];

                filter.push(`user_profileimage = '/profilepic/${req.files[0].filename}'`);

                for (const prop in data){
                    console.log(prop, data[prop])
                    filter.push(`${prop} = ${dbConf.escape(data[prop])}`)
                };

                await dbQuery(`UPDATE users SET ${filter.join(" , ")} WHERE idusers = ${req.dataToken.idusers};`);

                res.status(200).send({
                    success: true,
                    message: "Profile Updated"
                });

            } else {

                let filter = [];

                for (const prop in data){
                    console.log(prop, data[prop])
                    filter.push(`${prop} = ${dbConf.escape(data[prop])}`)
                };

                await dbQuery(`UPDATE users SET ${filter.join(" , ")} WHERE idusers = ${req.dataToken.idusers};`);

                res.status(200).send({
                    success: true,
                    message: "Profile Updated"
                });

            }

        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    }
};