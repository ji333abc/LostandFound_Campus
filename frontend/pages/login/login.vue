<template>
  <view class="page">
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
  background: #FBFBFA;
  padding: 80rpx 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 24rpx;
}

.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #37352F;
  display: block;
  margin-bottom: 12rpx;
  letter-spacing: -0.5rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #9B9A97;
  display: block;
}

.form-section {
  max-width: 600rpx;
  margin: 0 auto;
}

.input-wrapper {
  margin-bottom: 24rpx;
}

.input {
  width: 100%;
  padding: 28rpx 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  font-size: 30rpx;
  color: #37352F;
  transition: all 0.2s;
}

.input::placeholder {
  color: #9B9A97;
}

.input:focus {
  border-color: #2383E2;
  box-shadow: 0 0 0 6rpx rgba(35, 131, 226, 0.1);
}

.login-btn {
  width: 100%;
  padding: 28rpx;
  background: #2383E2;
  color: #FFFFFF;
  border-radius: 6rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
  margin-top: 12rpx;
  transition: all 0.2s;
}

.login-btn:active {
  background: #1a6ec7;
  transform: translateY(1rpx);
}

.login-btn:disabled {
  background: #9B9A97;
  opacity: 0.6;
}

.register-link {
  text-align: center;
  margin-top: 32rpx;
  font-size: 28rpx;
  color: #787774;
}

.link-text {
  color: #2383E2;
  margin-left: 8rpx;
}
</style>