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
  :root,
  page {
    --bg-color: #f6f8fc;
    --bg-accent: #eef4ff;
    --surface-color: rgba(255, 255, 255, 0.92);
    --surface-strong: #ffffff;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;
    --border-color: rgba(148, 163, 184, 0.18);
    --primary-color: #4f7cff;
    --primary-color-dark: #3d68eb;
    --primary-soft: rgba(79, 124, 255, 0.1);
    --success-color: #16a34a;
    --success-soft: rgba(34, 197, 94, 0.12);
    --warning-color: #d97706;
    --warning-soft: rgba(245, 158, 11, 0.12);
    --danger-color: #dc2626;
    --danger-soft: rgba(239, 68, 68, 0.12);
    --purple-color: #7c3aed;
    --purple-soft: rgba(124, 58, 237, 0.1);
    --radius-sm: 12rpx;
    --radius-md: 20rpx;
    --radius-lg: 28rpx;
    --shadow-sm: 0 10rpx 30rpx rgba(15, 23, 42, 0.04);
    --shadow-md: 0 18rpx 50rpx rgba(15, 23, 42, 0.08);
    --shadow-lg: 0 24rpx 70rpx rgba(79, 124, 255, 0.12);
    background-color: var(--bg-color);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    font-size: 28rpx;
    line-height: 1.6;
  }

  page {
    background-image: linear-gradient(180deg, #f5f8ff 0%, #f6f8fc 260rpx, #f8fafc 100%);
  }

  view,
  text,
  button,
  input,
  textarea,
  scroll-view,
  image {
    box-sizing: border-box;
  }

  .card {
    background: var(--surface-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1rpx solid var(--border-color);
    backdrop-filter: blur(12rpx);
    transition: all 0.22s ease;
  }

  .card:hover,
  .card:active {
    box-shadow: var(--shadow-md);
    transform: translateY(-2rpx);
  }

  .primary-btn {
    background: linear-gradient(135deg, var(--primary-color) 0%, #6ea8ff 100%);
    color: #fff;
    border-radius: var(--radius-md);
    padding: 22rpx 32rpx;
    text-align: center;
    border: none;
    font-size: 28rpx;
    font-weight: 600;
    letter-spacing: 0.4rpx;
    box-shadow: var(--shadow-lg);
    transition: all 0.2s ease;
  }

  .primary-btn:active {
    background: linear-gradient(135deg, var(--primary-color-dark) 0%, #5f96fa 100%);
    transform: translateY(2rpx) scale(0.995);
  }

  @media screen and (min-width: 768px) {
    .page,
    .container {
      width: 100%;
      max-width: 1024px;
      margin: 0 auto;
    }
  }

  @media screen and (min-width: 1280px) {
    .page,
    .container {
      max-width: 1120px;
    }
  }
</style>
