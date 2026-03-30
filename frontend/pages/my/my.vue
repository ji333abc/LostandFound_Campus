<template>
  <view class="page">
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
  background: #FBFBFA;
  padding-bottom: 120rpx;
}

/* 未登录状态 */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.prompt-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.3;
}

.prompt-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #37352F;
  margin-bottom: 12rpx;
}

.prompt-text {
  font-size: 28rpx;
  color: #9B9A97;
  text-align: center;
  margin-bottom: 40rpx;
}

.login-btn {
  padding: 24rpx 60rpx;
  background: #2383E2;
  color: #FFFFFF;
  border-radius: 6rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s;
}

.login-btn:active {
  background: #1a6ec7;
  transform: translateY(1rpx);
}
/* 用户信息区域 */
.user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx 40rpx;
}

.avatar-large {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #37352F;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #37352F;
  margin-bottom: 8rpx;
}

.user-info {
  font-size: 26rpx;
  color: #9B9A97;
  margin-bottom: 24rpx;
}

.logout-btn {
  padding: 12rpx 32rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  font-size: 26rpx;
  color: #787774;
  transition: all 0.2s;
}

.logout-btn:active {
  background: #F5F5F4;
}
/* 管理员入口 */
.admin-section {
  padding: 0 40rpx;
  margin-bottom: 48rpx;
}

.admin-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #FFF9E6;
  border: 1rpx solid #FFE8A3;
  border-radius: 6rpx;
  transition: all 0.2s;
}

.admin-card:active {
  background: #FFF4CC;
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
  font-weight: 600;
  color: #37352F;
  margin-bottom: 4rpx;
}

.admin-desc {
  font-size: 24rpx;
  color: #9B9A97;
}

.admin-arrow {
  font-size: 32rpx;
  color: #9B9A97;
}
/* 列表区域 */
.list-section {
  padding: 0 40rpx;
  margin-bottom: 36rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-label-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #37352F;
  margin-bottom: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.section-header .section-label {
  margin-bottom: 0;
}

.notify-badge {
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 10rpx;
  border-radius: 17rpx;
  background: #E5484D;
  color: #FFFFFF;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mark-all-btn {
  font-size: 24rpx;
  color: #2383E2;
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
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  transition: all 0.2s;
}

.notify-card.unread {
  border-color: #B6D7FF;
  background: #F7FBFF;
}

.notify-card:active,
.item-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
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
  font-weight: 600;
  color: #37352F;
  line-height: 1.4;
}

.notify-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 8rpx;
  background: #E5484D;
}

.notify-content {
  display: block;
  font-size: 26rpx;
  line-height: 1.6;
  color: #5F5E5B;
  margin-bottom: 16rpx;
}

.notify-bottom,
.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notify-score,
.item-time,
.notify-time {
  font-size: 24rpx;
  color: #9B9A97;
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
  font-weight: 600;
  color: #37352F;
  line-height: 1.4;
}

.item-status {
  padding: 6rpx 16rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.item-status.open {
  background: #E3F2FD;
  color: #2383E2;
}

.item-status.resolved {
  background: #E8F5E9;
  color: #0F7B6C;
}
/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
}

.empty-mini {
  padding: 28rpx 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
}

.empty-mini-text {
  font-size: 26rpx;
  color: #9B9A97;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 32rpx;
  color: #37352F;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #9B9A97;
}

.bottom-safe {
  height: 40rpx;
}
</style>