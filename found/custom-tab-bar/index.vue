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
  left: 0;
  right: 0;
  bottom: 0;
  height: 120rpx;
  background-color: #FFFFFF;
  display: flex;
  border-top: 1rpx solid #E9E9E7;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
  z-index: 999;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  transition: all 0.2s;
}

.tab-icon {
  font-size: 40rpx;
  opacity: 0.5;
  transition: all 0.2s;
}

.tab-text {
  font-size: 24rpx;
  color: #9B9A97;
  transition: all 0.2s;
}

.tab-item.active .tab-icon {
  opacity: 1;
  transform: scale(1.1);
}

.tab-item.active .tab-text {
  color: #37352F;
  font-weight: 500;
}
</style>

