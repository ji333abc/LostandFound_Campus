<template>
  <view class="page">
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
      recognizeMode: 'detailed'
    }
  },
  computed: {
    currentTypeLabel() {
      return this.typeOptions[this.typeIndex].label;
    }
  },
  onShow() {
    const token = uni.getStorageSync('token');
    if (!token) {
      uni.showModal({
        title: '提示',
        content: '发布前请先登录',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
    }

    this.getTabBar && this.getTabBar().setSelected(1);
  },
  methods: {
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
        return uni.showToast({ title: '请先登录', icon: 'none' });
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
  background: #FBFBFA;
  padding-bottom: 140rpx;
}

/* 顶部标题 */
.header {
  padding: 60rpx 40rpx 40rpx;
}

.header-title {
  font-size: 48rpx;
  font-weight: 600;
  color: #37352F;
  margin-bottom: 8rpx;
  letter-spacing: -0.5rpx;
}

.header-subtitle {
  font-size: 28rpx;
  color: #787774;
}
/* 区块样式 */
.section {
  padding: 0 40rpx;
  margin-bottom: 48rpx;
}

.section-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #37352F;
  margin-bottom: 20rpx;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.section-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
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
  padding: 8rpx 18rpx;
  border: 1rpx solid #E9E9E7;
  border-radius: 24rpx;
  color: #787774;
  background: #FFFFFF;
  font-size: 22rpx;
  line-height: 1;
}

.mode-chip.active {
  border-color: #2383E2;
  color: #2383E2;
  background: #F0F7FF;
}

.ai-recognize-btn {
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  line-height: 1;
}

.ai-recognize-btn:active {
  transform: translateY(1rpx);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

.ai-recognize-btn:disabled {
  background: #9B9A97;
  opacity: 0.6;
  box-shadow: none;
}
/* 类型选择器 */
.type-selector {
  display: flex;
  gap: 20rpx;
}

.type-option {
  flex: 1;
  padding: 32rpx 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  text-align: center;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.type-option.active {
  background: #37352F;
  border-color: #37352F;
}

.type-emoji {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.type-text {
  font-size: 28rpx;
  color: #787774;
}

.type-option.active .type-text {
  color: #FFFFFF;
}
/* 输入框 */
.input {
  width: 100%;
  padding: 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  font-size: 28rpx;
  color: #37352F;
  margin-bottom: 16rpx;
  transition: all 0.2s;
}

.input::placeholder {
  color: #9B9A97;
}

.input:focus {
  border-color: #2383E2;
  box-shadow: 0 0 0 6rpx rgba(35, 131, 226, 0.1);
}

/* 日期选择器 */
.date-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
}

.date-label {
  font-size: 28rpx;
  color: #787774;
}

.date-value {
  font-size: 28rpx;
  color: #37352F;
}

/* 文本域 */
.textarea {
  width: 100%;
  padding: 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  font-size: 28rpx;
  color: #37352F;
  min-height: 240rpx;
  line-height: 1.8;
  transition: all 0.2s;
}

.textarea::placeholder {
  color: #9B9A97;
}

.textarea:focus {
  border-color: #2383E2;
  box-shadow: 0 0 0 6rpx rgba(35, 131, 226, 0.1);
}

.ai-tip {
  margin-top: 12rpx;
  padding: 16rpx 20rpx;
  background: #FFF7E6;
  border: 1rpx solid #FFD591;
  border-radius: 6rpx;
  color: #8C6D1F;
  font-size: 24rpx;
  line-height: 1.6;
}
/* 图片上传 */
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-wrapper {
  width: 200rpx;
  height: 200rpx;
  position: relative;
  border-radius: 6rpx;
  overflow: hidden;
  border: 1rpx solid #E9E9E7;
}

.image {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(55, 53, 47, 0.8);
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
  border-radius: 6rpx;
  border: 2rpx dashed #E9E9E7;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.image-add:active {
  border-color: #2383E2;
  background: #F7FBFF;
}

.add-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.add-icon {
  font-size: 56rpx;
  margin-bottom: 8rpx;
}

.add-text {
  font-size: 24rpx;
  color: #9B9A97;
}

.uploading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.uploading-spinner {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
  border: 4rpx solid #E9E9E7;
  border-top-color: #2383E2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.uploading-text {
  font-size: 24rpx;
  color: #9B9A97;
}
/* 提交按钮 */
.submit-section {
  padding: 0 40rpx;
  margin-top: 60rpx;
}

.submit-btn {
  width: 100%;
  padding: 28rpx;
  background: #2383E2;
  color: #FFFFFF;
  border-radius: 6rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s;
}

.submit-btn:active {
  background: #1a6ec7;
  transform: translateY(1rpx);
}

.submit-btn:disabled {
  background: #9B9A97;
  opacity: 0.6;
}

.bottom-safe {
  height: 40rpx;
}
</style>