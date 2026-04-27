<template>
  <view class="page">
    <view class="page-shell">
      <!-- 顶部标题 -->
      <view class="header">
        <view class="header-title">发布信息</view>
        <view class="header-subtitle">帮助更多人找回失物</view>
      </view>

      <!-- 类型选择 -->
      <view class="section">
          <view class="section-label">选择类型</view>
      <view class="type-selector">
        <view 
          :class="['type-option', form.type === 'lost' ? 'active' : '']"
          @click="selectType('lost')"
        >
          <text class="type-emoji">🔍</text>
          <text class="type-text">寻物启事</text>
        </view>
        <view 
          :class="['type-option', form.type === 'found' ? 'active' : '']"
          @click="selectType('found')"
        >
          <text class="type-emoji">🎁</text>
          <text class="type-text">失物招领</text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="section">
      <view class="section-label">基本信息</view>
      <input 
        class="input" 
        v-model="form.title" 
        placeholder="物品名称（必填）"
      />
      <input 
        class="input" 
        v-model="form.category" 
        placeholder="物品分类（如：证件、电子产品）"
      />
    </view>

    <!-- 时间地点 -->
    <view class="section">
      <view class="section-label">时间地点</view>
      <input 
        class="input" 
        v-model="form.location" 
        placeholder="丢失/捡到地点"
      />
      <picker mode="date" :value="form.time" @change="onDateChange">
        <view class="date-picker">
          <text class="date-label">日期</text>
          <text class="date-value">{{ form.time || '请选择日期' }}</text>
        </view>
      </picker>
    </view>

    <!-- 图片上传 -->
    <view class="section">
      <view class="section-label-row">
        <view class="section-label">添加图片（最多{{ maxImages }}张）</view>
        <view class="ai-controls" v-if="images.length > 0">
          <view class="mode-switch">
            <view
              :class="['mode-chip', recognizeMode === 'short' ? 'active' : '']"
              @click="setRecognizeMode('short')"
            >简短</view>
            <view
              :class="['mode-chip', recognizeMode === 'detailed' ? 'active' : '']"
              @click="setRecognizeMode('detailed')"
            >详细</view>
          </view>
          <button 
            class="ai-recognize-btn" 
            :disabled="recognizing"
            @click="recognizeImage"
          >
            <text v-if="!recognizing">🤖 AI识别</text>
            <text v-else>识别中...</text>
          </button>
        </view>
      </view>
      <view class="image-list">
        <view v-for="(img, index) in images" :key="index" class="image-wrapper">
          <image :src="img" mode="aspectFill" class="image"></image>
          <view class="image-delete" @click.stop="removeImage(index)">×</view>
        </view>
        <view v-if="images.length < maxImages" class="image-add" @click="chooseImage">
          <view v-if="!uploading" class="add-content">
            <text class="add-icon">📷</text>
            <text class="add-text">添加图片</text>
          </view>
          <view v-else class="uploading-content">
            <view class="uploading-spinner"></view>
            <text class="uploading-text">上传中</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 详细描述 -->
    <view class="section">
      <view class="section-label">详细描述</view>
      <textarea 
        class="textarea" 
        v-model="form.description" 
        @input="onDescriptionInput"
        placeholder="请详细描述物品特征、丢失/捡到经过等信息..."
      ></textarea>
      <view v-if="aiDescriptionGenerated" class="ai-tip">
        AI识别结果仅供参考，请核对并补充细节后再发布{{ aiDescriptionEdited ? '（已手动编辑）' : '' }}
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="section">
      <view class="section-label">联系方式</view>
      <input 
        class="input" 
        v-model="form.contact" 
        placeholder="请输入电话或微信号"
      />
    </view>

      <!-- 发布按钮 -->
      <view class="submit-section">
        <button class="submit-btn" :disabled="submitting" @click="submit">
          <text v-if="!submitting">立即发布</text>
          <text v-else>发布中...</text>
        </button>
      </view>

      <view class="bottom-safe"></view>
    </view>

    <view v-if="showLoginDialog" class="dialog-mask" @click="closeLoginDialog">
      <view class="login-dialog" @click.stop>
        <view class="dialog-icon">🔐</view>
        <view class="dialog-title">请先登录</view>
        <view class="dialog-text">登录后才可以发布信息、上传图片并与他人联系。</view>
        <view class="dialog-actions">
          <view class="dialog-btn dialog-btn-secondary" @click="closeLoginDialog">稍后再说</view>
          <view class="dialog-btn dialog-btn-primary" @click="goLogin">去登录</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '@/common/request.js';
import { API_UPLOAD_URL, MAX_UPLOAD_IMAGES, STATIC_BASE_URL } from '@/common/config.js';

