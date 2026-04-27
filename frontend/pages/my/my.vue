<template>
  <view class="page">
    <view class="page-shell">
      <!-- 未登录状态 -->
      <view v-if="!user" class="login-prompt">
      <text class="prompt-icon">👤</text>
      <text class="prompt-title">你还未登录</text>
      <text class="prompt-text">登录后可以查看和管理自己的发布记录</text>
      <button class="login-btn" @click="goLogin">立即登录</button>
    </view>

    <!-- 已登录状态 -->
    <view v-else>
      <!-- 用户信息卡片 -->
      <view class="user-section">
        <view class="avatar-large">{{ (user.username || '').slice(0, 1).toUpperCase() }}</view>
        <view class="user-name">{{ user.username }}</view>
        <view class="user-info" v-if="user.college || user.studentId">
          {{ user.college || '' }} {{ user.studentId || '' }}
        </view>
        <view class="logout-btn" @click="logout">
          <text>退出登录</text>
        </view>
      </view>

      <!-- 管理员入口 -->
      <view v-if="user.role === 'admin'" class="admin-section" @click="goAdmin">
        <view class="admin-card">
          <text class="admin-icon">⚙️</text>
          <view class="admin-content">
            <text class="admin-title">管理后台</text>
            <text class="admin-desc">管理所有失物信息与状态</text>
          </view>
          <text class="admin-arrow">→</text>
        </view>
      </view>

      <!-- 匹配提醒 -->
      <view class="list-section">
        <view class="section-header">
          <view class="section-label-row">
            <text class="section-label">匹配提醒</text>
            <view v-if="unreadCount > 0" class="notify-badge">{{ unreadCount }}</view>
          </view>
          <text v-if="notifications.length && unreadCount > 0" class="mark-all-btn" @click="handleMarkAllRead">全部已读</text>
        </view>

        <view v-if="notifications.length" class="notify-list">
          <view
            v-for="notification in notifications"
            :key="notification._id"
            class="notify-card"
            :class="notification.read ? 'read' : 'unread'"
            @click="openNotification(notification)"
          >
            <view class="notify-top">
              <text class="notify-title">{{ notification.title }}</text>
              <view v-if="!notification.read" class="notify-dot"></view>
            </view>
            <text class="notify-content">{{ notification.content }}</text>
            <view class="notify-bottom">
              <text class="notify-score">规则匹配 {{ notification.matchScore || 0 }} 分</text>
              <text class="notify-time">{{ formatTime(notification.createdAt) }}</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-mini">
          <text class="empty-mini-text">暂时还没有新的可能匹配提醒</text>
        </view>
      </view>

      <!-- 我的发布 -->
      <view class="list-section">
        <view class="section-label">我的发布</view>
        
        <view v-if="myList.length" class="item-list">
          <view
            v-for="item in myList"
            :key="item._id"
            class="item-card"
            @click="goDetail(item._id)"
          >
            <view class="item-top">
              <text class="item-emoji">{{ item.type === 'lost' ? '🔍' : '🎁' }}</text>
              <text class="item-title">{{ item.title }}</text>
            </view>
            <view class="item-bottom">
              <view class="item-status" :class="item.status === 'resolved' ? 'resolved' : 'open'">
                {{ item.status === 'resolved' ? '✓ 已解决' : '⏳ 进行中' }}
              </view>
              <text class="item-time" v-if="item.createdAt">
                {{ formatTime(item.createdAt) }}
              </text>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">
          <text class="empty-icon">📝</text>
          <text class="empty-text">你还没有发布任何信息</text>
          <text class="empty-hint">点击底部"发布"按钮开始发布</text>
        </view>
      </view>

      <view class="bottom-safe"></view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getMyItems,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '@/common/request.js';

export default {
  data() {
    return {
      user: null,
      myList: [],
      notifications: [],
      unreadCount: 0
    }
  },
  onShow() {
    this.user = uni.getStorageSync('user') || null;
    if (this.user) {
      this.fetchMyItems();
      this.fetchNotifications();
    }

    this.getTabBar && this.getTabBar().setSelected(2);
  },
  methods: {
    goLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    },
    async fetchMyItems() {
      try {
        const res = await getMyItems();
        this.myList = res.data || [];
      } catch (e) {
        this.myList = [];
        uni.showToast({ title: '加载我的发布失败', icon: 'none' });
      }
    },
    async fetchNotifications() {
      try {
        const res = await getMyNotifications({ limit: 10 });
        this.notifications = res.data || [];
        this.unreadCount = res.unreadCount || 0;
      } catch (e) {
        this.notifications = [];
        this.unreadCount = 0;
      }
    },
    goDetail(id) {
      uni.navigateTo({
        url: '/pages/detail/detail?id=' + id
      });
    },
    async openNotification(notification) {
      try {
        if (!notification.read) {
          await markNotificationRead(notification._id);
          notification.read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      } catch (e) {}

      const targetId = notification.matchedItem && notification.matchedItem._id;
      if (targetId) {
        this.goDetail(targetId);
      }
    },
    async handleMarkAllRead() {
      try {
        await markAllNotificationsRead();
        this.notifications = this.notifications.map((item) => ({
          ...item,
          read: true
        }));
        this.unreadCount = 0;
        uni.showToast({ title: '已全部标记为已读', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },
    goAdmin() {
      uni.navigateTo({
        url: '/pages/admin/items'
      });
    },
    formatTime(t) {
      if (!t) return '';
      return t.slice(0, 10);
    },
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出当前账号吗？',
        success: (res) => {
          if (!res.confirm) return;
          uni.removeStorageSync('token');
          uni.removeStorageSync('user');
          this.user = null;
          this.myList = [];
          this.notifications = [];
          this.unreadCount = 0;
          uni.showToast({ title: '已退出登录', icon: 'success' });
          setTimeout(() => {
            uni.switchTab({ url: '/pages/index/index' });
          }, 400);
        }
      });
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 20rpx 160rpx;
}

.page-shell {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}

.login-prompt {
  margin: 40rpx 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 32rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 16rpx 44rpx rgba(15, 23, 42, 0.06);
}

.prompt-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.35;
}

.prompt-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.prompt-text {
  font-size: 28rpx;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 40rpx;
}

.login-btn {
  padding: 24rpx 60rpx;
  background: linear-gradient(135deg, #4f7cff 0%, #6ea8ff 100%);
  color: #ffffff;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 16rpx 36rpx rgba(79, 124, 255, 0.2);
}

.login-btn:active {
  transform: translateY(2rpx);
}

.user-section {
  margin: 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 54rpx 40rpx 40rpx;
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.14) 0%, rgba(255, 255, 255, 0.96) 58%, rgba(236, 242, 255, 0.98) 100%);
  border-radius: 32rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18rpx 54rpx rgba(15, 23, 42, 0.08);
}

