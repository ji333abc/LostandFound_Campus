const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const router = express.Router();

// 所有 admin 路由都需要先登录再校验管理员
router.use(auth, admin);

// 获取用户列表（简单版）
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('username studentId college phone role createdAt');
    res.json({ data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户角色（例如设置为 admin）
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: '角色不合法' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('username role');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ message: '更新成功', data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取全部物品信息（带简单筛选）
router.get('/items', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .populate('owner', 'username');
    res.json({ data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员强制更新物品状态
router.put('/items/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({ message: '状态不合法' });
    }
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: '未找到该信息' });
    }
    res.json({ message: '状态已更新', data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员删除物品
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: '未找到该信息' });
    }
    await item.deleteOne();
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

