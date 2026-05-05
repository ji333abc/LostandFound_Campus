<template>
  <view class="tab-shell" :style="{ paddingBottom: safeBottom + 'px' }">
    <view class="tab-bar">
      <view
        v-for="(item, index) in list"
        :key="item.pagePath"
        class="tab-item"
        :class="{ active: selected === index }"
        @tap="switchTab(item.pagePath)"
      >
        <view class="icon-pill">
          <image
            class="tab-icon"
            :src="selected === index ? item.selectedIconPath : item.iconPath"
            mode="aspectFit"
          />
        </view>
        <text class="tab-label">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      selected: 0,
      safeBottom: 0,
      list: [
        {
          pagePath: 'pages/index/index',
          text: '首页',
          iconPath: '/static/index.png',
          selectedIconPath: '/static/index-active.png'
        },
        {
          pagePath: 'pages/publish/publish',
          text: '发布',
          iconPath: '/static/publish.png',
          selectedIconPath: '/static/publish-active.png'
        },
        {
          pagePath: 'pages/my/my',
          text: '我的',
          iconPath: '/static/my.png',
          selectedIconPath: '/static/my-active.png'
        }
      ]
    };
  },
  created() {
    try {
      const info = uni.getSystemInfoSync();
      const insets = info.safeAreaInsets || {};
      this.safeBottom = insets.bottom || 0;
    } catch (error) {
      this.safeBottom = 0;
    }
  },
  methods: {
    setSelected(index) {
      this.selected = index;
    },
    switchTab(path) {
      uni.switchTab({
        url: `/${path}`
      });
    }
  }
};
</script>

<style>
.tab-shell {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  padding: 14rpx 24rpx 18rpx;
  background: rgba(248, 250, 246, 0.92);
  border-top: 1rpx solid rgba(111, 121, 116, 0.16);
}

.tab-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 760rpx;
  height: 116rpx;
  margin: 0 auto;
  padding: 8rpx;
  border-radius: 36rpx;
  background: #edf4ef;
  box-shadow: 0 14rpx 36rpx rgba(20, 48, 42, 0.12);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  color: #60706a;
}

.icon-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 46rpx;
  border-radius: 999rpx;
}

.tab-icon {
  display: block;
  width: 40rpx;
  height: 40rpx;
}

.tab-label {
  margin-top: 7rpx;
  color: inherit;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
}

.tab-item.active {
  color: #006a60;
}

.tab-item.active .icon-pill {
  background: #cce8e1;
}
</style>
