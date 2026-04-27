<template>
  <view class="page">
    <view class="page-shell">
      <!-- 顶部标题区 -->
      <view class="header">
        <view class="header-icon">🔍</view>
        <view class="header-title">{{ appName }}</view>
        <view class="header-subtitle">{{ homeSubtitle }}</view>
      </view>

      <!-- 搜索栏 -->
      <view class="search-section">
      <view class="search-box">
        <text class="search-icon">🔎</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索物品名称或描述..."
          confirm-type="search"
          @confirm="fetchList"
        />
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-section">
      <view 
        :class="['filter-tag', type === 'lost' ? 'active' : '']" 
        @click="changeType('lost')"
      >
        寻物启事
      </view>
      <view 
        :class="['filter-tag', type === 'found' ? 'active' : '']" 
        @click="changeType('found')"
      >
        失物招领
      </view>
      <view 
        :class="['filter-tag', statusIndex === 0 ? 'active' : '']" 
        @click="changeStatus(0)"
      >
        全部
      </view>
      <view 
        :class="['filter-tag', statusIndex === 1 ? 'active' : '']" 
        @click="changeStatus(1)"
      >
        进行中
      </view>
      <view 
        :class="['filter-tag', statusIndex === 2 ? 'active' : '']" 
        @click="changeStatus(2)"
      >
        已解决
      </view>
    </view>

      <!-- 列表区 -->
      <scroll-view scroll-y class="list-container">
      <view v-if="loading" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="!list.length" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无相关信息</text>
        <text class="empty-hint">试试切换筛选条件</text>
      </view>

      <view v-else class="list">
        <view 
          v-for="item in list" 
          :key="item._id" 
          class="item-card"
          @click="goDetail(item._id)"
        >
          <!-- 卡片头部 -->
          <view class="item-header">
            <text class="item-emoji">{{ type === 'lost' ? '🔍' : '🎁' }}</text>
            <text class="item-title">{{ item.title }}</text>
            <view 
              :class="['item-status', item.status === 'resolved' ? 'resolved' : 'open']"
            >
              {{ item.status === 'resolved' ? '已解决' : '进行中' }}
            </view>
          </view>

          <!-- 卡片内容 -->
          <view class="item-content">
            <view class="item-desc" v-if="item.description">
              {{ item.description }}
            </view>
            <view class="item-meta">
              <text class="meta-item" v-if="item.location">
                📍 {{ item.location }}
              </text>
              <text class="meta-item" v-if="item.time">
                🕐 {{ formatTime(item.time) }}
              </text>
            </view>
          </view>

          <!-- 卡片图片 -->
          <view class="item-images" v-if="item.images && item.images.length">
            <image 
              v-for="(img, idx) in item.images.slice(0, 3)" 
              :key="idx"
              :src="img" 
              class="item-image" 
              mode="aspectFill"
            />
          </view>
        </view>
      </view>

        <view class="list-footer"></view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { request } from '@/common/request.js';
import { APP_CONFIG } from '@/common/config.js';

