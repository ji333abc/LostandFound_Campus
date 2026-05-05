<template>
  <view class="m3-page">
    <view class="auth-shell">
      <view class="auth-card m3-card">
        <text class="m3-title">注册</text>
        <text class="m3-subtitle">创建账号后即可发布信息并接收匹配提醒。</text>

        <view class="m3-field">
          <text class="m3-label">用户名</text>
          <input class="m3-input" v-model="form.username" maxlength="20" placeholder="3-20 位字母、数字或下划线" />
        </view>

        <view class="m3-field">
          <text class="m3-label">密码</text>
          <input class="m3-input" v-model="form.password" password maxlength="64" placeholder="至少 6 位" />
        </view>

        <view class="m3-field">
          <text class="m3-label">学号</text>
          <input class="m3-input" v-model="form.studentId" placeholder="可选" />
        </view>

        <view class="m3-field">
          <text class="m3-label">学院</text>
          <input class="m3-input" v-model="form.college" placeholder="可选" />
        </view>

        <view class="form-split register-split">
          <view class="m3-field split-item">
            <text class="m3-label">手机号</text>
            <input class="m3-input" v-model="form.phone" maxlength="11" type="number" placeholder="可选" />
          </view>
          <view class="m3-field split-item">
            <text class="m3-label">微信</text>
            <input class="m3-input" v-model="form.wechat" placeholder="可选" />
          </view>
        </view>

        <button
          class="m3-btn auth-submit"
          :class="{ disabled: submitting }"
          :disabled="submitting"
          @tap="submit"
        >
          {{ submitting ? '注册中' : '注册' }}
        </button>

        <view class="auth-switch">
          <text>已有账号？</text>
          <button class="m3-btn text" @tap="goLogin">登录</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '../../common/request.js';
import { toastError } from '../../common/utils.js';

export default {
  data() {
    return {
      redirect: '',
      submitting: false,
      form: {
        username: '',
        password: '',
        studentId: '',
        college: '',
        phone: '',
        wechat: ''
      }
    };
  },
  onLoad(options) {
    this.redirect = options && options.redirect ? decodeURIComponent(options.redirect) : '';
  },
  methods: {
    validate() {
      const username = this.form.username.trim();
      if (username.length < 3 || username.length > 20) {
        uni.showToast({ title: '用户名需 3-20 位', icon: 'none' });
        return false;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        uni.showToast({ title: '用户名格式不正确', icon: 'none' });
        return false;
      }
      if (this.form.password.length < 6) {
        uni.showToast({ title: '密码至少 6 位', icon: 'none' });
        return false;
      }
      if (this.form.phone && !/^1[3-9]\d{9}$/.test(this.form.phone)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' });
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
        await request({
          url: '/auth/register',
          method: 'POST',
          data: {
            username: this.form.username.trim(),
            password: this.form.password,
            studentId: this.form.studentId.trim(),
            college: this.form.college.trim(),
            phone: this.form.phone.trim(),
            wechat: this.form.wechat.trim()
          }
        });

        uni.showToast({
          title: '注册成功',
          icon: 'success'
        });

        setTimeout(() => {
          this.goLogin();
        }, 350);
      } catch (error) {
        toastError(error, '注册失败');
      } finally {
        this.submitting = false;
      }
    },
    goLogin() {
      const redirect = this.redirect ? `?redirect=${encodeURIComponent(this.redirect)}` : '';
      uni.redirectTo({
        url: `/pages/login/login${redirect}`
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
  max-width: 720rpx;
  padding: 42rpx 34rpx;
}

.auth-submit {
  width: 100%;
  margin-top: 34rpx;
}

.auth-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  margin-top: 22rpx;
  color: #60706a;
  font-size: 25rpx;
}

.register-split {
  display: flex;
  flex-direction: column;
}

@media screen and (min-width: 768px) {
  .register-split {
    flex-direction: row;
    gap: 20rpx;
  }

  .split-item {
    flex: 1;
  }
}
</style>
