<template>
  <view class="m3-page">
    <view class="m3-shell">
      <view v-if="loading" class="m3-card detail-loading">
        <view class="skeleton title"></view>
        <view class="skeleton line"></view>
        <view class="skeleton line short"></view>
      </view>

      <block v-else-if="item">
        <swiper
          v-if="item.images && item.images.length"
          class="gallery m3-card"
          circular
          indicator-dots
          indicator-color="rgba(255,255,255,0.55)"
          indicator-active-color="#ffffff"
        >
          <swiper-item v-for="(image, index) in item.images" :key="image">
            <image
              class="gallery-image"
              :src="resolveImage(image)"
              mode="aspectFill"
              @tap="previewImage(index)"
            />
          </swiper-item>
        </swiper>

        <view v-else class="gallery-fallback m3-card">
          <text>{{ item.category || '物品' }}</text>
        </view>

        <view class="detail-main m3-card">
          <view class="badge-row">
            <text class="m3-chip" :class="itemTypeTone(item.type)">
              {{ itemTypeLabel(item.type) }}
            </text>
            <text class="m3-chip" :class="{ warn: item.status === 'resolved' }">
              {{ statusLabel(item.status) }}
            </text>
            <text v-if="item.category" class="m3-chip tonal">{{ item.category }}</text>
          </view>

          <text class="detail-title">{{ item.title }}</text>
          <text class="detail-desc">{{ item.description || '暂无描述' }}</text>

          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">地点</text>
              <text class="info-value">{{ item.location || '待补充' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">发生时间</text>
              <text class="info-value">{{ formatDateTime(item.time) || '待补充' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">发布时间</text>
              <text class="info-value">{{ formatDateTime(item.createdAt) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">发布者</text>
              <text class="info-value">{{ ownerName }}</text>
            </view>
          </view>

          <view v-if="canManage" class="detail-actions">
            <button
              class="m3-btn secondary"
              @tap="updateStatus(item.status === 'open' ? 'resolved' : 'open')"
            >
              {{ item.status === 'open' ? '标记完结' : '重新开启' }}
            </button>
            <button class="m3-btn danger" @tap="deleteItem">删除</button>
          </view>
        </view>

        <view class="m3-card block-card">
          <view class="block-title-row">
            <text class="block-title">联系方式</text>
          </view>
          <view v-if="contactLines.length" class="contact-list">
            <view v-for="line in contactLines" :key="line.label" class="contact-row">
              <view class="contact-main">
                <text class="contact-label">{{ line.label }}</text>
                <text class="contact-value">{{ line.value }}</text>
              </view>
              <button class="m3-btn text small-btn" @tap="copyText(line.value)">复制</button>
            </view>
          </view>
          <view v-else class="soft-empty">
            <text>暂无联系方式</text>
          </view>
        </view>

        <view v-if="canManage || matchLoading || matches.length" class="m3-card block-card">
          <view class="block-title-row">
            <text class="block-title">可能匹配</text>
            <text class="block-note">{{ matchNote }}</text>
          </view>

          <view v-if="matchLoading" class="soft-empty">
            <text>正在计算匹配</text>
          </view>
          <view v-else-if="matches.length === 0" class="soft-empty">
            <text>暂无匹配结果</text>
          </view>
          <view v-else class="match-list">
            <view
              v-for="match in matches"
              :key="match.item._id"
              class="match-item"
              @tap="goDetail(match.item._id)"
            >
              <view class="match-score">
                <text>{{ match.score }}</text>
              </view>
              <view class="match-main">
                <text class="match-title">{{ match.item.title }}</text>
                <text class="match-desc">{{ match.item.location || '地点待补充' }}</text>
                <text class="match-reason">{{ reasonsText(match) }}</text>
              </view>
              <text class="match-level">{{ matchLevelLabel(match.level) }}</text>
            </view>
          </view>
        </view>

        <view class="m3-card block-card">
          <view class="block-title-row">
            <text class="block-title">评论</text>
            <text class="block-note">{{ comments.length }} 条</text>
          </view>

          <view v-if="comments.length === 0" class="soft-empty">
            <text>暂无评论</text>
          </view>
          <view v-else class="comment-list">
            <view v-for="comment in comments" :key="comment._id" class="comment-item">
              <view class="comment-head">
                <view>
                  <text class="comment-user">{{ commentUser(comment) }}</text>
                  <text class="comment-time">{{ formatDateTime(comment.createdAt) }}</text>
                </view>
                <button
                  v-if="canDeleteComment(comment)"
                  class="m3-btn text small-btn"
                  @tap="deleteComment(comment)"
                >
                  删除
                </button>
              </view>
              <text class="comment-content">{{ comment.content }}</text>
            </view>
          </view>

          <view class="comment-form">
            <textarea
              class="m3-textarea comment-input"
              v-model="commentText"
              maxlength="240"
              placeholder="写下补充线索"
            />
            <button
              class="m3-btn comment-submit"
              :class="{ disabled: commentSubmitting }"
              :disabled="commentSubmitting"
              @tap="postComment"
            >
              {{ commentSubmitting ? '发送中' : '发送评论' }}
            </button>
          </view>
        </view>
      </block>

      <view v-else class="m3-card m3-empty">
        <text class="m3-empty-title">信息不存在</text>
        <button class="m3-btn secondary empty-action" @tap="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script>
import {
  request,
  getStoredUser,
  isLoggedIn,
  requireLogin
} from '../../common/request.js';
import {
  formatDateTime,
  itemTypeLabel,
  itemTypeTone,
  matchLevelLabel,
  resolveAssetUrl,
  statusLabel,
  toastError,
  userIdOf
} from '../../common/utils.js';

function confirmAction(title, content) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success(res) {
        resolve(Boolean(res.confirm));
      },
      fail() {
        resolve(false);
      }
    });
  });
}

export default {
  data() {
    return {
      id: '',
      loading: true,
      item: null,
      comments: [],
      matches: [],
      matchLoading: false,
      aiSummary: null,
      currentUser: null,
      commentText: '',
      commentSubmitting: false
    };
  },
  computed: {
    currentUserId() {
      return userIdOf(this.currentUser);
    },
    isAdmin() {
      return this.currentUser && this.currentUser.role === 'admin';
    },
    isOwner() {
      if (!this.item || !this.currentUserId) {
        return false;
      }
      return userIdOf(this.item.owner) === this.currentUserId;
    },
    canManage() {
      return this.isOwner || this.isAdmin;
    },
    ownerName() {
      if (this.item && this.item.owner && this.item.owner.username) {
        return this.item.owner.username;
      }
      return '匿名';
    },
    contactLines() {
      if (!this.item) {
        return [];
      }

      const owner = this.item.owner || {};
      const lines = [];
      if (this.item.contact) lines.push({ label: '发布备注', value: this.item.contact });
      if (owner.phone) lines.push({ label: '手机号', value: owner.phone });
      if (owner.wechat) lines.push({ label: '微信', value: owner.wechat });
      if (owner.college) lines.push({ label: '学院', value: owner.college });
      return lines;
    },
    matchNote() {
      if (!this.aiSummary) {
        return '';
      }
      if (this.aiSummary.failed) {
        return '规则匹配';
      }
      return `${this.matches.length} 条`;
    }
  },
  onLoad(options) {
    this.id = options && options.id ? options.id : '';
    this.currentUser = getStoredUser();
    this.loadAll();
  },
  onShow() {
    this.currentUser = getStoredUser();
  },
  methods: {
    async loadAll() {
      if (!this.id) {
        this.loading = false;
        return;
      }

      this.loading = true;
      try {
        await this.loadItem();
        await Promise.all([this.loadComments(), this.loadMatches()]);
      } finally {
        this.loading = false;
      }
    },
    async loadItem() {
      try {
        const res = await request({
          url: `/items/${this.id}`
        });
        this.item = res.data || null;
      } catch (error) {
        this.item = null;
        toastError(error, '详情加载失败');
      }
    },
    async loadComments() {
      try {
        const res = await request({
          url: `/items/${this.id}/comments`
        });
        this.comments = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        toastError(error, '评论加载失败');
      }
    },
    async loadMatches() {
      if (!isLoggedIn()) {
        return;
      }

      this.matchLoading = true;
      try {
        const res = await request({
          url: `/items/${this.id}/matches`,
          data: {
            minScore: 20,
            limit: 6,
            useAI: false
          }
        });
        const data = res.data || {};
        this.matches = Array.isArray(data.matches) ? data.matches : [];
        this.aiSummary = data.aiSummary || null;
      } catch (error) {
        const statusCode = Number(error.statusCode || 0);
        if (statusCode !== 401 && statusCode !== 403) {
          toastError(error, '匹配加载失败');
        }
      } finally {
        this.matchLoading = false;
      }
    },
    resolveImage(value) {
      return resolveAssetUrl(value);
    },
    previewImage(index) {
      if (!this.item || !this.item.images) return;
      const urls = this.item.images.map((image) => resolveAssetUrl(image));
      uni.previewImage({
        current: urls[index],
        urls
      });
    },
    async updateStatus(status) {
      try {
        const adminMode = this.isAdmin && !this.isOwner;
        const res = await request({
          url: adminMode ? `/admin/items/${this.id}/status` : `/items/${this.id}`,
          method: 'PUT',
          data: {
            status
          }
        });
        this.item = res.data || this.item;
        uni.showToast({
          title: '状态已更新',
          icon: 'success'
        });
      } catch (error) {
        toastError(error, '状态更新失败');
      }
    },
    async deleteItem() {
      const ok = await confirmAction('删除信息', '删除后不可恢复，确认继续？');
      if (!ok) return;

      try {
        const adminMode = this.isAdmin && !this.isOwner;
        await request({
          url: adminMode ? `/admin/items/${this.id}` : `/items/${this.id}`,
          method: 'DELETE'
        });
        uni.showToast({
          title: '已删除',
          icon: 'success'
        });
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index'
          });
        }, 300);
      } catch (error) {
        toastError(error, '删除失败');
      }
    },
    async postComment() {
      if (!requireLogin()) {
        return;
      }
      const content = this.commentText.trim();
      if (!content) {
        uni.showToast({ title: '请填写评论', icon: 'none' });
        return;
      }

      this.commentSubmitting = true;
      try {
        const res = await request({
          url: `/items/${this.id}/comments`,
          method: 'POST',
          data: {
            content
          }
        });
        if (res.data) {
          this.comments.push(res.data);
        }
        this.commentText = '';
      } catch (error) {
        toastError(error, '评论失败');
      } finally {
        this.commentSubmitting = false;
      }
    },
    async deleteComment(comment) {
      const ok = await confirmAction('删除评论', '确认删除这条评论？');
      if (!ok) return;

      try {
        await request({
          url: `/items/${this.id}/comments/${comment._id}`,
          method: 'DELETE'
        });
        this.comments = this.comments.filter((item) => item._id !== comment._id);
      } catch (error) {
        toastError(error, '删除评论失败');
      }
    },
    canDeleteComment(comment) {
      if (this.isAdmin) {
        return true;
      }
      return userIdOf(comment.user) === this.currentUserId;
    },
    commentUser(comment) {
      if (comment.user && comment.user.username) {
        return comment.user.username;
      }
      return '匿名';
    },
    reasonsText(match) {
      if (match.reasons && match.reasons.length) {
        return match.reasons.join('、');
      }
      return '文本特征接近';
    },
    copyText(value) {
      if (!value) return;
      uni.setClipboardData({
        data: value,
        success() {
          uni.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    },
    goDetail(id) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },
    goHome() {
      uni.switchTab({
        url: '/pages/index/index'
      });
    },
    formatDateTime,
    itemTypeLabel,
    itemTypeTone,
    matchLevelLabel,
    statusLabel
  }
};
</script>

