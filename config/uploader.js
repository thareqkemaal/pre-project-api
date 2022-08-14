const multer = require('multer');
const fs = require('fs');

module.exports = {
    uploader: (directory, filePrefix) => {
        let deafultDir = './public';

        // konfigurasi multer
        const storageUploader = multer.diskStorage({
            destination: (req, file, cb) => {
                const pathDir = directory ? deafultDir + directory : deafultDir;

                if (fs.existsSync(pathDir)){
                    console.log("pathDir Exist✅");
                    cb(null, pathDir);
                } else {
                    fs.mkdir(pathDir, {recursive: true}, (error) =>{
                        if (error){
                            console.log("mkdir error", error);
                        } else {
                            return cb(error, pathDir)
                        }
                    })
                }
            },
            
            filename: (req, file, cb) => {
                let ext = file.originalname.split('.');

                let newName = filePrefix + Date.now() + '.' + ext[ext.length-1];

                cb(null, newName);
            }
        });

        const filterFile = (req, file, cb) => {
            const extFilter = /\.(jpg|jpeg|svg|png|webp|ai|pdf|raw)/;

            if (file.originalname.toLowerCase().match(extFilter)){
                cb(null, true);
            } else {
                cb(new Error('file extension denied❌', false));
            }
        }

        return multer({storage: storageUploader, filterFile});
    }
}