<template>
  <view class="page">
    <view class="page-shell">
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
  padding: 68rpx 32rpx 96rpx;
}

.page-shell {
  width: 100%;
  max-width: 720rpx;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 42rpx;
}

.logo-icon {
  width: 132rpx;
  height: 132rpx;
  line-height: 132rpx;
  font-size: 72rpx;
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

.section-label {
  font-size: 23rpx;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 14rpx;
  margin-top: 30rpx;
  letter-spacing: 1rpx;
}

.section-label:first-child {
  margin-top: 0;
}

.input-wrapper {
  margin-bottom: 18rpx;
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

.register-btn {
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
  margin-top: 24rpx;
  line-height: 96rpx;
  box-shadow: 0 16rpx 36rpx rgba(79, 124, 255, 0.2);
}

.register-btn:active {
  transform: translateY(2rpx);
}

.register-btn:disabled {
  background: #cbd5e1;
  opacity: 0.9;
  box-shadow: none;
}

@media screen and (min-width: 768px) {
  .page {
    padding: 48px 24px 64px;
  }

  .page-shell {
    max-width: 440px;
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
  .section-label {
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

  .register-btn {
    min-height: 48px;
    line-height: 48px;
    font-size: 15px;
    border-radius: 14px;
    margin-top: 18px;
  }
}
</style>