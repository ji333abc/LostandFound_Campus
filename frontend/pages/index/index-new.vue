<template>
  <view class="page">
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
        { value: '', label: '全部' },
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
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
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
  background: #FBFBFA;
  padding-bottom: 120rpx;
}

/* 顶部标题区 */
.header {
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
}

.header-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.header-title {
  font-size: 48rpx;
  font-weight: 600;
  color: #37352F;
  margin-bottom: 8rpx;
  letter-spacing: -0.5rpx;
}

.header-subtitle {
  font-size: 28rpx;
  color: #787774;
}

/* 搜索区 */
.search-section {
  padding: 0 40rpx 32rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 8rpx;
  padding: 0 24rpx;
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: #2383E2;
  box-shadow: 0 0 0 6rpx rgba(35, 131, 226, 0.1);
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #37352F;
}

.search-input::placeholder {
  color: #9B9A97;
}

/* 筛选标签 */
.filter-section {
  display: flex;
  gap: 16rpx;
  padding: 0 40rpx 32rpx;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 12rpx 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #787774;
  transition: all 0.2s;
}

.filter-tag.active {
  background: #37352F;
  color: #FFFFFF;
  border-color: #37352F;
}

/* 列表容器 */
.list-container {
  height: calc(100vh - 480rpx);
}

.list {
  padding: 0 40rpx;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #E9E9E7;
  border-top-color: #2383E2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 24rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #9B9A97;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
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

/* 卡片样式 */
.item-card {
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  transition: all 0.2s;
}

.item-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.item-emoji {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.item-title {
  flex: 1;
  font-size: 32rpx;
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

.item-content {
  margin-bottom: 20rpx;
}

.item-desc {
  font-size: 28rpx;
  color: #787774;
  line-height: 1.6;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 24rpx;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 26rpx;
  color: #9B9A97;
}

.item-images {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 6rpx;
  border: 1rpx solid #E9E9E7;
}

.list-footer {
  height: 40rpx;
}
</style>