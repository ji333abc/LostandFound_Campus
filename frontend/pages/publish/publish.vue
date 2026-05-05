<template>
  <view class="m3-page tab-page">
    <view class="m3-shell">
      <view class="publish-hero m3-card">
        <text class="m3-title">发布信息</text>
        <text class="m3-subtitle">补充清晰的时间、地点和照片，系统会自动生成可能匹配提醒。</text>
      </view>

      <view v-if="!loggedIn" class="m3-card login-card">
        <text class="login-title">登录后发布</text>
        <text class="login-desc">账号用于管理发布、接收匹配通知和评论互动。</text>
        <view class="login-actions">
          <button class="m3-btn" @tap="goLogin">登录</button>
          <button class="m3-btn secondary" @tap="goRegister">注册</button>
        </view>
      </view>

      <view v-else class="m3-card form-card">
        <view class="m3-field first-field">
          <text class="m3-label">信息类型</text>
          <view class="m3-segment">
            <view
              class="m3-segment-item"
              :class="{ active: form.type === 'lost' }"
              @tap="form.type = 'lost'"
            >
              <text>寻物</text>
            </view>
            <view
              class="m3-segment-item"
              :class="{ active: form.type === 'found' }"
              @tap="form.type = 'found'"
            >
              <text>招领</text>
            </view>
          </view>
        </view>

        <view class="m3-field">
          <text class="m3-label">标题</text>
          <input
            class="m3-input"
            v-model="form.title"
            maxlength="100"
            placeholder="例如：黑色校园卡包"
          />
        </view>

        <view class="m3-field">
          <text class="m3-label">分类</text>
          <view class="select-picker" @tap="openSelectDialog('category')">
            <view class="select-field">
              <text class="select-value">{{ form.category }}</text>
              <view class="select-affix">
                <view class="select-chevron"></view>
              </view>
            </view>
          </view>
        </view>

        <view class="m3-field">
          <view class="label-row">
            <text class="m3-label">照片</text>
            <text class="field-hint">{{ localImages.length }}/{{ maxImages }}</text>
          </view>
          <view class="upload-grid">
            <view
              v-for="(image, index) in localImages"
              :key="image.url"
              class="upload-tile"
              @tap="previewImage(index)"
            >
              <image class="upload-preview" :src="image.fullUrl || image.localPath" mode="aspectFill" />
              <button class="remove-image" @tap.stop="removeImage(index)">×</button>
            </view>
            <view
              v-if="localImages.length < maxImages"
              class="upload-tile add-tile"
              @tap="chooseImages"
            >
              <text class="add-symbol">+</text>
              <text class="add-text">{{ uploading ? '上传中' : '添加照片' }}</text>
            </view>
          </view>
          <view v-if="localImages.length > 0" class="ai-toolbar">
            <button
              class="m3-btn secondary ai-btn"
              :class="{ disabled: recognizing }"
              :disabled="recognizing"
              @tap="openAiDialog"
            >
              {{ recognizing ? '识别中' : 'AI 识别' }}
            </button>
          </view>
        </view>

        <view class="m3-field">
          <text class="m3-label">描述</text>
          <textarea
            class="m3-textarea"
            v-model="form.description"
            maxlength="500"
            placeholder="颜色、材质、外观特征、明显细节"
          />
        </view>

        <view class="form-split">
          <view class="m3-field split-item">
            <text class="m3-label">地点</text>
            <input class="m3-input" v-model="form.location" placeholder="例如：图书馆二楼" />
          </view>
          <view class="m3-field split-item">
            <text class="m3-label">联系方式</text>
            <input class="m3-input" v-model="form.contact" :placeholder="contactPlaceholder" />
          </view>
        </view>

        <view class="form-split">
          <view class="m3-field split-item">
            <text class="m3-label">日期</text>
            <view class="select-picker" @tap="openSelectDialog('date')">
              <view class="select-field">
                <text class="select-value">{{ dateValue }}</text>
                <view class="select-affix">
                  <view class="select-chevron"></view>
                </view>
              </view>
            </view>
          </view>
          <view class="m3-field split-item">
            <text class="m3-label">时间</text>
            <view class="select-picker" @tap="openSelectDialog('time')">
              <view class="select-field">
                <text class="select-value">{{ timeValue }}</text>
                <view class="select-affix">
                  <view class="select-chevron"></view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <button
          class="m3-btn submit-btn"
          :class="{ disabled: submitting || uploading }"
          :disabled="submitting || uploading"
          @tap="submit"
        >
          {{ submitting ? '发布中' : '确认发布' }}
        </button>
      </view>

      <view v-if="aiDialogVisible" class="ai-dialog-mask" @tap="closeAiDialog">
        <view class="ai-dialog m3-card" @tap.stop>
          <view class="ai-dialog-head">
            <view>
              <text class="ai-dialog-title">AI 识别</text>
              <text class="ai-dialog-subtitle">选择生成长度</text>
            </view>
          </view>

          <view class="ai-choice-row">
            <button
              class="ai-choice"
              :class="{ active: aiMode === 'short', disabled: recognizing }"
              :disabled="recognizing"
              @tap="recognizeImage('short')"
            >
              {{ recognizing && aiMode === 'short' ? '生成中' : '简略' }}
            </button>
            <button
              class="ai-choice"
              :class="{ active: aiMode === 'detailed', disabled: recognizing }"
              :disabled="recognizing"
              @tap="recognizeImage('detailed')"
            >
              {{ recognizing && aiMode === 'detailed' ? '生成中' : '详细' }}
            </button>
          </view>

          <textarea
            class="m3-textarea ai-draft"
            v-model="aiDraft"
            maxlength="500"
            placeholder="识别结果会显示在这里"
          />

          <view class="ai-dialog-actions">
            <button class="m3-btn text ai-action" @tap="closeAiDialog">取消</button>
            <button
              class="m3-btn ai-action"
              :class="{ disabled: recognizing || !aiDraft.trim() }"
              :disabled="recognizing || !aiDraft.trim()"
              @tap="insertAiDescription"
            >
              填入
            </button>
          </view>
        </view>
      </view>

      <view v-if="selectDialogVisible" class="select-dialog-mask" @tap="closeSelectDialog">
        <view class="select-dialog m3-card" @tap.stop>
          <view class="select-dialog-head">
            <text class="select-dialog-title">{{ selectDialogTitle }}</text>
            <text class="select-dialog-value">{{ selectDialogValue }}</text>
          </view>

          <picker-view
            class="select-wheel"
            :value="selectPickerValue"
            indicator-class="select-wheel-indicator"
            @change="onSelectPickerChange"
          >
            <picker-view-column
              v-for="(column, columnIndex) in selectDialogColumns"
              :key="columnIndex"
            >
              <view
                v-for="(option, optionIndex) in column"
                :key="columnIndex + '-' + optionIndex"
                class="select-option"
              >
                <text>{{ option }}</text>
              </view>
            </picker-view-column>
          </picker-view>

          <view class="select-dialog-actions">
            <button class="m3-btn text select-action" @tap="closeSelectDialog">取消</button>
            <button class="m3-btn select-action" @tap="confirmSelectDialog">确定</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { MAX_UPLOAD_IMAGES } from '../../common/config.js';
