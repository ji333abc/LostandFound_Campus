<template>
  <view class="page">
    <view class="page-shell">
      <view class="header">
        <text class="logo-icon">🔍</text>
        <text class="title">欢迎回来</text>
        <text class="subtitle">{{ loginSubtitle }}</text>
      </view>

    <view class="form-section">
      <view class="input-wrapper">
        <input 
          class="input" 
          v-model="form.username" 
          placeholder="用户名"
        />
      </view>
      <view class="input-wrapper">
        <input 
          class="input" 
          v-model="form.password" 
          placeholder="密码" 
          password
        />
      </view>

      <button class="login-btn" :disabled="loading" @click="login">
        <text v-if="!loading">登录</text>
        <text v-else>登录中...</text>
      </button>
      
        <view class="register-link" @click="goRegister">
          <text>还没有账号？</text>
          <text class="link-text">立即注册</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '@/common/request.js';
import { APP_CONFIG } from '@/common/config.js';

export default {
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      loading: false,
      loginSubtitle: APP_CONFIG.app.loginSubtitle
    }
  },
  methods: {
    async login() {
      if (!this.form.username || !this.form.password) {
        return uni.showToast({ title: '请填写用户名和密码', icon: 'none' });
      }
      if (this.loading) return;
      this.loading = true;
      try {
        const res = await request({
          url: '/auth/login',
          method: 'POST',
          data: this.form
        });
        uni.setStorageSync('token', res.token);
        uni.setStorageSync('user', res.user);
        uni.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' });
        }, 500);
      } catch (e) {
        // 显示后端返回的具体错误信息
        const errorMsg = e.data?.message || e.message || '登录失败，请检查账号密码';
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 2500
        });
      } finally {
        this.loading = false;
      }
    },
    goRegister() {
      uni.navigateTo({ url: '/pages/register/register' });
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 88rpx 32rpx;
}

.page-shell {
  width: 100%;
  max-width: 720rpx;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 44rpx;
}

.logo-icon {
  width: 132rpx;
  height: 132rpx;
  line-height: 132rpx;
  font-size: 74rpx;
  display: block;
  margin: 0 auto 24rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.14) 0%, rgba(124, 58, 237, 0.12) 100%);
}

.title {
  font-size: 52rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
  margin-bottom: 12rpx;
  letter-spacing: -1rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #94a3b8;
  display: block;
}

.form-section {
  max-width: 640rpx;
  margin: 0 auto;
  padding: 36rpx 30rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 32rpx;
  box-shadow: 0 20rpx 54rpx rgba(15, 23, 42, 0.08);
}

.input-wrapper {
  margin-bottom: 22rpx;
}

.input {
  display: block;
  width: 100%;
  min-height: 96rpx;
  padding: 26rpx 24rpx;
  background: rgba(248, 250, 252, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 22rpx;
  font-size: 30rpx;
  line-height: 1.4;
  color: #1f2937;
  transition: all 0.2s;
  position: relative;
  z-index: 2;
}

.input::placeholder {
  color: #94a3b8;
}

.input:focus {
  border-color: rgba(79, 124, 255, 0.42);
  box-shadow: 0 0 0 8rpx rgba(79, 124, 255, 0.08);
}

.login-btn {
  width: 100%;
  min-height: 96rpx;
  padding: 0 28rpx;
  background: linear-gradient(135deg, #4f7cff 0%, #6ea8ff 100%);
  color: #ffffff;
  border-radius: 24rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  margin-top: 8rpx;
  line-height: 96rpx;
  box-shadow: 0 16rpx 36rpx rgba(79, 124, 255, 0.2);
}

.login-btn:active {
  transform: translateY(2rpx);
}

.login-btn:disabled {
  background: #cbd5e1;
  opacity: 0.9;
  box-shadow: none;
}

.register-link {
  text-align: center;
  margin-top: 32rpx;
  font-size: 28rpx;
  color: #64748b;
}

.link-text {
  color: #3d68eb;
  margin-left: 8rpx;
  font-weight: 600;
}

@media screen and (min-width: 768px) {
  .page {
    padding: 48px 24px;
  }

  .page-shell {
    max-width: 420px;
  }

  .header {
    margin-bottom: 28px;
  }

  .logo-icon {
    width: 72px;
    height: 72px;
    line-height: 72px;
    font-size: 38px;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .title {
    font-size: 28px;
  }

  .subtitle,
  .register-link {
    font-size: 14px;
  }

  .form-section {
    max-width: none;
    padding: 24px;
    border-radius: 24px;
  }

  .input {
    min-height: 48px;
    padding: 12px 14px;
    font-size: 15px;
    border-radius: 14px;
  }

  .login-btn {
    min-height: 48px;
    line-height: 48px;
    font-size: 15px;
    border-radius: 14px;
  }
}
</style>