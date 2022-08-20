const { dbConf, dbQuery } = require('../config/db');

module.exports = {
    getData: async (req, res) => {
        try {
            console.log(req.query);

            if (req.query) {
                let result = await dbQuery(`SELECT p.idpost, p.post_user_id, p.post_username, p.post_image, p.post_caption, p.post_created, count(idlike) as totalLike, u.user_profileimage 
            FROM dbgazebo.post p LEFT JOIN dbgazebo.likes l ON p.idpost = l.post_id 
            LEFT JOIN dbgazebo.users u ON p.post_user_id = u.idusers GROUP BY idpost LIMIT ${parseInt(req.query.limit)} OFFSET ${parseInt(req.query.offset)};`);

                if (result.length > 0) {
                    let comp = result.map(async (val, idx) => {
                        let resultLike = await dbQuery(`SELECT idlike, like_user_id, like_username, like_created FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(val.idpost)}`);
                        let resultComment = await dbQuery(`SELECT idcomment, comment_user_id, comment_username, comment_created FROM dbgazebo.comments WHERE post_id = ${dbConf.escape(val.idpost)}`);
                        return { ...val, like: resultLike, comment: resultComment };
                    });
                    const resultsComp = await Promise.all(comp);
                    res.status(200).send(resultsComp);
                };
            } else {
                let result = await dbQuery(`SELECT p.idpost, p.post_user_id, p.post_username, p.post_image, p.post_caption, p.post_created, count(idlike) as totalLike, u.user_profileimage 
                FROM dbgazebo.post p LEFT JOIN dbgazebo.likes l ON p.idpost = l.post_id 
                LEFT JOIN dbgazebo.users u ON p.post_user_id = u.idusers GROUP BY idpost;`);

                if (result.length > 0) {
                    let comp = result.map(async (val, idx) => {
                        let resultLike = await dbQuery(`SELECT idlike, like_user_id, like_username, like_created FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(val.idpost)}`);
                        let resultComment = await dbQuery(`SELECT idcomment, comment_user_id, comment_username, comment_created FROM dbgazebo.comments WHERE post_id = ${dbConf.escape(val.idpost)}`);
                        return { ...val, like: resultLike, comment: resultComment };
                    });
                    const resultsComp = await Promise.all(comp);
                    res.status(200).send(resultsComp);
                };
            }

        } catch (error) {
            res.status(500).send(error);
        }
    },

    countData: async (req, res) => {
        try {
            let result = await dbQuery(`SELECT p.idpost, p.post_user_id, p.post_username, p.post_image, p.post_caption, p.post_created, count(idlike) as totalLike, u.user_profileimage 
                FROM dbgazebo.post p LEFT JOIN dbgazebo.likes l ON p.idpost = l.post_id 
                LEFT JOIN dbgazebo.users u ON p.post_user_id = u.idusers GROUP BY idpost;`);

            if (result.length > 0) {
                let comp = result.map(async (val, idx) => {
                    let resultLike = await dbQuery(`SELECT idlike, like_user_id, like_username, like_created FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(val.idpost)}`);
                    let resultComment = await dbQuery(`SELECT idcomment, comment_user_id, comment_username, comment_created FROM dbgazebo.comments WHERE post_id = ${dbConf.escape(val.idpost)}`);
                    return { ...val, like: resultLike, comment: resultComment };
                });
                const resultsComp = await Promise.all(comp);
                res.status(200).send(resultsComp);
            };

        } catch (error) {
            res.status(500).send(error);
        }
    },

    getSpecPost: async (req, res) => {
        try {
            //console.log(req.params);

            let sqlGet = await dbQuery(`SELECT * FROM dbgazebo.post WHERE idpost = ${dbConf.escape(req.params.id)};`);

            res.status(200).send({ ...sqlGet[0] })
        } catch (error) {
            res.status(500).send(error)
        }
    },

    addPost: async (req, res) => {
        try {
            // console.log(req.files);
            // console.log(req.body);

            let data = JSON.parse(req.body.postdata);
            // console.log(data);

            const { post_user_id, post_username, post_caption, post_user_image } = data;

            // console.log(post_user_id);
            // console.log(post_username);
            // console.log(post_caption);
            // console.log(post_user_image);

            await dbQuery(`INSERT INTO dbgazebo.post (post_user_id, post_username, post_user_image, post_image, post_caption) VALUES
            (${dbConf.escape(post_user_id)}, ${dbConf.escape(post_username)}, ${dbConf.escape(post_user_image)},'/asset/${req.files[0].filename}', ${dbConf.escape(post_caption)});
            `)

            res.status(200).send({
                success: true,
                message: "Post Success Created"
            });

        } catch (error) {
            res.status(500).send(error)
        }
    },

    ownPost: async (req, res) => {
        try {
            let sqlGet = await dbQuery(`SELECT * FROM dbgazebo.post WHERE post_user_id = ${dbConf.escape(req.dataToken.idusers)};`);

            if (sqlGet.length > 0) {
                let comp = sqlGet.map(async (val, idx) => {
                    let resultLike = await dbQuery(`SELECT idlike, like_user_id, like_username, like_created FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(val.idpost)}`);
                    let resultComment = await dbQuery(`SELECT idcomment, comment_user_id, comment_username, comment_created FROM dbgazebo.comments WHERE post_id = ${dbConf.escape(val.idpost)}`);
                    return { ...val, like: resultLike, comment: resultComment };
                });
                const resultsComp = await Promise.all(comp);
                res.status(200).send(resultsComp);
            };
        } catch (error) {
            res.status(500).send(error)
        }
    },

    likedPost: async (req, res) => {
        try {
            let sqlGet = await dbQuery(`SELECT p.* FROM dbgazebo.likes l LEFT JOIN dbgazebo.post p ON l.post_id = p.idpost WHERE l.like_user_id = ${dbConf.escape(req.dataToken.idusers)};`)

            if (sqlGet.length > 0) {
                let comp = sqlGet.map(async (val, idx) => {
                    let resultLike = await dbQuery(`SELECT idlike, like_user_id, like_username, like_created FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(val.idpost)}`);
                    let resultComment = await dbQuery(`SELECT idcomment, comment_user_id, comment_username, comment_created FROM dbgazebo.comments WHERE post_id = ${dbConf.escape(val.idpost)}`);
                    return { ...val, like: resultLike, comment: resultComment };
                });
                const resultsComp = await Promise.all(comp);
                res.status(200).send(resultsComp);
            };
        } catch (error) {
            res.status(500).send(error)
        }
    },

    editCaption: async (req, res) => {
        try {
            await dbQuery(`UPDATE dbgazebo.post SET post_caption = ${dbConf.escape(req.body.caption)} WHERE idpost = ${dbConf.escape(req.params.idpost)};`)

            res.status(200).send({
                success: true,
                message: "Caption Updated"
            })
        } catch (error) {
            res.status(500).send(error)
        }
    },

    deletePost: async (req, res) => {
        try {
            // console.log(req.params);
            await dbQuery(`DELETE FROM dbgazebo.post WHERE idpost = ${dbConf.escape(req.params.id)};`);
            await dbQuery(`DELETE FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(req.params.id)};`);
            await dbQuery(`DELETE FROM dbgazebo.comments WHERE post_id = ${dbConf.escape(req.params.id)};`);
            res.status(200).send({
                success: true,
                message: "Post Deleted"
            });
        } catch (error) {
            // console.log(error)
            res.status(500).send(error);
        }
    },

    getLikeData: async (req, res) => {
        try {
            //console.log(req.params)
            let result = await dbQuery(`SELECT like_user_id, like_username FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(req.params.id)};`);
            res.status(200).send(result);
        } catch (error) {
            // console.log(error);
            res.status(500).send(error);
        }
    },

    checkLike: async (req, res) => {
        try {
            // console.log(req.dataToken);
            // console.log(req.body);

            let sqlGet = await dbQuery(`SELECT * FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(req.body.idpost)} AND like_user_id = ${dbConf.escape(req.dataToken.idusers)};`)

            res.status(200).send({ ...sqlGet[0] });
        } catch (error) {
            res.status(500).send(error)
        }
    },

    addLike: async (req, res) => {
        try {
            //console.log(req.dataToken);
            //console.log(req.body);

            await dbQuery(`INSERT INTO dbgazebo.likes (like_user_id, like_username, post_id) VALUES
            (${dbConf.escape(req.dataToken.idusers)}, ${dbConf.escape(req.dataToken.username)}, ${dbConf.escape(req.body.idpost)})`);

            let sqlGet = await dbQuery(`SELECT p.* FROM dbgazebo.likes l LEFT JOIN dbgazebo.post p ON l.post_id = p.idpost WHERE l.like_user_id = ${dbConf.escape(req.dataToken.idusers)};`);

            // console.log(sqlGet);

            res.status(200).send({
                success: true,
                message: "Post Liked",
                liked: sqlGet
            })
        } catch (error) {
            // console.log(error)
            res.status(500).send(error)
        }
    },

    deleteLike: async (req, res) => {
        try {
            //console.log(req.params);
            //console.log(req.dataToken);

            await dbQuery(`DELETE FROM dbgazebo.likes WHERE post_id = ${dbConf.escape(req.params.idpost)} AND like_user_id = ${dbConf.escape(req.dataToken.idusers)};`);

            let sqlGet = await dbQuery(`SELECT p.* FROM dbgazebo.likes l LEFT JOIN dbgazebo.post p ON l.post_id = p.idpost WHERE l.like_user_id = ${dbConf.escape(req.dataToken.idusers)};`);

            // console.log(sqlGet);

            res.status(200).send({
                success: true,
                message: "Like Deleted",
                liked: sqlGet
            })
        } catch (error) {
            res.status(500).send(error)
        }
    },

    getCommentData: async (req, res) => {
        try {
            let sqlGet = await dbQuery(`SELECT c.*, u.user_profileimage FROM dbgazebo.comments c 
                LEFT JOIN dbgazebo.users u ON u.idusers = c.comment_user_id 
                WHERE c.post_id = ${dbConf.escape(req.params.idpost)} LIMIT ${parseInt(req.query.limit)} OFFSET ${parseInt(req.query.offset)};`);
            //console.table(sqlGet);
            res.status(200).send(sqlGet)
        } catch (error) {
            res.status(500).send(error)
        }
    },

    countComm: async (req, res) => {
        try {
            let sqlGet = await dbQuery(`SELECT c.*, u.user_profileimage FROM dbgazebo.comments c 
                LEFT JOIN dbgazebo.users u ON u.idusers = c.comment_user_id 
                WHERE c.post_id = ${dbConf.escape(req.params.idpost)};`);
            //console.table(sqlGet);
            res.status(200).send(sqlGet)
        } catch (error) {
            res.status(500).send(error)
        }
    },

    addComment: async (req, res) => {
        try {
            // console.log(req.body);
            // console.log(req.dataToken);

            await dbQuery(`INSERT INTO dbgazebo.comments (comment_user_id, comment_username, comment_content, post_id) VALUES
            (${dbConf.escape(req.dataToken.idusers)}, ${dbConf.escape(req.dataToken.username)}, ${dbConf.escape(req.body.comment)}, ${dbConf.escape(req.body.idpost)});`);

            res.status(200).send({
                success: true,
                message: "Comment Added"
            })
        } catch (error) {
            res.status(500).send(error)
        }
    }
};