import { request, uploadImage, isLoggedIn } from '../../common/request.js';
import { categories, resolveAssetUrl, toastError } from '../../common/utils.js';

function pad(value) {
  const normalized = String(value);
  return normalized.length >= 2 ? normalized : `0${normalized}`;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function nowTime() {
  const date = new Date();
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildNumberRange(start, end) {
  const values = [];
  for (let value = start; value <= end; value += 1) {
    values.push(value);
  }
  return values;
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return buildNumberRange(currentYear - 5, currentYear + 1);
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function parseDateParts(value) {
  const parts = String(value || '').split('-').map((item) => Number(item));
  if (parts.length !== 3 || parts.some((item) => !Number.isFinite(item))) {
    const date = new Date();
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2]
  };
}

function parseTimeParts(value) {
  const parts = String(value || '').split(':').map((item) => Number(item));
  if (parts.length !== 2 || parts.some((item) => !Number.isFinite(item))) {
    const date = new Date();
    return {
      hour: date.getHours(),
      minute: date.getMinutes()
    };
  }
  return {
    hour: Math.max(0, Math.min(23, parts[0])),
    minute: Math.max(0, Math.min(59, parts[1]))
  };
}

export default {
  data() {
    const yearOptions = buildYearOptions();
    const monthOptions = buildNumberRange(1, 12);
    const dateParts = parseDateParts(today());
    return {
      loggedIn: false,
      maxImages: MAX_UPLOAD_IMAGES,
      categories,
      categoryIndex: 0,
      dateValue: today(),
      timeValue: nowTime(),
      selectDialogVisible: false,
      selectDialogType: '',
      selectPickerValue: [0],
      yearOptions,
      monthOptions,
      dayOptions: buildNumberRange(1, getDaysInMonth(dateParts.year, dateParts.month)),
      hourOptions: buildNumberRange(0, 23),
      minuteOptions: buildNumberRange(0, 59),
      form: {
        type: 'lost',
        title: '',
        category: categories[0],
        description: '',
        location: '',
        contact: '',
        images: []
      },
      localImages: [],
      uploading: false,
      recognizing: false,
      aiMode: '',
      aiDialogVisible: false,
      aiDraft: '',
      submitting: false,
      lastRecognizeAt: 0
    };
  },
  computed: {
    contactPlaceholder() {
      return this.form.type === 'lost' ? '便于拾到者联系你' : '便于失主联系你';
    },
    selectDialogTitle() {
      const titleMap = {
        category: '选择分类',
        date: '选择日期',
        time: '选择时间'
      };
      return titleMap[this.selectDialogType] || '';
    },
    selectDialogColumns() {
      if (this.selectDialogType === 'category') {
        return [this.categories];
      }
      if (this.selectDialogType === 'date') {
        return [
          this.yearOptions.map((item) => `${item} 年`),
          this.monthOptions.map((item) => `${pad(item)} 月`),
          this.dayOptions.map((item) => `${pad(item)} 日`)
        ];
      }
      if (this.selectDialogType === 'time') {
        return [
          this.hourOptions.map((item) => `${pad(item)} 时`),
          this.minuteOptions.map((item) => `${pad(item)} 分`)
        ];
      }
      return [];
    },
    selectDialogValue() {
      if (this.selectDialogType === 'category') {
        const categoryIndex = this.selectPickerValue[0] || 0;
        return this.categories[categoryIndex] || '';
      }
      if (this.selectDialogType === 'date') {
        const year = this.yearOptions[this.selectPickerValue[0] || 0];
        const month = this.monthOptions[this.selectPickerValue[1] || 0];
        const day = this.dayOptions[this.selectPickerValue[2] || 0];
        return year && month && day ? `${year}-${pad(month)}-${pad(day)}` : '';
      }
      if (this.selectDialogType === 'time') {
        const hour = this.hourOptions[this.selectPickerValue[0] || 0];
        const minute = this.minuteOptions[this.selectPickerValue[1] || 0];
        return `${pad(hour || 0)}:${pad(minute || 0)}`;
      }
      return '';
    }
  },
  onShow() {
    this.setTabBarIndex();
    this.loggedIn = isLoggedIn();
  },
  methods: {
    setTabBarIndex() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setSelected(1);
      }
    },
    openSelectDialog(type) {
      this.selectDialogType = type;
      if (type === 'category') {
        this.selectPickerValue = [this.categoryIndex];
      } else if (type === 'date') {
        const parts = parseDateParts(this.dateValue);
        let yearIndex = this.yearOptions.indexOf(parts.year);
        if (yearIndex < 0) {
          this.yearOptions = this.yearOptions.concat(parts.year).sort((a, b) => a - b);
          yearIndex = this.yearOptions.indexOf(parts.year);
        }
        const monthIndex = Math.max(0, this.monthOptions.indexOf(parts.month));
        this.updateDayOptions(parts.year, parts.month);
        const dayIndex = Math.max(0, Math.min(this.dayOptions.length - 1, parts.day - 1));
        this.selectPickerValue = [yearIndex, monthIndex, dayIndex];
      } else if (type === 'time') {
        const parts = parseTimeParts(this.timeValue);
        this.selectPickerValue = [parts.hour, parts.minute];
      }
      this.selectDialogVisible = true;
    },
    closeSelectDialog() {
      this.selectDialogVisible = false;
    },
    updateDayOptions(year, month) {
      this.dayOptions = buildNumberRange(1, getDaysInMonth(year, month));
    },
    onSelectPickerChange(event) {
      const value = event.detail.value || [];
      if (this.selectDialogType === 'category') {
        this.selectPickerValue = [value[0] || 0];
        return;
      }
      if (this.selectDialogType === 'date') {
        const yearIndex = value[0] || 0;
        const monthIndex = value[1] || 0;
        const year = this.yearOptions[yearIndex] || this.yearOptions[0];
        const month = this.monthOptions[monthIndex] || 1;
        const previousDayIndex = value[2] || 0;
        this.updateDayOptions(year, month);
        const dayIndex = Math.max(0, Math.min(this.dayOptions.length - 1, previousDayIndex));
        this.selectPickerValue = [yearIndex, monthIndex, dayIndex];
        return;
      }
      if (this.selectDialogType === 'time') {
        this.selectPickerValue = [value[0] || 0, value[1] || 0];
      }
    },
    confirmSelectDialog() {
      if (this.selectDialogType === 'category') {
        const index = this.selectPickerValue[0] || 0;
        this.categoryIndex = index;
        this.form.category = this.categories[index] || this.categories[0];
      } else if (this.selectDialogType === 'date') {
        const year = this.yearOptions[this.selectPickerValue[0] || 0];
        const month = this.monthOptions[this.selectPickerValue[1] || 0];
        const day = this.dayOptions[this.selectPickerValue[2] || 0];
        this.dateValue = `${year}-${pad(month)}-${pad(day)}`;
      } else if (this.selectDialogType === 'time') {
        const hour = this.hourOptions[this.selectPickerValue[0] || 0];
        const minute = this.minuteOptions[this.selectPickerValue[1] || 0];
        this.timeValue = `${pad(hour || 0)}:${pad(minute || 0)}`;
      }
      this.closeSelectDialog();
    },
    openAiDialog() {
      if (!this.localImages.length || this.recognizing) return;
      this.aiDialogVisible = true;
      this.aiMode = '';
      if (!this.aiDraft && this.form.description) {
        this.aiDraft = this.form.description;
      }
    },
    closeAiDialog() {
      if (this.recognizing) return;
      this.aiDialogVisible = false;
    },
    goLogin() {
      uni.navigateTo({
        url: '/pages/login/login?redirect=%2Fpages%2Fpublish%2Fpublish'
      });
    },
    goRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    },
    chooseImages() {
      if (this.uploading) return;

      const count = this.maxImages - this.localImages.length;
      uni.chooseImage({
        count,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const files = res.tempFilePaths || [];
          if (!files.length) return;

          this.uploading = true;
          try {
            for (let i = 0; i < files.length; i += 1) {
              const data = await uploadImage(files[i]);
              const url = data.url;
              this.localImages.push({
                localPath: files[i],
                url,
                fullUrl: resolveAssetUrl(url)
              });
            }
            this.form.images = this.localImages.map((item) => item.url);
          } catch (error) {
            toastError(error, '图片上传失败');
          } finally {
            this.uploading = false;
          }
        }
      });
    },
    removeImage(index) {
      this.localImages.splice(index, 1);
      this.form.images = this.localImages.map((item) => item.url);
    },
    previewImage(index) {
      const urls = this.localImages.map((item) => item.fullUrl || item.localPath);
      uni.previewImage({
        current: urls[index],
        urls
      });
    },
    async recognizeImage(mode) {
      if (!this.localImages.length || this.recognizing) return;

      const now = Date.now();
      if (now - this.lastRecognizeAt < 2500) {
        uni.showToast({
          title: '稍后再试',
          icon: 'none'
        });
        return;
      }

      this.aiMode = mode;
      this.recognizing = true;
      this.lastRecognizeAt = now;
      try {
        const first = this.localImages[0];
        const res = await request({
          url: '/ai/recognize',
          method: 'POST',
          data: {
            imageUrl: first.url,
            mode: this.aiMode,
            maxChars: this.aiMode === 'detailed' ? 180 : 80
          }
        });

        if (res.description) {
          this.aiDraft = res.description;
        }
      } catch (error) {
        toastError(error, 'AI 识别失败');
      } finally {
        this.recognizing = false;
      }
    },
    insertAiDescription() {
      const text = this.aiDraft.trim();
      if (!text) {
        uni.showToast({
          title: '暂无识别内容',
          icon: 'none'
        });
        return;
      }
      this.form.description = text;
      this.aiDialogVisible = false;
    },
    buildTimeValue() {
      const value = new Date(`${this.dateValue}T${this.timeValue}:00`);
      if (Number.isNaN(value.getTime())) {
        return undefined;
      }
      return value.toISOString();
    },
    validate() {
      if (!this.form.title.trim()) {
        uni.showToast({ title: '请填写标题', icon: 'none' });
        return false;
      }
      if (this.form.title.trim().length < 2) {
        uni.showToast({ title: '标题至少 2 个字', icon: 'none' });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate() || this.submitting || this.uploading) {
        return;
      }

      this.submitting = true;
      try {
        const payload = {
          title: this.form.title.trim(),
          type: this.form.type,
          category: this.form.category,
          description: this.form.description.trim(),
          location: this.form.location.trim(),
          contact: this.form.contact.trim(),
          images: this.form.images,
          time: this.buildTimeValue()
        };

        const res = await request({
          url: '/items',
          method: 'POST',
          data: payload
        });

        uni.showToast({
          title: '发布成功',
          icon: 'success'
        });

        const id = res.data && res.data._id;
        this.resetForm();

        setTimeout(() => {
          if (id) {
            uni.navigateTo({
              url: `/pages/detail/detail?id=${id}`
            });
          } else {
            uni.switchTab({
              url: '/pages/index/index'
            });
          }
        }, 400);
      } catch (error) {
        toastError(error, '发布失败');
      } finally {
        this.submitting = false;
      }
    },
    resetForm() {
      this.categoryIndex = 0;
      this.dateValue = today();
      this.timeValue = nowTime();
      this.localImages = [];
      this.aiMode = '';
      this.aiDialogVisible = false;
      this.aiDraft = '';
      this.form = {
        type: 'lost',
        title: '',
        category: this.categories[0],
        description: '',
        location: '',
        contact: '',
        images: []
      };
    }
  }
};
</script>

