const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, studentId, college, phone, wechat } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码必填' });
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: '用户名长度必须在 3-20 位之间' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: '用户名只能包含字母、数字和下划线' });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少需要 6 位' });
    }

    // 验证手机号格式（如果提供）
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: '手机号格式不正确' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashed,
      studentId,
      college,
      phone,
      wechat,
      role: 'user'
    });

    res.json({ message: '注册成功', user: { id: user._id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: '密码错误' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: '服务器配置错误' });
    }
    
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        studentId: user.studentId,
        college: user.college,
        phone: user.phone,
        wechat: user.wechat,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

