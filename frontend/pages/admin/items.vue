<template>
  <view class="m3-page">
    <view class="m3-shell">
      <view class="admin-hero m3-card">
        <view>
          <text class="m3-title">信息管理</text>
          <text class="m3-subtitle">管理员可更新状态或删除无效信息。</text>
        </view>
        <button class="m3-btn secondary hero-btn" @tap="loadItems">刷新</button>
      </view>

      <view v-if="authorized === false" class="m3-card m3-empty">
        <text class="m3-empty-title">无管理权限</text>
        <button class="m3-btn secondary empty-action" @tap="goHome">返回首页</button>
      </view>

      <block v-else>
        <view class="filter-card m3-card">
          <view class="m3-segment">
            <view
              v-for="option in typeFilters"
              :key="option.value"
              class="m3-segment-item"
              :class="{ active: filters.type === option.value }"
              @tap="setFilter('type', option.value)"
            >
              <text>{{ option.label }}</text>
            </view>
          </view>
          <view class="m3-segment status-segment">
            <view
              v-for="option in statusFilters"
              :key="option.value"
              class="m3-segment-item"
              :class="{ active: filters.status === option.value }"
              @tap="setFilter('status', option.value)"
            >
              <text>{{ option.label }}</text>
            </view>
          </view>
        </view>

        <view v-if="loading" class="m3-card soft-empty">
          <text>正在加载</text>
        </view>
        <view v-else-if="items.length === 0" class="m3-card m3-empty">
          <text class="m3-empty-title">暂无信息</text>
        </view>
        <view v-else class="admin-list">
          <view v-for="item in items" :key="item._id" class="m3-card admin-item">
            <view class="admin-item-head" @tap="goDetail(item._id)">
              <view class="admin-main">
                <text class="admin-title">{{ item.title }}</text>
                <text class="admin-meta">
                  {{ itemTypeLabel(item.type) }} · {{ item.category || '未分类' }} · {{ ownerName(item) }}
                </text>
                <text class="admin-meta">{{ formatDateTime(item.createdAt) }}</text>
              </view>
              <text class="m3-chip" :class="{ warn: item.status === 'resolved' }">
                {{ statusLabel(item.status) }}
              </text>
            </view>
            <view class="admin-actions">
              <button
                class="m3-btn secondary admin-action"
                @tap="updateStatus(item, item.status === 'open' ? 'resolved' : 'open')"
              >
                {{ item.status === 'open' ? '完结' : '开启' }}
              </button>
              <button class="m3-btn secondary admin-action" @tap="goDetail(item._id)">详情</button>
              <button class="m3-btn danger admin-action" @tap="deleteItem(item)">删除</button>
            </view>
          </view>
        </view>
      </block>
    </view>
  </view>
</template>

<script>
import { request, isLoggedIn, getStoredUser, saveSession, getToken } from '../../common/request.js';
import { formatDateTime, itemTypeLabel, statusLabel, toastError, userIdOf } from '../../common/utils.js';

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
      authorized: null,
      loading: false,
      items: [],
      user: null,
      filters: {
        type: '',
        status: ''
      },
      typeFilters: [
        { label: '全部', value: '' },
        { label: '寻物', value: 'lost' },
        { label: '招领', value: 'found' }
      ],
      statusFilters: [
        { label: '全部', value: '' },
        { label: '进行中', value: 'open' },
        { label: '已完结', value: 'resolved' }
      ]
    };
  },
  onShow() {
    this.user = getStoredUser();
    this.ensureAdmin();
  },
  methods: {
    async ensureAdmin() {
      if (!isLoggedIn()) {
        this.authorized = false;
        uni.navigateTo({
          url: '/pages/login/login?redirect=%2Fpages%2Fadmin%2Fitems'
        });
        return;
      }

      try {
        const res = await request({
          url: '/auth/me'
        });
        const user = res.data || null;
        if (user) {
          user.id = userIdOf(user);
          this.user = user;
          saveSession(getToken(), user);
        }
        this.authorized = user && user.role === 'admin';
        if (this.authorized) {
          this.loadItems();
        }
      } catch (error) {
        this.authorized = false;
        toastError(error, '权限校验失败');
      }
    },
    setFilter(key, value) {
      if (this.filters[key] === value) return;
      this.filters[key] = value;
      this.loadItems();
    },
    async loadItems() {
      if (this.authorized === false) {
        return;
      }

      this.loading = true;
      try {
        const data = {};
        if (this.filters.type) data.type = this.filters.type;
        if (this.filters.status) data.status = this.filters.status;

        const res = await request({
          url: '/admin/items',
          data
        });
        this.items = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        const statusCode = Number(error.statusCode || 0);
        if (statusCode === 401 || statusCode === 403) {
          this.authorized = false;
        }
        toastError(error, '列表加载失败');
      } finally {
        this.loading = false;
      }
    },
    async updateStatus(item, status) {
      try {
        const res = await request({
          url: `/admin/items/${item._id}/status`,
          method: 'PUT',
          data: {
            status
          }
        });
        Object.assign(item, res.data || { status });
      } catch (error) {
        toastError(error, '状态更新失败');
      }
    },
    async deleteItem(item) {
      const ok = await confirmAction('删除信息', '管理员删除后不可恢复，确认继续？');
      if (!ok) return;

      try {
        await request({
          url: `/admin/items/${item._id}`,
          method: 'DELETE'
        });
        this.items = this.items.filter((entry) => entry._id !== item._id);
      } catch (error) {
        toastError(error, '删除失败');
      }
    },
    ownerName(item) {
      if (item.owner && item.owner.username) {
        return item.owner.username;
      }
      return '匿名';
    },
    goDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },
    goHome() {
      uni.switchTab({
        url: '/pages/index/index'
      });
    },
    formatDateTime,
    itemTypeLabel,
    statusLabel
  }
};
</script>

<style>
.admin-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 34rpx;
}

.hero-btn {
  flex: 0 0 auto;
}

.filter-card {
  margin-top: 24rpx;
  padding: 20rpx;
}

.status-segment {
  margin-top: 16rpx;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 24rpx;
}

.admin-item {
  padding: 26rpx;
}

.admin-item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.admin-main {
  flex: 1;
  min-width: 0;
}

.admin-title {
  display: block;
  color: #171d1b;
  font-size: 30rpx;
  font-weight: 760;
  line-height: 1.3;
}

.admin-meta {
  display: block;
  margin-top: 8rpx;
  color: #60706a;
  font-size: 23rpx;
  line-height: 1.45;
}

.admin-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 22rpx;
}

.admin-action {
  flex: 1;
  min-height: 66rpx;
  font-size: 24rpx;
}

.soft-empty {
  margin-top: 24rpx;
  padding: 48rpx 0;
  color: #60706a;
  text-align: center;
}

.empty-action {
  margin-top: 24rpx;
}
</style>
