 
const multer = require("multer");
// const storage = multer.memoryStorage();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const fileExtension = file.originalname.substring(file.originalname.lastIndexOf(".") + 1);
        const randomNumber = Math.floor(Math.random()*1000);
        cb(null, `${Date.now()}${randomNumber}.${fileExtension}`);
    }
});

function fileFilter(file, file, cb) {
    console.log('file.mimetype', file.mimetype)
    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png")
        return cb(new Error("Định dạng file không hợp lệ"));
    cb(null, true);
}

// const upload = multer({ storage, fileFilter, limits: { fileSize: 10240000 } });
const upload = multer({
    storage,
    fileFilter
});

module.exports = {
    upload
};