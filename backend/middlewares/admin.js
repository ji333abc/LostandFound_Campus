const User = require('../models/User');

async function adminMiddleware(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: '未登录' });
    }
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: '仅管理员可访问' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
}

module.exports = adminMiddleware;

