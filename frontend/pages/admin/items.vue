<template>
  <view class="page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="header-icon">⚙️</text>
      <text class="header-title">管理后台</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stat-card">
        <text class="stat-value">{{ list.length }}</text>
        <text class="stat-label">当前显示</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ list.filter(i => i.status === 'open').length }}</text>
        <text class="stat-label">进行中</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ list.filter(i => i.status === 'resolved').length }}</text>
        <text class="stat-label">已解决</text>
      </view>
    </view>

    <!-- 筛选区 -->
    <view class="filter-section">
      <picker :range="statusOptions" :value="statusIndex" @change="onStatusChange">
        <view class="filter-btn">
          <text>{{ statusOptions[statusIndex].label }}</text>
        </view>
      </picker>
      <picker :range="typeOptions" :value="typeIndex" @change="onTypeChange">
        <view class="filter-btn">
          <text>{{ typeOptions[typeIndex].label }}</text>
        </view>
      </picker>
    </view>

    <!-- 列表区 -->
    <scroll-view scroll-y class="list-scroll">
      <view class="list-section">
        <view v-for="item in list" :key="item._id" class="item-card">
          <view class="item-top">
            <text class="item-emoji">{{ item.type === 'lost' ? '🔍' : '🎁' }}</text>
            <text class="item-title">{{ item.title }}</text>
            <view class="status-badge" :class="item.status === 'resolved' ? 'resolved' : 'open'">
              {{ item.status === 'resolved' ? '✓' : '⏳' }}
            </view>
          </view>
          <view class="item-info">
            <text class="info-text">👤 {{ item.owner?.username || '未知' }}</text>
            <text class="info-text">🕐 {{ formatTime(item.createdAt) }}</text>
          </view>
          <view class="item-actions">
            <button class="action-btn toggle-btn" @click="toggleStatus(item)">
              {{ item.status === 'resolved' ? '标记进行中' : '标记已解决' }}
            </button>
            <button class="action-btn delete-btn" @click="removeItem(item)">
              删除
            </button>
          </view>
        </view>

        <view v-if="!list.length" class="empty-state">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无数据</text>
          <text class="empty-hint">调整筛选条件试试</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { request } from '@/common/request.js';

export default {
  data() {
    return {
      list: [],
      statusOptions: [
        { value: '', label: '全部' },
        { value: 'open', label: '进行中' },
        { value: 'resolved', label: '已解决' }
      ],
      statusIndex: 0,
      typeOptions: [
        { value: '', label: '全部' },
        { value: 'lost', label: '寻物启事' },
        { value: 'found', label: '失物招领' }
      ],
      typeIndex: 0,
      loading: false
    };
  },
  onShow() {
    this.fetchItems();
  },
  methods: {
    async fetchItems() {
      this.loading = true;
      try {
        const params = {};
        const status = this.statusOptions[this.statusIndex].value;
        const type = this.typeOptions[this.typeIndex].value;
        if (status) params.status = status;
        if (type) params.type = type;
        const res = await request({
          url: '/admin/items',
          data: params
        });
        this.list = res.data || [];
      } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    onStatusChange(e) {
      this.statusIndex = Number(e.detail.value);
      this.fetchItems();
    },
    onTypeChange(e) {
      this.typeIndex = Number(e.detail.value);
      this.fetchItems();
    },
    formatTime(t) {
      if (!t) return '';
      return t.slice(0, 10);
    },
    async toggleStatus(item) {
      const target = item.status === 'resolved' ? 'open' : 'resolved';
      try {
        await request({
          url: `/admin/items/${item._id}/status`,
          method: 'PUT',
          data: { status: target }
        });
        item.status = target;
        uni.showToast({ title: '状态已更新', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: '更新失败', icon: 'none' });
      }
    },
    async removeItem(item) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除该条信息吗？此操作不可恢复。',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await request({
              url: `/admin/items/${item._id}`,
              method: 'DELETE'
            });
            this.list = this.list.filter((i) => i._id !== item._id);
            uni.showToast({ title: '删除成功', icon: 'success' });
          } catch (e) {}
        }
      });
    }
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 48rpx;
}

.header {
  margin: 28rpx 28rpx 24rpx;
  padding: 52rpx 40rpx;
  text-align: center;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(255, 255, 255, 0.96) 60%, rgba(79, 124, 255, 0.08) 100%);
  border-radius: 32rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18rpx 54rpx rgba(15, 23, 42, 0.08);
}

.header-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.header-title {
  font-size: 50rpx;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -1rpx;
}

.stats-section {
  display: flex;
  gap: 14rpx;
  padding: 0 28rpx 24rpx;
}

.stat-card {
  flex: 1;
  padding: 26rpx 16rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 24rpx;
  text-align: center;
  box-shadow: 0 12rpx 34rpx rgba(15, 23, 42, 0.05);
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #94a3b8;
  display: block;
}

.filter-section {
  display: flex;
  gap: 14rpx;
  padding: 0 28rpx 24rpx;
}

.filter-btn {
  flex: 1;
  padding: 22rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 22rpx;
  text-align: center;
  font-size: 28rpx;
  color: #1f2937;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.04);
}

.list-scroll {
  height: calc(100vh - 500rpx);
}

.list-section {
  padding: 0 28rpx;
}

.item-card {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 26rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.05);
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
  margin-right: 12rpx;
}

.status-badge {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.status-badge.open {
  background: rgba(79, 124, 255, 0.1);
  color: #3d68eb;
}

.status-badge.resolved {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.item-info {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.info-text {
  font-size: 24rpx;
  color: #94a3b8;
}

.item-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  flex: 1;
  padding: 18rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: 600;
  border: none;
}

.toggle-btn {
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
  border: 1rpx solid rgba(245, 158, 11, 0.16);
}

.toggle-btn:active {
  background: rgba(245, 158, 11, 0.16);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1rpx solid rgba(239, 68, 68, 0.16);
}

.delete-btn:active {
  background: rgba(239, 68, 68, 0.16);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(148, 163, 184, 0.14);
  border-radius: 28rpx;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.04);
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
</style>

