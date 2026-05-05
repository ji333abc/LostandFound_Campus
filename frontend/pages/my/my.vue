<template>
  <view class="m3-page tab-page">
    <view class="m3-shell">
      <view class="profile-card m3-card">
        <view class="profile-main">
          <view class="avatar">
            <text>{{ avatarText }}</text>
          </view>
          <view class="profile-info">
            <text class="profile-name">{{ loggedIn ? displayName : '未登录' }}</text>
            <text class="profile-meta">{{ loggedIn ? profileMeta : '登录后查看通知和发布记录' }}</text>
          </view>
        </view>

        <view v-if="loggedIn" class="profile-actions">
          <button class="m3-btn secondary" @tap="goPublish">发布</button>
          <button v-if="isAdmin" class="m3-btn secondary" @tap="goAdmin">管理</button>
          <button class="m3-btn text" @tap="logout">退出</button>
        </view>
        <view v-else class="profile-actions">
          <button class="m3-btn" @tap="goLogin">登录</button>
          <button class="m3-btn secondary" @tap="goRegister">注册</button>
        </view>
      </view>

      <block v-if="loggedIn">
        <view class="m3-card block-card notification-card">
          <view class="block-title-row">
            <text class="block-title">通知</text>
            <button class="notification-more-btn" @tap="goNotifications">
              {{ unreadCount ? `${unreadCount} 条未读` : '查看全部' }}
            </button>
          </view>

          <view v-if="notifications.length === 0" class="soft-empty">
            <text>暂无通知</text>
          </view>
          <view v-else class="notice-list">
            <view
              v-for="notice in notifications"
              :key="notice._id"
              class="notice-item"
              :class="{ unread: !notice.read }"
              @tap="openNotification(notice)"
            >
              <view class="notice-dot"></view>
              <view class="notice-main">
                <text class="notice-title">{{ notice.title }}</text>
                <text class="notice-content">{{ notice.content }}</text>
              </view>
              <text class="notice-score">{{ notice.matchScore || 0 }}</text>
            </view>
          </view>
        </view>

        <view class="m3-section-title">
          <text>我的发布</text>
          <text>{{ items.length }} 条</text>
        </view>

        <view v-if="loading" class="m3-card soft-empty loading-block">
          <text>正在加载</text>
        </view>
        <view v-else-if="items.length === 0" class="m3-card m3-empty">
          <text class="m3-empty-title">暂无发布</text>
          <button class="m3-btn secondary empty-action" @tap="goPublish">发布信息</button>
        </view>
        <view v-else class="my-list">
          <view v-for="item in items" :key="item._id" class="m3-card my-item">
            <view class="my-item-head" @tap="goDetail(item._id)">
              <view>
                <text class="my-item-title">{{ item.title }}</text>
                <text class="my-item-meta">
                  {{ itemTypeLabel(item.type) }} · {{ item.category || '未分类' }} · {{ formatDateTime(item.createdAt) }}
                </text>
              </view>
              <text class="m3-chip" :class="{ warn: item.status === 'resolved' }">
                {{ statusLabel(item.status) }}
              </text>
            </view>
            <view class="my-item-actions">
              <button class="m3-btn secondary small-action" @tap="goDetail(item._id)">详情</button>
              <button
                class="m3-btn secondary small-action"
                @tap="toggleStatus(item)"
              >
                {{ item.status === 'open' ? '完结' : '开启' }}
              </button>
              <button class="m3-btn danger small-action" @tap="deleteItem(item)">删除</button>
            </view>
          </view>
        </view>
      </block>
    </view>
  </view>
</template>

<script>
import {
  request,
  getStoredUser,
  getToken,
  saveSession,
  clearSession,
  isLoggedIn
} from '../../common/request.js';
import {
  formatDateTime,
  itemTypeLabel,
  statusLabel,
  toastError,
  userIdOf
} from '../../common/utils.js';

function confirmAction(title, content) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success(res) {
        resolve(Boolean(res.confirm));
      },
      fail() {
        resolve(false);
      }
    });
  });
}

