<template>
  <view class="m3-page">
    <view class="auth-shell">
      <view class="auth-card m3-card">
        <text class="m3-title">登录</text>
        <text class="m3-subtitle">进入校园失物招领，管理发布和通知。</text>

        <view class="m3-field">
          <text class="m3-label">用户名</text>
          <input
            class="m3-input"
            v-model="form.username"
            placeholder="请输入用户名"
            maxlength="20"
          />
        </view>

        <view class="m3-field">
          <text class="m3-label">密码</text>
          <input
            class="m3-input"
            v-model="form.password"
            password
            placeholder="请输入密码"
            maxlength="64"
            @confirm="submit"
          />
        </view>

        <button
          class="m3-btn auth-submit"
          :class="{ disabled: submitting }"
          :disabled="submitting"
          @tap="submit"
        >
          {{ submitting ? '登录中' : '登录' }}
        </button>

        <view class="auth-switch">
          <text>还没有账号？</text>
          <button class="m3-btn text" @tap="goRegister">注册</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { request, saveSession } from '../../common/request.js';
import { toastError } from '../../common/utils.js';

export default {
  data() {
    return {
      redirect: '',
      submitting: false,
      form: {
        username: '',
        password: ''
      }
    };
  },
  onLoad(options) {
    this.redirect = options && options.redirect ? decodeURIComponent(options.redirect) : '';
  },
  methods: {
    validate() {
      if (!this.form.username.trim()) {
        uni.showToast({ title: '请输入用户名', icon: 'none' });
        return false;
      }
      if (!this.form.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate() || this.submitting) {
        return;
      }

      this.submitting = true;
      try {
        const res = await request({
          url: '/auth/login',
          method: 'POST',
          data: {
            username: this.form.username.trim(),
            password: this.form.password
          }
        });

        saveSession(res.token, res.user);
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        });

        setTimeout(() => {
          this.goAfterLogin();
        }, 300);
      } catch (error) {
        toastError(error, '登录失败');
      } finally {
        this.submitting = false;
      }
    },
    goAfterLogin() {
      const target = this.redirect || '/pages/my/my';
      const cleanTarget = target.split('?')[0];
      const tabPages = ['/pages/index/index', '/pages/publish/publish', '/pages/my/my'];

      if (tabPages.indexOf(cleanTarget) >= 0) {
        uni.switchTab({
          url: cleanTarget
        });
        return;
      }

      uni.redirectTo({
        url: target
      });
    },
    goRegister() {
      const redirect = this.redirect ? `?redirect=${encodeURIComponent(this.redirect)}` : '';
      uni.navigateTo({
        url: `/pages/register/register${redirect}`
      });
    }
  }
};
</script>

<style>
.auth-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56rpx);
}

.auth-card {
  width: 100%;
  max-width: 680rpx;
  position: relative;
  padding: 42rpx 34rpx 110rpx;
}

.auth-submit {
  width: 100%;
  margin-top: 34rpx;
}

.auth-switch {
  position: absolute;
  right: 28rpx;
  bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4rpx;
  max-width: calc(100% - 56rpx);
  color: #60706a;
  font-size: 25rpx;
}
</style>
