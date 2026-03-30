const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器：只允许图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('只允许上传图片文件（jpg, png, gif, webp）'));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  },
  fileFilter
});

router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '没有收到文件' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ message: '上传成功', url: fileUrl });
});

// 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小不能超过 5MB' });
    }
    return res.status(400).json({ message: '文件上传失败：' + err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});


module.exports = router;