export default {
  data() {
    return {
      loggedIn: false,
      user: null,
      items: [],
      notifications: [],
      unreadCount: 0,
      loading: false
    };
  },
  computed: {
    displayName() {
      return (this.user && this.user.username) || '用户';
    },
    avatarText() {
      return this.loggedIn ? this.displayName.slice(0, 1).toUpperCase() : '未';
    },
    profileMeta() {
      if (!this.user) return '';
      const parts = [];
      if (this.user.college) parts.push(this.user.college);
      parts.push(this.isAdmin ? '管理员' : '普通用户');
      return parts.join(' · ');
    },
    isAdmin() {
      return this.user && this.user.role === 'admin';
    }
  },
  onShow() {
    this.setTabBarIndex();
    this.refreshSession();
  },
  methods: {
    setTabBarIndex() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setSelected(2);
      }
    },
    refreshSession() {
      this.loggedIn = isLoggedIn();
      this.user = getStoredUser();

      if (this.loggedIn) {
        this.loadAll();
      } else {
        this.items = [];
        this.notifications = [];
        this.unreadCount = 0;
      }
    },
    async loadAll() {
      this.loading = true;
      try {
        await this.loadMe();
        await Promise.all([this.loadItems(), this.loadNotifications()]);
      } catch (error) {
        toastError(error, '数据加载失败');
      } finally {
        this.loading = false;
      }
    },
    async loadMe() {
      const res = await request({
        url: '/auth/me'
      });
      const user = res.data || null;
      if (user) {
        user.id = userIdOf(user);
        this.user = user;
        saveSession(getToken(), user);
      }
    },
    async loadItems() {
      const res = await request({
        url: '/items/my'
      });
      this.items = Array.isArray(res.data) ? res.data : [];
    },
    async loadNotifications() {
      const res = await request({
        url: '/notifications',
        data: {
          limit: 5
        }
      });
      this.notifications = Array.isArray(res.data) ? res.data : [];
      this.unreadCount = Number(res.unreadCount || 0);
    },
    goLogin() {
      uni.navigateTo({
        url: '/pages/login/login?redirect=%2Fpages%2Fmy%2Fmy'
      });
    },
    goRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    },
    goPublish() {
      uni.switchTab({
        url: '/pages/publish/publish'
      });
    },
    goNotifications() {
      uni.navigateTo({
        url: '/pages/notifications/notifications'
      });
    },
    goAdmin() {
      uni.navigateTo({
        url: '/pages/admin/items'
      });
    },
    goDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },
    logout() {
      clearSession();
      this.refreshSession();
      uni.showToast({
        title: '已退出',
        icon: 'success'
      });
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
        this.goDetail(target);
      }
    },
    async toggleStatus(item) {
      const nextStatus = item.status === 'open' ? 'resolved' : 'open';
      try {
        const res = await request({
          url: `/items/${item._id}`,
          method: 'PUT',
          data: {
            status: nextStatus
          }
        });
        Object.assign(item, res.data || { status: nextStatus });
      } catch (error) {
        toastError(error, '状态更新失败');
      }
    },
    async deleteItem(item) {
      const ok = await confirmAction('删除信息', '删除后不可恢复，确认继续？');
      if (!ok) return;

      try {
        await request({
          url: `/items/${item._id}`,
          method: 'DELETE'
        });
        this.items = this.items.filter((entry) => entry._id !== item._id);
      } catch (error) {
        toastError(error, '删除失败');
      }
    },
    formatDateTime,
    itemTypeLabel,
    statusLabel
  }
};
</script>

<style>
.profile-card {
  padding: 32rpx;
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104rpx;
  height: 104rpx;
  border-radius: 999rpx;
  background: #cce8e1;
  color: #006a60;
  font-size: 42rpx;
  font-weight: 800;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  display: block;
  color: #171d1b;
  font-size: 38rpx;
  font-weight: 780;
}

.profile-meta {
  display: block;
  margin-top: 8rpx;
  color: #60706a;
  font-size: 25rpx;
  line-height: 1.45;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 28rpx;
}

.block-card {
  margin-top: 24rpx;
  padding: 30rpx;
}

.notification-card {
  position: relative;
  padding-top: 34rpx;
}

.block-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.block-title {
  color: #171d1b;
  font-size: 32rpx;
  font-weight: 760;
}

.small-btn {
  min-height: 56rpx;
  padding: 0 12rpx;
  font-size: 24rpx;
}

.notification-more-btn {
  position: absolute;
  top: 22rpx;
  right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 128rpx;
  min-height: 54rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #cce8e1;
  color: #006a60;
  font-size: 23rpx;
  font-weight: 750;
}

.notice-list {
  margin-top: 18rpx;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #e1e8e3;
}

.notice-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 999rpx;
  background: #c1ccc6;
}

.notice-item.unread .notice-dot {
  background: #006a60;
}

.notice-main {
  flex: 1;
  min-width: 0;
}

.notice-title,
.notice-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-title {
  color: #1f332d;
  font-size: 27rpx;
  font-weight: 750;
}

.notice-content {
  margin-top: 7rpx;
  color: #60706a;
  font-size: 23rpx;
}

.notice-score {
  flex: 0 0 auto;
  color: #006a60;
  font-size: 25rpx;
  font-weight: 800;
}

.soft-empty {
  padding: 34rpx 0 12rpx;
  color: #60706a;
  font-size: 25rpx;
  text-align: center;
}

.loading-block {
  margin-top: 20rpx;
}

.my-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.my-item {
  padding: 26rpx;
}

.my-item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.my-item-title {
  display: block;
  color: #171d1b;
  font-size: 30rpx;
  font-weight: 760;
  line-height: 1.3;
}

.my-item-meta {
  display: block;
  margin-top: 8rpx;
  color: #60706a;
  font-size: 23rpx;
  line-height: 1.45;
}

.my-item-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 22rpx;
}

.small-action {
  flex: 1;
  min-height: 66rpx;
  font-size: 24rpx;
}

.empty-action {
  margin-top: 24rpx;
}
</style>