<style>
.detail-loading {
  padding: 36rpx;
}

.gallery,
.gallery-fallback {
  width: 100%;
  height: 560rpx;
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: 100%;
}

.gallery-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #006a60;
  background: linear-gradient(135deg, #d7efe7 0%, #f4f7ea 100%);
  font-size: 48rpx;
  font-weight: 800;
}

.detail-main,
.block-card {
  margin-top: 24rpx;
  padding: 30rpx;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.detail-title {
  display: block;
  margin-top: 22rpx;
  color: #171d1b;
  font-size: 42rpx;
  font-weight: 780;
  line-height: 1.22;
}

.detail-desc {
  display: block;
  margin-top: 16rpx;
  color: #506059;
  font-size: 28rpx;
  line-height: 1.65;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 26rpx;
}

.info-item {
  width: 100%;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f0f6f1;
}

.info-label {
  display: block;
  color: #60706a;
  font-size: 23rpx;
}

.info-value {
  display: block;
  margin-top: 8rpx;
  color: #1f332d;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 1.4;
}

.detail-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.detail-actions .m3-btn {
  flex: 1;
}

.block-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.block-title {
  color: #171d1b;
  font-size: 32rpx;
  font-weight: 760;
}

.block-note {
  color: #60706a;
  font-size: 24rpx;
}

.contact-list,
.match-list,
.comment-list {
  margin-top: 18rpx;
}

.contact-row,
.match-item,
.comment-item {
  padding: 20rpx 0;
  border-top: 1rpx solid #e1e8e3;
}

.contact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.contact-main {
  flex: 1;
  min-width: 0;
}

.contact-label,
.comment-time {
  display: block;
  color: #60706a;
  font-size: 23rpx;
}

.contact-value {
  display: block;
  margin-top: 6rpx;
  color: #1f332d;
  font-size: 28rpx;
  font-weight: 700;
  overflow-wrap: break-word;
}

.small-btn {
  min-height: 56rpx;
  padding: 0 12rpx;
  font-size: 24rpx;
}

.soft-empty {
  padding: 34rpx 0 12rpx;
  color: #60706a;
  font-size: 25rpx;
  text-align: center;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.match-score {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 74rpx;
  height: 74rpx;
  border-radius: 999rpx;
  background: #cce8e1;
  color: #006a60;
  font-size: 28rpx;
  font-weight: 800;
}

.match-main {
  flex: 1;
  min-width: 0;
}

.match-title {
  display: block;
  color: #1f332d;
  font-size: 28rpx;
  font-weight: 750;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-desc,
.match-reason {
  display: block;
  margin-top: 6rpx;
  color: #60706a;
  font-size: 23rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-level {
  flex: 0 0 auto;
  color: #006a60;
  font-size: 23rpx;
  font-weight: 750;
}

.comment-head {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.comment-user {
  display: block;
  color: #1f332d;
  font-size: 27rpx;
  font-weight: 750;
}

.comment-content {
  display: block;
  margin-top: 14rpx;
  color: #40504a;
  font-size: 27rpx;
  line-height: 1.55;
}

.comment-form {
  margin-top: 24rpx;
}

.comment-input {
  min-height: 150rpx;
}

.comment-submit {
  width: 100%;
  margin-top: 16rpx;
}

.skeleton {
  border-radius: 999rpx;
  background: linear-gradient(90deg, #e2e9e4 0%, #f5faf5 50%, #e2e9e4 100%);
}

.skeleton.title {
  width: 52%;
  height: 38rpx;
}

.skeleton.line {
  width: 100%;
  height: 24rpx;
  margin-top: 26rpx;
}

.skeleton.short {
  width: 68%;
}

.empty-action {
  margin-top: 24rpx;
}

@media screen and (min-width: 768px) {
  .info-item {
    width: calc(50% - 8rpx);
  }

  .gallery,
  .gallery-fallback {
    height: 640rpx;
  }
}
</style>