export default {
  data() {
    return {
      typeOptions: [
        { value: 'lost', label: '寻物启事（我丢了东西）' },
        { value: 'found', label: '失物招领（我捡到东西）' }
      ],
      typeIndex: 0,
      form: {
        title: '',
        type: 'lost',
        category: '',
        description: '',
        location: '',
        time: '',
        contact: ''
      },
      images: [],
      uploading: false,
      submitting: false,
      recognizing: false,
      maxImages: MAX_UPLOAD_IMAGES,
      recognizeCooldownMs: 2500,
      lastRecognizeAt: 0,
      aiDescriptionGenerated: false,
      aiDescriptionEdited: false,
      recognizeMode: 'detailed',
      showLoginDialog: false
    }
  },
  computed: {
    currentTypeLabel() {
      return this.typeOptions[this.typeIndex].label;
    }
  },
  onShow() {
    const token = uni.getStorageSync('token');
    this.showLoginDialog = !token;
    this.getTabBar && this.getTabBar().setSelected(1);
  },
  methods: {
    promptLogin() {
      this.showLoginDialog = true;
    },
    closeLoginDialog() {
      this.showLoginDialog = false;
    },
    goLogin() {
      this.showLoginDialog = false;
      uni.navigateTo({ url: '/pages/login/login' });
    },
    selectType(type) {
      this.form.type = type;
      this.typeIndex = type === 'lost' ? 0 : 1;
    },
    onTypeChange(e) {
      this.typeIndex = Number(e.detail.value);
      this.form.type = this.typeOptions[this.typeIndex].value;
    },
    onDateChange(e) {
      this.form.time = e.detail.value;
    },
    onDescriptionInput() {
      if (this.aiDescriptionGenerated) {
        this.aiDescriptionEdited = true;
      }
    },
    setRecognizeMode(mode) {
      this.recognizeMode = mode === 'short' ? 'short' : 'detailed';
    },
    removeImage(index) {
      this.images.splice(index, 1);
    },
    async recognizeImage() {
      if (this.images.length === 0) {
        return uni.showToast({ title: '请先上传图片', icon: 'none' });
      }
      
      if (this.recognizing) return;

      const now = Date.now();
      const elapsed = now - this.lastRecognizeAt;
      if (elapsed < this.recognizeCooldownMs) {
        const waitSec = ((this.recognizeCooldownMs - elapsed) / 1000).toFixed(1);
        return uni.showToast({ title: `操作太快，请${waitSec}秒后重试`, icon: 'none' });
      }
      this.lastRecognizeAt = now;
      
      this.recognizing = true;
      let loadingShown = false;
      uni.showLoading({ title: 'AI识别中...' });
      loadingShown = true;
      
      try {
        // 使用第一张图片进行识别
        const imageUrl = this.images[0].replace(STATIC_BASE_URL, '');
        
        const result = await request({
          url: '/ai/recognize',
          method: 'POST',
          data: {
            imageUrl,
            mode: this.recognizeMode,
            maxChars: this.recognizeMode === 'short' ? 80 : 180
          }
        });

        // 先关闭 loading，再弹 toast，避免 showLoading/hideLoading 配对告警
        if (loadingShown) {
          uni.hideLoading();
          loadingShown = false;
        }
        
        if (result.description) {
          // 将AI生成的描述填入描述框
          this.form.description = result.description;
          this.aiDescriptionGenerated = true;
          this.aiDescriptionEdited = false;
          uni.showToast({ 
            title: result.truncated ? 'AI识别成功（已压缩长度）' : 'AI识别成功', 
            icon: 'success',
            duration: 1500
          });
        }
      } catch (e) {
        // 先关闭 loading，再弹 toast，避免 showLoading/hideLoading 配对告警
        if (loadingShown) {
          uni.hideLoading();
          loadingShown = false;
        }

        const errorMsg = e.data?.message || e.message || 'AI识别失败，请稍后重试';
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 2500
        });
      } finally {
        this.recognizing = false;
        if (loadingShown) {
          uni.hideLoading();
        }
      }
    },
    async chooseImage() {
      const token = uni.getStorageSync('token');
      if (!token) {
        this.promptLogin();
        return;
      }

      if (this.images.length >= MAX_UPLOAD_IMAGES) {
        return uni.showToast({ title: `最多上传${MAX_UPLOAD_IMAGES}张图片`, icon: 'none' });
      }

      uni.chooseImage({
        count: MAX_UPLOAD_IMAGES - this.images.length,
        success: (res) => {
          const files = res.tempFilePaths;
          let uploadCount = 0;
          this.uploading = true;
          
          files.forEach((filePath) => {
            uni.uploadFile({
              url: API_UPLOAD_URL,
              filePath,
              name: 'file',
              header: {
                Authorization: token
              },
              success: (uploadRes) => {
                try {
                  const data = JSON.parse(uploadRes.data);
                  if (data.url) {
                    this.images.push(`${STATIC_BASE_URL}${data.url}`);
                  }
                } catch (e) {
                  uni.showToast({ title: '上传失败', icon: 'none' });
                }
              },
              fail: () => {
                uni.showToast({ title: '上传失败', icon: 'none' });
              },
              complete: () => {
                uploadCount++;
                if (uploadCount === files.length) {
                  this.uploading = false;
                }
              }
            });
          });
        }
      });
    },
    async submit() {
      const token = uni.getStorageSync('token');
      if (!token) {
        this.promptLogin();
        return;
      }
      if (!this.form.title) {
        return uni.showToast({ title: '请输入物品名称', icon: 'none' });
      }
      if (this.submitting) return;
      this.submitting = true;
      try {
        await request({
          url: '/items',
          method: 'POST',
          data: {
            ...this.form,
            images: this.images
          }
        });
        uni.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' });
        }, 500);
      } catch (e) {
        // 显示后端返回的具体错误信息
        const errorMsg = e.data?.message || e.message || '发布失败，请稍后重试';
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 2500
        });
      } finally {
        this.submitting = false;
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 20rpx 160rpx;
}

