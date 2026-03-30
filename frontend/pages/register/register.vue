<template>
  <view class="page">
    <view class="header">
      <text class="logo-icon">📝</text>
      <text class="title">创建账号</text>
      <text class="subtitle">{{ registerSubtitle }}</text>
    </view>

    <view class="form-section">
      <view class="section-label">必填信息</view>
      <view class="input-wrapper">
        <input class="input" v-model="form.username" placeholder="用户名" />
      </view>
      <view class="input-wrapper">
        <input class="input" v-model="form.password" placeholder="密码" password />
      </view>

      <view class="section-label">选填信息</view>
      <view class="input-wrapper">
        <input class="input" v-model="form.studentId" placeholder="学号" />
      </view>
      <view class="input-wrapper">
        <input class="input" v-model="form.college" placeholder="学院" />
      </view>
      <view class="input-wrapper">
        <input class="input" v-model="form.phone" placeholder="手机号" />
      </view>
      <view class="input-wrapper">
        <input class="input" v-model="form.wechat" placeholder="微信号" />
      </view>

      <button class="register-btn" :disabled="loading" @click="register">
        <text v-if="!loading">立即注册</text>
        <text v-else>注册中...</text>
      </button>
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
        password: '',
        studentId: '',
        college: '',
        phone: '',
        wechat: ''
      },
      loading: false,
      registerSubtitle: APP_CONFIG.app.registerSubtitle
    }
  },
  methods: {
    async register() {
      if (!this.form.username || !this.form.password) {
        return uni.showToast({ title: '用户名和密码必填', icon: 'none' });
      }
       if (this.loading) return;
       this.loading = true;
      try {
        await request({
          url: '/auth/register',
          method: 'POST',
          data: this.form
        });
        uni.showToast({ title: '注册成功，请登录', icon: 'success' });
        setTimeout(() => {
          uni.navigateBack();
        }, 500);
      } catch (e) {
        // 显示后端返回的具体错误信息
        const errorMsg = e.data?.message || e.message || '注册失败，请稍后重试';
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 2500
        });
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FBFBFA;
  padding: 60rpx 40rpx 80rpx;
}

.header {
  text-align: center;
  margin-bottom: 48rpx;
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

.section-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #37352F;
  margin-bottom: 16rpx;
  margin-top: 32rpx;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.section-label:first-child {
  margin-top: 0;
}

.input-wrapper {
  margin-bottom: 20rpx;
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

.register-btn {
  width: 100%;
  padding: 28rpx;
  background: #2383E2;
  color: #FFFFFF;
  border-radius: 6rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
  border: none;
  margin-top: 32rpx;
  transition: all 0.2s;
}

.register-btn:active {
  background: #1a6ec7;
  transform: translateY(1rpx);
}

.register-btn:disabled {
  background: #9B9A97;
  opacity: 0.6;
}
</style>