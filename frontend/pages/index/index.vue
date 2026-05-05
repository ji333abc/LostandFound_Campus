<template>
  <view class="m3-page tab-page">
    <view class="m3-shell">
      <view class="home-hero m3-card">
        <view class="hero-main">
          <view>
            <text class="eyebrow">Campus Lost & Found</text>
            <text class="m3-title">校园失物招领</text>
            <text class="m3-subtitle">{{ subtitle }}</text>
          </view>
        </view>

        <view class="hero-stats">
          <view class="stat-item">
            <text class="stat-number">{{ total }}</text>
            <text class="stat-label">当前结果</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ typeSummary }}</text>
            <text class="stat-label">信息类型</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ categorySummary }}</text>
            <text class="stat-label">分类范围</text>
          </view>
        </view>
      </view>

      <view class="filter-panel m3-surface">
        <view class="search-row">
          <text class="search-symbol">⌕</text>
          <input
            class="search-input"
            v-model="keywordInput"
            confirm-type="search"
            placeholder="搜索物品、描述"
            @confirm="applySearch"
          />
          <button class="search-btn" @tap="applySearch">搜索</button>
        </view>

        <view class="m3-segment type-segment">
          <view
            v-for="option in typeOptions"
            :key="option.value"
            class="m3-segment-item"
            :class="{ active: query.type === option.value }"
            @tap="selectType(option.value)"
          >
            <text>{{ option.label }}</text>
          </view>
        </view>

        <scroll-view class="chip-scroll" scroll-x :show-scrollbar="false">
          <view class="chip-track">
            <view
              v-for="option in categoryOptions"
              :key="option.value"
              class="category-chip"
              :class="{ active: query.category === option.value }"
              @tap="selectCategory(option.value)"
            >
              <text>{{ option.label }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="m3-section-title">
        <text>最新信息</text>
        <text>{{ listSummary }}</text>
      </view>

      <view v-if="loading && items.length === 0" class="m3-card loading-card">
        <view class="skeleton title"></view>
        <view class="skeleton line"></view>
        <view class="skeleton line short"></view>
      </view>

      <view v-else-if="items.length === 0" class="m3-card m3-empty">
        <text class="m3-empty-title">暂无相关信息</text>
        <text class="m3-empty-desc">可以调整筛选条件，或发布一条新的失物/招领。</text>
        <button class="m3-btn secondary empty-action" @tap="goPublish">发布信息</button>
      </view>

      <view v-else class="m3-grid item-grid">
        <view
          v-for="item in items"
          :key="item._id"
          class="m3-card m3-grid-item item-card"
          @tap="goDetail(item._id)"
        >
          <view class="thumb-wrap">
            <image
              v-if="firstImageOf(item)"
              class="thumb"
              :src="firstImageOf(item)"
              mode="aspectFill"
            />
            <view v-else class="thumb-fallback">
              <text>{{ shortCategory(item) }}</text>
            </view>
            <view class="thumb-badges">
              <text class="m3-chip" :class="itemTypeTone(item.type)">
                {{ itemTypeLabel(item.type) }}
              </text>
              <text class="m3-chip" :class="{ warn: item.status === 'resolved' }">
                {{ statusLabel(item.status) }}
              </text>
            </view>
          </view>

          <view class="card-body">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-desc">{{ item.description || '暂无描述' }}</text>

            <view class="meta-row">
              <text>{{ item.category || '未分类' }}</text>
              <text>{{ formatDate(item.createdAt) }}</text>
            </view>
            <view class="meta-row">
              <text>{{ item.location || '地点待补充' }}</text>
              <text>{{ ownerName(item) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="items.length > 0" class="load-state">
        <text>{{ loadStateText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { APP_CONFIG } from '../../common/config.js';
import { request } from '../../common/request.js';
import {
  categories,
  firstImage,
  formatDate,
  itemTypeLabel,
  itemTypeTone,
  statusLabel,
  toastError
} from '../../common/utils.js';

export default {
  data() {
    return {
      subtitle: APP_CONFIG.app.homeSubtitle,
      typeOptions: [
        { label: '全部', value: '' },
        { label: '寻物', value: 'lost' },
        { label: '招领', value: 'found' }
      ],
      categoryOptions: [{ label: '全部', value: '' }].concat(
        categories.map((name) => ({ label: name, value: name }))
      ),
      keywordInput: '',
      query: {
        keyword: '',
        type: '',
        category: '',
        status: 'open'
      },
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      loading: false,
      loadingMore: false,
      noMore: false,
      loaded: false
    };
  },
  computed: {
    typeSummary() {
      const hit = this.typeOptions.find((item) => item.value === this.query.type);
      return hit ? hit.label : '全部';
    },
    categorySummary() {
      return this.query.category || '全部';
    },
    listSummary() {
      if (this.loading && this.items.length === 0) {
        return '加载中';
      }
      return `${this.total} 条`;
    },
    loadStateText() {
      if (this.loadingMore) {
        return '正在加载';
      }
      if (this.noMore) {
        return '已显示全部';
      }
      return '继续上滑查看更多';
    }
  },
  onLoad() {
    this.reload();
  },
  onShow() {
    this.setTabBarIndex();
    if (this.loaded) {
      this.reload();
    }
  },
  onPullDownRefresh() {
    this.reload().finally(() => {
      uni.stopPullDownRefresh();
    });
  },
  onReachBottom() {
    this.loadMore();
  },
  methods: {
    setTabBarIndex() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setSelected(0);
      }
    },
    async reload() {
      this.page = 1;
      this.noMore = false;
      await this.fetchItems(true);
    },
    async loadMore() {
      if (this.loading || this.loadingMore || this.noMore) {
        return;
      }
      this.page += 1;
      await this.fetchItems(false);
    },
    async fetchItems(reset) {
      if (reset) {
        this.loading = true;
      } else {
        this.loadingMore = true;
      }

      try {
        const params = {
          page: this.page,
          pageSize: this.pageSize,
          status: this.query.status
        };

        if (this.query.keyword) params.keyword = this.query.keyword;
        if (this.query.type) params.type = this.query.type;
        if (this.query.category) params.category = this.query.category;

        const res = await request({
          url: '/items',
          data: params
        });

        const list = Array.isArray(res.data) ? res.data : [];
        this.items = reset ? list : this.items.concat(list);
        this.total = Number(res.total || 0);
        this.noMore = this.items.length >= this.total || list.length < this.pageSize;
        this.loaded = true;
      } catch (error) {
        if (!reset && this.page > 1) {
          this.page -= 1;
        }
        toastError(error, '列表加载失败');
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },
    applySearch() {
      this.query.keyword = this.keywordInput.trim();
      this.reload();
    },
    selectType(value) {
      if (this.query.type === value) return;
      this.query.type = value;
      this.reload();
    },
    selectCategory(value) {
      if (this.query.category === value) return;
      this.query.category = value;
      this.reload();
    },
    goPublish() {
      uni.switchTab({
        url: '/pages/publish/publish'
      });
    },
    goDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },
    firstImageOf(item) {
      return firstImage(item);
    },
    shortCategory(item) {
      return String(item.category || '物品').slice(0, 2);
    },
    ownerName(item) {
      if (item.owner && item.owner.username) {
        return item.owner.username;
      }
      return '匿名';
    },
    formatDate,
    itemTypeLabel,
    itemTypeTone,
    statusLabel
  }
};
</script>

<style>
.home-hero {
  padding: 34rpx;
  overflow: hidden;
}

.hero-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.eyebrow {
  display: block;
  margin-bottom: 10rpx;
  color: #006a60;
  font-size: 22rpx;
  font-weight: 800;
  letter-spacing: 0;
}

.hero-stats {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.stat-item {
  flex: 1;
  min-width: 0;
  padding: 20rpx 18rpx;
  border-radius: 24rpx;
  background: #edf6f1;
}

.stat-number {
  display: block;
  color: #143832;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.1;
}

.stat-label {
  display: block;
  margin-top: 8rpx;
  color: #66766f;
  font-size: 22rpx;
}

.filter-panel {
  margin-top: 24rpx;
  padding: 20rpx;
}

.search-row {
  display: flex;
  align-items: center;
  min-height: 88rpx;
  padding: 0 14rpx 0 24rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid rgba(111, 121, 116, 0.18);
}

.search-symbol {
  width: 44rpx;
  color: #60706a;
  font-size: 34rpx;
  font-weight: 800;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 80rpx;
  color: #171d1b;
  font-size: 28rpx;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 108rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background: #006a60;
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 700;
}

.type-segment {
  margin-top: 18rpx;
}

.chip-scroll {
  width: 100%;
  margin-top: 18rpx;
  white-space: nowrap;
}

.chip-track {
  display: inline-flex;
  gap: 12rpx;
  padding-right: 8rpx;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 58rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #4d5c57;
  border: 1rpx solid #c8d2cc;
  font-size: 24rpx;
  font-weight: 650;
}

.category-chip.active {
  color: #00201c;
  background: #cce8e1;
  border-color: #cce8e1;
}

.item-grid {
  align-items: stretch;
}

.item-card {
  overflow: hidden;
}

.thumb-wrap {
  position: relative;
  width: 100%;
  height: 320rpx;
  background: #e6efea;
}

.thumb,
.thumb-fallback {
  width: 100%;
  height: 100%;
}

.thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #006a60;
  background: linear-gradient(135deg, #d7efe7 0%, #f1f6e9 100%);
  font-size: 42rpx;
  font-weight: 800;
}

.thumb-badges {
  position: absolute;
  left: 18rpx;
  right: 18rpx;
  bottom: 16rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.card-body {
  padding: 24rpx;
}

.item-title {
  display: block;
  color: #171d1b;
  font-size: 31rpx;
  font-weight: 760;
  line-height: 1.28;
}

.item-desc {
  display: -webkit-box;
  min-height: 76rpx;
  margin-top: 12rpx;
  overflow: hidden;
  color: #586760;
  font-size: 25rpx;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 16rpx;
}

.meta-row text {
  min-width: 0;
  color: #6a7972;
  font-size: 23rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-card {
  padding: 32rpx;
}

.skeleton {
  border-radius: 999rpx;
  background: linear-gradient(90deg, #e2e9e4 0%, #f5faf5 50%, #e2e9e4 100%);
}

.skeleton.title {
  width: 52%;
  height: 38rpx;
}

.skeleton.line {
  width: 100%;
  height: 24rpx;
  margin-top: 26rpx;
}

.skeleton.short {
  width: 68%;
}

.empty-action {
  margin-top: 28rpx;
}

.load-state {
  padding: 26rpx 0 8rpx;
  color: #60706a;
  font-size: 24rpx;
  text-align: center;
}
</style>
