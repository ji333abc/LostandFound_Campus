<script>
  export default {
    onLaunch() {
      console.log('App Launch');
    },
    onShow() {
      console.log('App Show');
    },
    onHide() {
      console.log('App Hide');
    }
  }
</script>

<style>
  /* Notion 风格全局样式 */
  page {
    background-color: #FBFBFA;
    color: #37352F;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    font-size: 28rpx;
    line-height: 1.6;
  }

  .card {
    background: #FFFFFF;
    border-radius: 6rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    border: 1rpx solid #E9E9E7;
    transition: all 0.2s ease;
  }

  .card:hover {
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  }

  .primary-btn {
    background: #2383E2;
    color: #fff;
    border-radius: 6rpx;
    padding: 20rpx 32rpx;
    text-align: center;
    border: none;
    font-size: 28rpx;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .primary-btn:active {
    background: #1a6ec7;
    transform: translateY(1rpx);
  }

  /* H5 端宽屏适配：内容居中，限制最大宽度 */
  @media screen and (min-width: 768px) {
    .page,
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
  }
</style>