.avatar-large {
  width: 128rpx;
  height: 128rpx;
  border-radius: 64rpx;
  background: linear-gradient(135deg, #4f7cff 0%, #7c3aed 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  font-weight: 700;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 36rpx rgba(79, 124, 255, 0.22);
}

.user-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.user-info {
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 24rpx;
}

.logout-btn {
  padding: 14rpx 34rpx;
  background: rgba(255, 255, 255, 0.8);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 999rpx;
  font-size: 25rpx;
  color: #64748b;
}

.logout-btn:active {
  background: rgba(248, 250, 252, 0.95);
}

.admin-section,
.list-section {
  padding: 0;
}

.admin-section {
  margin-bottom: 28rpx;
}

.admin-card {
  display: flex;
  align-items: center;
  padding: 26rpx;
  background: rgba(245, 158, 11, 0.08);
  border: 1rpx solid rgba(245, 158, 11, 0.16);
  border-radius: 26rpx;
  box-shadow: 0 12rpx 34rpx rgba(245, 158, 11, 0.08);
}

.admin-card:active {
  transform: translateY(-2rpx);
}

.admin-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.admin-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4rpx;
}

.admin-desc {
  font-size: 24rpx;
  color: #b45309;
}

.admin-arrow {
  font-size: 32rpx;
  color: #b45309;
}

.list-section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.section-label-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-label {
  font-size: 24rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 18rpx;
  letter-spacing: 1rpx;
}

.section-header .section-label {
  margin-bottom: 0;
}

.notify-badge {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  border-radius: 18rpx;
  background: #ef4444;
  color: #ffffff;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mark-all-btn {
  font-size: 24rpx;
  color: #3d68eb;
  font-weight: 600;
}

.notify-list,
.item-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.notify-card,
.item-card {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 26rpx;
  transition: all 0.22s;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.05);
}

.notify-card.unread {
  border-color: rgba(79, 124, 255, 0.16);
  background: rgba(79, 124, 255, 0.05);
}

.notify-card:active,
.item-card:active {
  transform: translateY(-2rpx) scale(0.995);
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.08);
}

.notify-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.notify-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.45;
}

.notify-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 8rpx;
  background: #ef4444;
}

.notify-content {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: #64748b;
  margin-bottom: 16rpx;
}

.notify-bottom,
.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.notify-score,
.item-time,
.notify-time {
  font-size: 23rpx;
  color: #94a3b8;
}

.item-top {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-emoji {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.item-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.45;
}

.item-status {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.item-status.open {
  background: rgba(79, 124, 255, 0.1);
  color: #3d68eb;
}

.item-status.resolved {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.empty-state,
.empty-mini {
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(148, 163, 184, 0.14);
  border-radius: 28rpx;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.04);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
}

.empty-mini {
  padding: 28rpx 24rpx;
}

.empty-mini-text {
  font-size: 26rpx;
  color: #94a3b8;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 32rpx;
  color: #1f2937;
  margin-bottom: 12rpx;
  font-weight: 600;
}

.empty-hint {
  font-size: 26rpx;
  color: #94a3b8;
}

.bottom-safe {
  height: 40rpx;
}

@media screen and (min-width: 768px) {
  .page {
    padding: 24px 24px 180px;
  }

  .login-prompt,
  .user-section {
    border-radius: 24px;
  }

  .prompt-title,
  .user-name {
    font-size: 24px;
  }

  .prompt-text,
  .user-info,
  .notify-content,
  .empty-hint,
  .empty-mini-text {
    font-size: 14px;
  }

  .login-btn,
  .admin-title,
  .notify-title,
  .item-title,
  .empty-text {
    font-size: 16px;
  }

  .section-label,
  .admin-desc,
  .mark-all-btn,
  .notify-score,
  .item-time,
  .notify-time,
  .item-status {
    font-size: 13px;
  }

  .notify-list,
  .item-list {
    gap: 14px;
  }
}

@media screen and (min-width: 1024px) {
  .notify-list,
  .item-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .notify-card,
  .item-card {
    height: 100%;
  }
}
</style>