<style>
.publish-hero {
  padding: 34rpx;
}

.login-card,
.form-card {
  margin-top: 24rpx;
  padding: 30rpx;
}

.login-title {
  display: block;
  color: #171d1b;
  font-size: 34rpx;
  font-weight: 760;
}

.login-desc {
  display: block;
  margin-top: 12rpx;
  color: #60706a;
  font-size: 26rpx;
  line-height: 1.55;
}

.login-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.first-field {
  margin-top: 0;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-hint {
  color: #60706a;
  font-size: 23rpx;
}

.select-picker {
  display: block;
  width: 100%;
}

.select-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 92rpx;
  padding: 0 18rpx 0 28rpx;
  border: 1rpx solid #c1ccc6;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: inset 0 -1rpx 0 rgba(0, 106, 96, 0.08);
}

.select-value {
  flex: 1;
  min-width: 0;
  color: #171d1b;
  font-size: 28rpx;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-affix {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  margin-left: 18rpx;
  border-radius: 999rpx;
  background: #e5f2ed;
}

.select-chevron {
  width: 14rpx;
  height: 14rpx;
  margin-top: -6rpx;
  border-right: 3rpx solid #006a60;
  border-bottom: 3rpx solid #006a60;
  transform: rotate(45deg);
}

.upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.upload-tile {
  position: relative;
  width: calc((100% - 32rpx) / 3);
  min-width: 0;
  height: 210rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: #e7f1ec;
}

.upload-preview {
  width: 100%;
  height: 100%;
}

.add-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #8aa39a;
  color: #006a60;
}

