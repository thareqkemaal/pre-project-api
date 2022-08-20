const express = require('express');
const { uploader } = require('../config/uploader');
const { postController } = require('../controllers');
const { readToken } = require('../config/encrypt');
const route = express.Router();

const postUploader = uploader('/asset', 'postimage').array('post_image', 1);

//route post
route.get('/', postController.getData);
route.get('/detail/:id', postController.getSpecPost);
route.get('/ownpost', readToken, postController.ownPost);
route.get('/likedpost', readToken, postController.likedPost);
route.post('/add', postUploader, postController.addPost);
route.patch('/editcaption/:idpost', postController.editCaption);
route.delete('/delete/:id', postController.deletePost);
route.get('/countdata', postController.countData);

//route like
route.get('/like/:id', postController.getLikeData);
route.post('/check', readToken, postController.checkLike);
route.post('/addlike', readToken, postController.addLike);
route.delete('/deletelike/:idpost', readToken, postController.deleteLike);

//route comment
route.get('/comment/:idpost', postController.getCommentData);
route.post('/addcomment', readToken, postController.addComment);
route.get('/countcomment/:idpost', postController.countComm);

module.exports = route;