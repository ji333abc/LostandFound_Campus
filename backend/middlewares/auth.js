const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ message: '未提供 token' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'token 无效或已过期' });
  }
}

module.exports = authMiddleware;