export default {
  data() {
    return {
      type: 'lost',
      list: [],
      keyword: '',
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'open', label: '进行中' },
        { value: 'resolved', label: '已解决' }
      ],
      statusIndex: 0,
      loading: false,
      appName: APP_CONFIG.app.name,
      homeSubtitle: APP_CONFIG.app.homeSubtitle
    }
  },
  onShow() {
    this.fetchList();
    this.getTabBar && this.getTabBar().setSelected(0);
  },
  methods: {
    changeType(t) {
      this.type = t;
      this.fetchList();
    },
    changeStatus(index) {
      this.statusIndex = index;
      this.fetchList();
    },
    async fetchList() {
      this.loading = true;
      try {
        const params = { type: this.type };
        const status = this.statusOptions[this.statusIndex].value;
        if (this.keyword.trim()) params.keyword = this.keyword.trim();
        if (status) params.status = status;
        const res = await request({
          url: '/items',
          data: params
        });
        this.list = res.data || [];
      } catch (e) {
        uni.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    onStatusChange(e) {
      this.statusIndex = Number(e.detail.value);
      this.fetchList();
    },
    goDetail(id) {
      uni.navigateTo({
        url: '/pages/detail/detail?id=' + id
      });
    },
    formatTime(t) {
      if (!t) return '';
      return t.slice(0, 10);
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 20rpx 160rpx;
  display: flex;
  flex-direction: column;
}

.page-shell {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.header {
  margin: 28rpx 0 24rpx;
  padding: 56rpx 40rpx;
  text-align: center;
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.14) 0%, rgba(110, 168, 255, 0.24) 52%, rgba(255, 255, 255, 0.95) 100%);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  border-radius: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(79, 124, 255, 0.12);
}

.header-icon {
  font-size: 88rpx;
  margin-bottom: 18rpx;
}

.header-title {
  font-size: 50rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10rpx;
  letter-spacing: -1rpx;
}

.header-subtitle {
  font-size: 28rpx;
  color: #64748b;
}

.search-section {
  padding: 0 0 24rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  border-radius: 24rpx;
  padding: 0 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.05);
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: rgba(79, 124, 255, 0.45);
  box-shadow: 0 0 0 8rpx rgba(79, 124, 255, 0.08);
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.search-input {
  display: block;
  flex: 1;
  min-height: 88rpx;
  padding: 26rpx 0;
  font-size: 28rpx;
  line-height: 1.4;
  color: #1f2937;
  position: relative;
  z-index: 2;
}

.search-input::placeholder {
  color: #94a3b8;
}

.filter-section {
  display: flex;
  gap: 16rpx;
  padding: 0 0 28rpx;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 14rpx 26rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #64748b;
  transition: all 0.22s;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.filter-tag.active {
  background: linear-gradient(135deg, #4f7cff 0%, #6ea8ff 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 14rpx 34rpx rgba(79, 124, 255, 0.22);
}

.list-container {
  flex: 1;
  min-height: 0;
}

.list {
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 140rpx 0;
}

.loading-spinner {
  width: 64rpx;
  height: 64rpx;
  border: 6rpx solid rgba(148, 163, 184, 0.18);
  border-top-color: #4f7cff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 24rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #94a3b8;
}

.empty-state {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
  background: rgba(255, 255, 255, 0.88);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 32rpx;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.05);
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.35;
}

.empty-text {
  font-size: 34rpx;
  color: #1f2937;
  margin-bottom: 12rpx;
  font-weight: 600;
}

.empty-hint {
  font-size: 26rpx;
  color: #94a3b8;
}

.item-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 28rpx;
  padding: 30rpx;
  margin-bottom: 22rpx;
  transition: all 0.22s;
  box-shadow: 0 14rpx 40rpx rgba(15, 23, 42, 0.06);
}

.item-card:active {
  transform: translateY(-2rpx) scale(0.995);
  box-shadow: 0 22rpx 48rpx rgba(15, 23, 42, 0.1);
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 18rpx;
}

.item-emoji {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.item-title {
  flex: 1;
  font-size: 32rpx;
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

.item-content {
  margin-bottom: 18rpx;
}

.item-desc {
  font-size: 28rpx;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 22rpx;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 24rpx;
  color: #94a3b8;
}

.item-images {
  display: flex;
  gap: 12rpx;
  margin-top: 18rpx;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 22rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.list-footer {
  height: 40rpx;
}

@media screen and (min-width: 768px) {
  .page {
    padding: 24px 24px 180px;
  }

  .header {
    padding: 36px 32px;
  }

  .header-icon {
    font-size: 56px;
  }

  .header-title {
    font-size: 34px;
  }

  .header-subtitle,
  .search-input,
  .item-desc {
    font-size: 16px;
  }

  .filter-tag,
  .item-status,
  .meta-item,
  .loading-text,
  .empty-hint {
    font-size: 13px;
  }

  .search-box {
    border-radius: 18px;
    padding: 0 18px;
  }

  .search-input {
    min-height: 44px;
    padding: 12px 0;
  }

  .item-card {
    padding: 24px;
    border-radius: 24px;
  }

  .item-header {
    align-items: flex-start;
    gap: 12px;
  }

  .item-title,
  .empty-text {
    font-size: 22px;
  }

  .item-images {
    flex-wrap: wrap;
  }

  .item-image {
    width: 128px;
    height: 128px;
    border-radius: 16px;
  }
}

@media screen and (min-width: 1024px) {
  .list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .item-card {
    margin-bottom: 0;
    height: 100%;
  }

  .empty-state,
  .loading-state {
    grid-column: 1 / -1;
  }
}
</style>