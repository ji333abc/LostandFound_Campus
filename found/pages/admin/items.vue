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
  background: #FBFBFA;
  padding-bottom: 40rpx;
}

/* 顶部标题 */
.header {
  padding: 60rpx 40rpx 32rpx;
  text-align: center;
}

.header-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.header-title {
  font-size: 48rpx;
  font-weight: 600;
  color: #37352F;
  letter-spacing: -0.5rpx;
}
/* 统计卡片 */
.stats-section {
  display: flex;
  gap: 16rpx;
  padding: 0 40rpx 32rpx;
}

.stat-card {
  flex: 1;
  padding: 24rpx 16rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 600;
  color: #37352F;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #9B9A97;
  display: block;
}
/* 筛选区 */
.filter-section {
  display: flex;
  gap: 16rpx;
  padding: 0 40rpx 32rpx;
}

.filter-btn {
  flex: 1;
  padding: 20rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  text-align: center;
  font-size: 28rpx;
  color: #37352F;
}

/* 列表滚动区 */
.list-scroll {
  height: calc(100vh - 480rpx);
}

.list-section {
  padding: 0 40rpx;
}
/* 列表卡片 */
.item-card {
  padding: 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  margin-bottom: 16rpx;
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
  margin-right: 12rpx;
}

.status-badge {
  padding: 6rpx 16rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.status-badge.open {
  background: #E3F2FD;
  color: #2383E2;
}

.status-badge.resolved {
  background: #E8F5E9;
  color: #0F7B6C;
}

.item-info {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.info-text {
  font-size: 24rpx;
  color: #9B9A97;
}

.item-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  flex: 1;
  padding: 16rpx;
  border-radius: 6rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s;
}

.toggle-btn {
  background: #FFF9E6;
  color: #D97706;
  border: 1rpx solid #FFE8A3;
}

.toggle-btn:active {
  background: #FFF4CC;
}

.delete-btn {
  background: #FEF2F2;
  color: #DC2626;
  border: 1rpx solid #FECACA;
}

.delete-btn:active {
  background: #FEE2E2;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
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
</style>