.add-symbol {
  font-size: 54rpx;
  font-weight: 700;
  line-height: 1;
}

.add-text {
  margin-top: 10rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.remove-image {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46rpx;
  height: 46rpx;
  border-radius: 999rpx;
  background: rgba(20, 30, 28, 0.72);
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 400;
}

.ai-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-top: 18rpx;
}

.ai-btn {
  min-height: 64rpx;
  padding: 0 22rpx;
  font-size: 25rpx;
}

.form-split {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.submit-btn {
  width: 100%;
  margin-top: 34rpx;
}

.ai-dialog-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 28rpx;
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  background: rgba(19, 29, 26, 0.38);
}

.ai-dialog {
  width: 100%;
  max-width: 720rpx;
  padding: 30rpx;
  border-radius: 32rpx;
}

.ai-dialog-head {
  display: flex;
  align-items: flex-start;
}

.ai-dialog-title {
  display: block;
  color: #171d1b;
  font-size: 34rpx;
  font-weight: 780;
  line-height: 1.25;
}

.ai-dialog-subtitle {
  display: block;
  margin-top: 8rpx;
  color: #60706a;
  font-size: 24rpx;
}

.ai-choice-row {
  display: flex;
  gap: 14rpx;
  margin-top: 24rpx;
}

.ai-choice {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 76rpx;
  border-radius: 999rpx;
  background: #e7f1ec;
  color: #3f4d48;
  font-size: 27rpx;
  font-weight: 750;
}

