const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const onlyUnread = ['1', 'true', 'yes', 'on'].includes(String(req.query.onlyUnread || '').toLowerCase());
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));
    const filter = { user: req.user.id };

    if (onlyUnread) {
      filter.read = false;
    }

    const [list, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sourceItem', 'title type status')
        .populate('matchedItem', 'title type status'),
      Notification.countDocuments({ user: req.user.id, read: false })
    ]);

    res.json({
      data: list,
      unreadCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) {
      return res.status(404).json({ message: '通知不存在' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: '已标记为已读', data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({ message: '已全部标记为已读' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
