<template>
  <view class="tabbar">
    <view
      v-for="(item, index) in list"
      :key="index"
      class="tab-item"
      :class="{ active: selected === index }"
      @click="switchTab(index)"
    >
      <text class="tab-icon">{{ item.icon }}</text>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      selected: 0,
      list: [
        { pagePath: '/pages/index/index', text: '首页', icon: '🏠' },
        { pagePath: '/pages/publish/publish', text: '发布', icon: '✏️' },
        { pagePath: '/pages/my/my', text: '我的', icon: '👤' }
      ]
    };
  },
  methods: {
    switchTab(index) {
      if (index === this.selected) return;
      const url = this.list[index].pagePath;
      this.selected = index;
      uni.switchTab({ url });
    },
    setSelected(index) {
      this.selected = index;
    }
  }
};
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48rpx);
  max-width: 760px;
  bottom: 24rpx;
  height: 112rpx;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  border-radius: 32rpx;
  box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.12);
  z-index: 999;
  padding: 10rpx;
  padding-bottom: calc(10rpx + env(safe-area-inset-bottom));
  backdrop-filter: blur(18rpx);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  border-radius: 24rpx;
  transition: all 0.22s;
}

.tab-icon {
  font-size: 38rpx;
  opacity: 0.62;
  transition: all 0.22s;
}

.tab-text {
  font-size: 22rpx;
  color: #94a3b8;
  transition: all 0.22s;
}

.tab-item.active {
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.12) 0%, rgba(110, 168, 255, 0.18) 100%);
}

.tab-item.active .tab-icon {
  opacity: 1;
  transform: scale(1.08);
}

.tab-item.active .tab-text {
  color: #335fe3;
  font-weight: 600;
}

@media screen and (min-width: 768px) {
  .tabbar {
    max-width: 760px;
    height: 78px;
    padding: 8px;
    border-radius: 26px;
  }

  .tab-item {
    gap: 4px;
    border-radius: 18px;
  }

  .tab-icon {
    font-size: 24px;
  }

  .tab-text {
    font-size: 12px;
  }
}
</style>