.ai-choice.active {
  background: #006a60;
  color: #ffffff;
}

.ai-choice.disabled {
  color: #8b9691;
  background: #dfe6e1;
}

.ai-draft {
  min-height: 210rpx;
  margin-top: 22rpx;
}

.ai-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 20rpx;
}

.ai-action {
  min-width: 150rpx;
}

.select-dialog-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 28rpx;
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  background: rgba(19, 29, 26, 0.38);
}

.select-dialog {
  width: 100%;
  max-width: 720rpx;
  padding: 30rpx;
  border-radius: 32rpx;
}

.select-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
}

.select-dialog-title {
  color: #171d1b;
  font-size: 34rpx;
  font-weight: 780;
  line-height: 1.25;
}

.select-dialog-value {
  flex: 0 0 auto;
  max-width: 360rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #cce8e1;
  color: #00201c;
  font-size: 24rpx;
  font-weight: 750;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-wheel {
  width: 100%;
  height: 360rpx;
  margin-top: 24rpx;
  border-radius: 26rpx;
  background: #f2f8f3;
  overflow: hidden;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  color: #3f4d48;
  font-size: 29rpx;
  font-weight: 700;
}

.select-wheel-indicator {
  height: 72rpx;
  border-top: 1rpx solid rgba(0, 106, 96, 0.18);
  border-bottom: 1rpx solid rgba(0, 106, 96, 0.18);
  background: rgba(204, 232, 225, 0.42);
}

.select-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 22rpx;
}

.select-action {
  min-width: 150rpx;
}

@media screen and (min-width: 768px) {
  .form-split {
    flex-direction: row;
    gap: 20rpx;
  }

  .split-item {
    flex: 1;
  }

  .ai-dialog-mask {
    align-items: center;
  }

  .select-dialog-mask {
    align-items: center;
  }
}
</style>
