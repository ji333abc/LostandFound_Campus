<template>
  <view class="m3-page">
    <view class="m3-shell">
      <view class="notice-hero m3-card">
        <view class="notice-hero-copy">
          <text class="m3-title">通知</text>
          <text class="m3-subtitle">{{ unreadCount ? `${unreadCount} 条未读提醒` : '所有提醒已读' }}</text>
        </view>
        <button v-if="loggedIn" class="m3-btn secondary hero-btn" @tap="markAllRead">全部已读</button>
      </view>

      <view v-if="!loggedIn" class="m3-card login-card">
        <text class="login-title">登录后查看通知</text>
        <button class="m3-btn login-btn" @tap="goLogin">登录</button>
      </view>

      <block v-else>
        <view class="m3-segment notice-segment">
          <view
            class="m3-segment-item"
            :class="{ active: !onlyUnread }"
            @tap="setUnread(false)"
          >
            <text>全部</text>
          </view>
          <view
            class="m3-segment-item"
            :class="{ active: onlyUnread }"
            @tap="setUnread(true)"
          >
            <text>未读</text>
          </view>
        </view>

        <view v-if="loading" class="m3-card soft-empty">
          <text>正在加载</text>
        </view>
        <view v-else-if="notifications.length === 0" class="m3-card m3-empty">
          <text class="m3-empty-title">暂无通知</text>
        </view>
        <view v-else class="notice-list">
          <view
            v-for="notice in notifications"
            :key="notice._id"
            class="m3-card notice-card"
            :class="{ unread: !notice.read }"
            @tap="openNotification(notice)"
          >
            <view class="notice-head">
              <text class="notice-title">{{ notice.title }}</text>
              <text class="m3-chip" :class="{ tonal: notice.matchLevel !== 'high', primary: notice.matchLevel === 'high' }">
                {{ notice.matchScore || 0 }}
              </text>
            </view>
            <text class="notice-content">{{ notice.content }}</text>
            <view class="notice-meta">
              <text>{{ formatDateTime(notice.createdAt) }}</text>
              <text>{{ notice.read ? '已读' : '未读' }}</text>
            </view>
          </view>
        </view>
      </block>
    </view>
  </view>
</template>

<script>
import { request, isLoggedIn } from '../../common/request.js';
import { formatDateTime, toastError } from '../../common/utils.js';

export default {
  data() {
    return {
      loggedIn: false,
      onlyUnread: false,
      notifications: [],
      unreadCount: 0,
      loading: false
    };
  },
  onShow() {
    this.loggedIn = isLoggedIn();
    if (this.loggedIn) {
      this.loadNotifications();
    }
  },
  methods: {
    setUnread(value) {
      if (this.onlyUnread === value) return;
      this.onlyUnread = value;
      this.loadNotifications();
    },
    async loadNotifications() {
      this.loading = true;
      try {
        const res = await request({
          url: '/notifications',
          data: {
            limit: 50,
            onlyUnread: this.onlyUnread ? 'true' : ''
          }
        });
        this.notifications = Array.isArray(res.data) ? res.data : [];
        this.unreadCount = Number(res.unreadCount || 0);
      } catch (error) {
        toastError(error, '通知加载失败');
      } finally {
        this.loading = false;
      }
    },
    async markAllRead() {
      try {
        await request({
          url: '/notifications/read-all',
          method: 'PUT'
        });
        this.notifications.forEach((notice) => {
          notice.read = true;
        });
        this.unreadCount = 0;
      } catch (error) {
        toastError(error, '操作失败');
      }
    },
    async openNotification(notice) {
      if (!notice.read) {
        try {
          await request({
            url: `/notifications/${notice._id}/read`,
            method: 'PUT'
          });
          notice.read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        } catch (error) {
          toastError(error, '通知更新失败');
        }
      }

      const target =
        (notice.matchedItem && notice.matchedItem._id) ||
        (notice.sourceItem && notice.sourceItem._id);
      if (target) {
        uni.navigateTo({
          url: `/pages/detail/detail?id=${target}`
        });
      }
    },
    goLogin() {
      uni.navigateTo({
        url: '/pages/login/login?redirect=%2Fpages%2Fnotifications%2Fnotifications'
      });
    },
    formatDateTime
  }
};
</script>

<style>
.notice-hero {
  position: relative;
  min-height: 148rpx;
  padding: 34rpx 190rpx 34rpx 34rpx;
}

.notice-hero-copy {
  min-width: 0;
}

.hero-btn {
  position: absolute;
  top: 28rpx;
  right: 28rpx;
  min-width: 132rpx;
  min-height: 58rpx;
  padding: 0 20rpx;
  font-size: 24rpx;
  font-weight: 750;
}

.login-card {
  margin-top: 24rpx;
  padding: 32rpx;
}

.login-title {
  display: block;
  color: #171d1b;
  font-size: 32rpx;
  font-weight: 760;
}

.login-btn {
  margin-top: 26rpx;
}

.notice-segment {
  margin-top: 24rpx;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 24rpx;
}

.notice-card {
  padding: 26rpx;
}

.notice-card.unread {
  border-color: rgba(0, 106, 96, 0.34);
}

.notice-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.notice-title {
  flex: 1;
  min-width: 0;
  color: #171d1b;
  font-size: 29rpx;
  font-weight: 760;
  line-height: 1.35;
}

.notice-content {
  display: block;
  margin-top: 14rpx;
  color: #506059;
  font-size: 26rpx;
  line-height: 1.55;
}

.notice-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
}

.notice-meta text {
  color: #60706a;
  font-size: 23rpx;
}

.soft-empty {
  margin-top: 24rpx;
  padding: 48rpx 0;
  color: #60706a;
  text-align: center;
}
</style>
