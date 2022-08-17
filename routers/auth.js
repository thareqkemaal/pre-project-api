const express = require('express');
const { readToken } = require('../config/encrypt');
const { uploader } = require('../config/uploader');
const { authController } = require('../controllers')
const route = express.Router();

const profileUploader = uploader('/profilePic', 'userimage').array('user_profileimage', 1)

route.get('/users', authController.getData);
route.post('/login', authController.login);
route.post('/register', authController.register);
route.patch('/keep', readToken, authController.keepLogin);
route.patch('/edit', profileUploader, readToken, authController.editProfile);
route.patch('/verify', readToken, authController.getVerify);
route.patch('/resend', readToken, authController.resendEmail);
route.post('/forgot', authController.forgotPass);
route.patch('/updatepass', readToken, authController.updatePass);


module.exports = route;