.page-shell {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}

.header {
  margin: 28rpx 0;
  padding: 54rpx 38rpx;
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.14) 0%, rgba(255, 255, 255, 0.94) 58%, rgba(124, 58, 237, 0.08) 100%);
  border-radius: 32rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18rpx 54rpx rgba(15, 23, 42, 0.08);
}

.header-title {
  font-size: 50rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10rpx;
  letter-spacing: -1rpx;
}

.header-subtitle {
  font-size: 28rpx;
  color: #64748b;
}

.section {
  margin: 0 0 26rpx;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 28rpx;
  box-shadow: 0 14rpx 40rpx rgba(15, 23, 42, 0.05);
}

.section-label {
  font-size: 24rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20rpx;
  letter-spacing: 1rpx;
}

.section-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  gap: 14rpx;
}

.section-label-row .section-label {
  margin-bottom: 0;
}

.ai-controls {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.mode-chip {
  padding: 10rpx 18rpx;
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  border-radius: 999rpx;
  color: #64748b;
  background: rgba(248, 250, 252, 0.8);
  font-size: 22rpx;
  line-height: 1;
}

.mode-chip.active {
  border-color: rgba(79, 124, 255, 0.22);
  color: #3d68eb;
  background: rgba(79, 124, 255, 0.1);
}

.ai-recognize-btn {
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, #7c3aed 0%, #4f7cff 100%);
  color: #ffffff;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 12rpx 30rpx rgba(79, 124, 255, 0.2);
  display: flex;
  align-items: center;
  line-height: 1;
}

.ai-recognize-btn:active {
  transform: translateY(2rpx);
}

.ai-recognize-btn:disabled {
  background: #cbd5e1;
  opacity: 0.8;
  box-shadow: none;
}

.type-selector {
  display: flex;
  gap: 18rpx;
}

.type-option {
  flex: 1;
  padding: 34rpx 24rpx;
  background: rgba(248, 250, 252, 0.85);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 24rpx;
  text-align: center;
  transition: all 0.22s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.type-option.active {
  background: linear-gradient(135deg, #4f7cff 0%, #6ea8ff 100%);
  border-color: transparent;
  box-shadow: 0 16rpx 36rpx rgba(79, 124, 255, 0.2);
}

.type-emoji {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.type-text {
  font-size: 28rpx;
  color: #64748b;
  font-weight: 600;
}

.type-option.active .type-text {
  color: #ffffff;
}

.input {
  display: block;
  width: 100%;
  min-height: 92rpx;
  padding: 24rpx;
  background: rgba(248, 250, 252, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 22rpx;
  font-size: 28rpx;
  line-height: 1.4;
  color: #1f2937;
  margin-bottom: 16rpx;
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

.date-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: rgba(248, 250, 252, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 22rpx;
}

.date-label {
  font-size: 28rpx;
  color: #64748b;
}

.date-value {
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 500;
}

.textarea {
  display: block;
  width: 100%;
  padding: 24rpx;
  background: rgba(248, 250, 252, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  border-radius: 22rpx;
  font-size: 28rpx;
  color: #1f2937;
  min-height: 240rpx;
  line-height: 1.8;
  transition: all 0.2s;
  position: relative;
  z-index: 2;
}

.textarea::placeholder {
  color: #94a3b8;
}

.textarea:focus {
  border-color: rgba(79, 124, 255, 0.42);
  box-shadow: 0 0 0 8rpx rgba(79, 124, 255, 0.08);
}

.ai-tip {
  margin-top: 14rpx;
  padding: 16rpx 20rpx;
  background: rgba(245, 158, 11, 0.1);
  border: 1rpx solid rgba(245, 158, 11, 0.16);
  border-radius: 20rpx;
  color: #b45309;
  font-size: 24rpx;
  line-height: 1.6;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-wrapper {
  width: 200rpx;
  height: 200rpx;
  position: relative;
  border-radius: 24rpx;
  overflow: hidden;
  border: 1rpx solid rgba(148, 163, 184, 0.16);
}

.image {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(15, 23, 42, 0.72);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36rpx;
  line-height: 1;
}

.image-add {
  width: 200rpx;
  height: 200rpx;
  border-radius: 24rpx;
  border: 2rpx dashed rgba(79, 124, 255, 0.22);
  background: rgba(79, 124, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.image-add:active {
  border-color: rgba(79, 124, 255, 0.44);
  background: rgba(79, 124, 255, 0.08);
}

.add-content,
.uploading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.add-icon {
  font-size: 56rpx;
  margin-bottom: 8rpx;
}

.add-text,
.uploading-text {
  font-size: 24rpx;
  color: #94a3b8;
}

.uploading-spinner {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
  border: 4rpx solid rgba(148, 163, 184, 0.18);
  border-top-color: #4f7cff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.submit-section {
  padding: 0;
  margin-top: 14rpx;
}

.submit-btn {
  width: 100%;
  padding: 30rpx;
  background: linear-gradient(135deg, #4f7cff 0%, #6ea8ff 100%);
  color: #ffffff;
  border-radius: 26rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 18rpx 40rpx rgba(79, 124, 255, 0.22);
}

.submit-btn:active {
  transform: translateY(2rpx);
}

.submit-btn:disabled {
  background: #cbd5e1;
  opacity: 0.9;
  box-shadow: none;
}

.bottom-safe {
  height: 40rpx;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  z-index: 1200;
  backdrop-filter: blur(12rpx);
}

.login-dialog {
  width: 100%;
  max-width: 680rpx;
  padding: 44rpx 34rpx 34rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  border-radius: 32rpx;
  box-shadow: 0 24rpx 70rpx rgba(15, 23, 42, 0.18);
  text-align: center;
}

.dialog-icon {
  width: 104rpx;
  height: 104rpx;
  margin: 0 auto 22rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, rgba(79, 124, 255, 0.14) 0%, rgba(124, 58, 237, 0.12) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 54rpx;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.dialog-text {
  font-size: 27rpx;
  line-height: 1.7;
  color: #64748b;
}

.dialog-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 30rpx;
}

.dialog-btn {
  flex: 1;
  padding: 22rpx 20rpx;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
}

.dialog-btn-secondary {
  background: rgba(248, 250, 252, 0.92);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  color: #64748b;
}

.dialog-btn-primary {
  background: linear-gradient(135deg, #4f7cff 0%, #6ea8ff 100%);
  color: #ffffff;
  box-shadow: 0 16rpx 36rpx rgba(79, 124, 255, 0.18);
}

@media screen and (min-width: 768px) {
  .page {
    padding: 24px 24px 180px;
  }

  .header {
    padding: 34px 32px;
  }

  .section {
    padding: 28px;
  }

  .header-title {
    font-size: 32px;
  }

  .header-subtitle,
  .type-text,
  .date-label,
  .date-value,
  .submit-btn,
  .dialog-btn {
    font-size: 16px;
  }

  .input {
    min-height: 48px;
    padding: 12px 14px;
    font-size: 15px;
    border-radius: 14px;
  }

  .textarea {
    min-height: 132px;
    padding: 14px;
    font-size: 15px;
    border-radius: 14px;
  }

  .section-label,
  .mode-chip,
  .add-text,
  .uploading-text,
  .ai-tip {
    font-size: 13px;
  }

  .type-option {
    min-height: 148px;
    justify-content: center;
  }

  .image-wrapper,
  .image-add {
    width: calc((100% - 32px) / 3);
    max-width: 180px;
    height: 180px;
  }

  .login-dialog {
    max-width: 420px;
    padding: 28px;
    border-radius: 24px;
  }

  .dialog-icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    font-size: 32px;
    margin-bottom: 16px;
  }

  .dialog-title {
    font-size: 24px;
  }

  .dialog-text {
    font-size: 14px;
  }
}

@media screen and (min-width: 1024px) {
  .page-shell {
    max-width: 1080px;
  }

  .type-selector {
    gap: 20px;
  }

  .section-label-row {
    flex-wrap: wrap;
    align-items: flex-start;
  }
}
</style>