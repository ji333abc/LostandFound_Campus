<template>
  <view class="page" v-if="item">
    <!-- 顶部标题区 -->
    <view class="header">
      <view class="header-meta">
        <text class="type-emoji">{{ item.type === 'lost' ? '🔍' : '🎁' }}</text>
        <text class="type-text">{{ item.type === 'lost' ? '寻物启事' : '失物招领' }}</text>
        <view 
          :class="['status-badge', item.status === 'resolved' ? 'resolved' : 'open']"
        >
          {{ item.status === 'resolved' ? '已解决' : '进行中' }}
        </view>
      </view>
      <view class="title">{{ item.title }}</view>
      <view class="info-row">
        <text class="info-item" v-if="item.location">📍 {{ item.location }}</text>
        <text class="info-item" v-if="item.time">🕐 {{ formatTime(item.time) }}</text>
        <text class="info-item" v-if="item.category">🏷️ {{ item.category }}</text>
      </view>
    </view>

    <!-- 详细描述 -->
    <view class="section" v-if="item.description">
      <view class="section-label">详细描述</view>
      <view class="desc-content">{{ item.description }}</view>
    </view>

    <!-- 图片展示 -->
    <view class="section" v-if="item.images && item.images.length">
      <view class="section-label">相关图片</view>
      <view class="image-grid">
        <image
          v-for="(img, index) in item.images"
          :key="index"
          :src="img"
          class="detail-image"
          mode="aspectFill"
          @click="previewImage(index)"
        ></image>
      </view>
    </view>

    <!-- 可能匹配 -->
    <view class="section">
      <view class="section-label">{{ matchSectionTitle }}</view>
      <view class="match-summary" v-if="matchesSummary.returned > 0">
        共找到 {{ matchesSummary.returned }} 条候选结果
      </view>
      <view class="ai-summary" v-if="matches.length && aiSummary.enabled">
        <text v-if="!aiSummary.failed">AI智能匹配已复核 {{ aiSummary.reviewed || 0 }} / {{ aiSummary.requested || 0 }} 条候选</text>
        <text v-else>{{ aiSummary.message || 'AI智能匹配暂时不可用，当前展示规则匹配结果' }}</text>
      </view>

      <view v-if="matchesLoading" class="match-loading">
        <text class="match-loading-text">正在分析可能匹配项...</text>
      </view>

      <view v-else-if="matchesError" class="match-error">
        <text class="match-error-text">{{ matchesError }}</text>
        <view class="match-retry-btn" @click="fetchMatches">重试</view>
      </view>

      <view v-else-if="matches.length" class="match-list">
        <view
          v-for="match in visibleMatches"
          :key="match.item._id"
          class="match-card"
          @click="goDetail(match.item._id)"
        >
          <image
            v-if="match.item.images && match.item.images.length"
            :src="match.item.images[0]"
            class="match-thumb"
            mode="aspectFill"
          ></image>
          <view v-else class="match-thumb match-thumb-placeholder">{{ match.item.type === 'lost' ? '🔍' : '🎁' }}</view>

          <view class="match-main">
            <view class="match-top-row">
              <view class="match-title">{{ match.item.title }}</view>
              <view :class="['match-level-badge', match.level]">
                {{ getLevelText(match.level) }} {{ match.score }}分
              </view>
            </view>

            <view class="match-meta-row">
              <text class="match-meta" v-if="match.item.category">🏷️ {{ match.item.category }}</text>
              <text class="match-meta" v-if="match.item.location">📍 {{ match.item.location }}</text>
            </view>
            <view class="match-meta-row">
              <text class="match-meta" v-if="match.item.time">🕐 {{ formatTime(match.item.time) }}</text>
              <text class="match-meta" v-if="match.item.status === 'resolved'">已解决</text>
            </view>

            <view class="match-reasons" v-if="match.reasons && match.reasons.length">
              <text
                v-for="(reason, index) in match.reasons"
                :key="index"
                class="match-reason-tag"
              >{{ reason }}</text>
            </view>

            <view class="ai-review-box" v-if="match.aiReview && match.aiReview.reviewed">
              <view class="ai-review-head">
                <text class="ai-review-title">AI智能匹配</text>
                <text :class="['ai-confidence-badge', match.aiReview.confidence]">
                  {{ getAiMatchText(match.aiReview) }} · {{ getConfidenceText(match.aiReview.confidence) }}
                </text>
              </view>
              <view class="ai-review-score">AI判断分：{{ match.aiReview.score }}分</view>
              <view class="ai-review-reason" v-if="match.aiReview.reason">{{ match.aiReview.reason }}</view>
              <view class="ai-review-warning" v-if="match.aiReview.warning">{{ match.aiReview.warning }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="match-more-wrap" v-if="matches.length > initialMatchCount">
        <view class="match-more-btn" @click="toggleShowAllMatches">
          {{ showAllMatches ? '收起匹配结果' : `查看更多匹配（${matches.length}）` }}
        </view>
      </view>

      <view v-if="!matches.length" class="match-empty">
        <text class="empty-icon">🔎</text>
        <text class="empty-text">暂无可能匹配的信息</text>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="section contact-section">
      <view class="section-label">📞 联系方式</view>
      <view class="contact-card">
        <view class="contact-item" v-if="item.contact || item.owner?.phone">
          <text class="contact-label">电话</text>
          <text class="contact-value">{{ item.contact || item.owner?.phone }}</text>
          <view class="copy-btn" @click="copyContact(item.contact || item.owner?.phone)">
            复制
          </view>
        </view>
        <view class="contact-item" v-if="item.owner?.wechat">
          <text class="contact-label">微信</text>
          <text class="contact-value">{{ item.owner?.wechat }}</text>
          <view class="copy-btn" @click="copyContact(item.owner?.wechat)">
            复制
          </view>
        </view>
        <view class="contact-empty" v-if="!item.contact && !item.owner?.phone && !item.owner?.wechat">
          发布者未留下联系方式
        </view>
      </view>
    </view>

    <!-- 留言区 -->
    <view class="section">
      <view class="section-label">💬 留言</view>
      
      <view v-if="comments.length" class="comment-list">
        <view v-for="c in comments" :key="c._id" class="comment-item">
          <view class="comment-header">
            <text class="comment-user">{{ c.user?.username || '匿名' }}</text>
            <text class="comment-time">{{ formatTimeTime(c.createdAt) }}</text>
          </view>
          <view class="comment-text">{{ c.content }}</view>
        </view>
      </view>
      <view v-else class="comment-empty">
        <text class="empty-icon">💭</text>
        <text class="empty-text">还没有留言</text>
      </view>

      <view class="comment-input-area">
        <textarea
          class="comment-input"
          v-model="commentText"
          placeholder="留言与发布者沟通..."
          maxlength="200"
        ></textarea>
        <button class="send-btn" @click="submitComment">发送</button>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view v-if="isOwner && item.status !== 'resolved'" class="action-section">
      <button class="resolve-btn" @click="markResolved">
        {{ item.type === 'lost' ? '✓ 已找到，标记为已解决' : '✓ 已认领，标记为已解决' }}
      </button>
    </view>

    <view class="bottom-safe"></view>
  </view>
</template>

<script>
import { request, getItemDetail, getItemComments, getItemMatches } from '@/common/request.js';

export default {
  data() {
    return {
      item: null,
      user: null,
      comments: [],
      commentText: '',
      commentLoading: false,
      resolving: false,
      currentId: '',
      matches: [],
      matchesLoading: false,
      matchesError: '',
      matchesSummary: {},
      aiSummary: {},
      showAllMatches: false,
      initialMatchCount: 3
    }
  },
  computed: {
    isOwner() {
      if (!this.user || !this.item || !this.item.owner) return false;
      const owner = this.item.owner;
      const ownerId = typeof owner === 'string' ? owner : owner._id;
      return ownerId && this.user.id && ownerId === this.user.id;
    },
    matchSectionTitle() {
      if (!this.item) return '可能匹配';
      return this.item.type === 'lost' ? '可能匹配的招领信息' : '可能匹配的寻物信息';
    },
    visibleMatches() {
      if (this.showAllMatches) return this.matches;
      return this.matches.slice(0, this.initialMatchCount);
    }
  },
  onLoad(query) {
    this.user = uni.getStorageSync('user') || null;
    if (query.id) {
      this.currentId = query.id;
      this.fetchDetail(query.id);
    }
  },
  methods: {
    async fetchDetail(id) {
      try {
        const res = await getItemDetail(id);
        this.item = res.data;
        this.fetchComments();
        this.fetchMatches();
      } catch (e) {}
    },
    async fetchComments() {
      if (!this.item || !this.item._id) return;
      try {
        const res = await getItemComments(this.item._id);
        this.comments = res.data || [];
      } catch (e) {}
    },
    async fetchMatches() {
      if (!this.item || !this.item._id) return;
      this.matchesLoading = true;
      this.matchesError = '';
      this.showAllMatches = false;
      try {
        const res = await getItemMatches(this.item._id, {
          minScore: 20,
          limit: 10,
          useAI: true,
          aiLimit: 10
        });
        this.matches = res.data?.matches || [];
        this.matchesSummary = res.data?.summary || {};
        this.aiSummary = res.data?.aiSummary || {};
      } catch (e) {
        this.matches = [];
        this.matchesSummary = {};
        this.aiSummary = {};
        this.matchesError = e.data?.message || e.message || '匹配信息加载失败';
      } finally {
        this.matchesLoading = false;
      }
    },
    async submitComment() {
      if (!this.commentText.trim()) {
        return uni.showToast({ title: '请输入留言内容', icon: 'none' });
      }
      const token = uni.getStorageSync('token');
      if (!token) {
        return uni.showToast({ title: '请先登录', icon: 'none' });
      }
      if (this.commentLoading) return;
      this.commentLoading = true;
      try {
        const res = await request({
          url: `/items/${this.item._id}/comments`,
          method: 'POST',
          data: { content: this.commentText.trim() }
        });
        this.commentText = '';
        if (res.data) {
          this.comments.push(res.data);
        } else {
          this.fetchComments();
        }
      } catch (e) {
        const errorMsg = e.data?.message || e.message || '留言失败，请稍后重试';
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 2500
        });
      } finally {
        this.commentLoading = false;
      }
    },
    async markResolved() {
      if (!this.item || !this.item._id) return;
      if (this.resolving) return;
      this.resolving = true;
      try {
        await request({
          url: '/items/' + this.item._id,
          method: 'PUT',
          data: { status: 'resolved' }
        });
        this.item.status = 'resolved';
        uni.showToast({ title: '状态已更新', icon: 'success' });
      } catch (e) {
        const errorMsg = e.data?.message || e.message || '更新失败，请稍后重试';
        uni.showToast({ 
          title: errorMsg, 
          icon: 'none',
          duration: 2500
        });
      } finally {
        this.resolving = false;
      }
    },
    goDetail(id) {
      if (!id) return;
      if (id === this.currentId) return;
      uni.navigateTo({
        url: '/pages/detail/detail?id=' + id
      });
    },
    previewImage(index) {
      if (!this.item || !this.item.images) return;
      uni.previewImage({
        current: this.item.images[index],
        urls: this.item.images
      });
    },
    formatTime(t) {
      if (!t) return '';
      return String(t).slice(0, 10);
    },
    formatTimeTime(t) {
      if (!t) return '';
      const d = new Date(t);
      const y = d.getFullYear();
      const m = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      const hh = `${d.getHours()}`.padStart(2, '0');
      const mm = `${d.getMinutes()}`.padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}`;
    },
    getLevelText(level) {
      if (level === 'high') return '高匹配';
      if (level === 'medium') return '中匹配';
      if (level === 'low') return '低匹配';
      return '候选';
    },
    getConfidenceText(level) {
      if (level === 'high') return '高置信';
      if (level === 'medium') return '中置信';
      return '低置信';
    },
    getAiMatchText(aiReview) {
      return aiReview?.matched ? 'AI认为较可能匹配' : 'AI认为相似度较低';
    },
    toggleShowAllMatches() {
      this.showAllMatches = !this.showAllMatches;
    },
    copyContact(text) {
      if (!text) return;
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
        }
      });
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #FBFBFA;
  padding-bottom: 40rpx;
}

/* 顶部标题区 */
.header {
  padding: 60rpx 40rpx 40rpx;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.type-emoji {
  font-size: 40rpx;
}

.type-text {
  font-size: 26rpx;
  color: #787774;
}

.status-badge {
  padding: 6rpx 16rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  font-weight: 500;
  margin-left: auto;
}

.status-badge.open {
  background: #E3F2FD;
  color: #2383E2;
}

.status-badge.resolved {
  background: #E8F5E9;
  color: #0F7B6C;
}

.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #37352F;
  line-height: 1.3;
  margin-bottom: 20rpx;
  letter-spacing: -0.5rpx;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.info-item {
  font-size: 26rpx;
  color: #9B9A97;
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

.match-summary {
 font-size: 24rpx;
 color: #9B9A97;
 margin-bottom: 16rpx;
}

.ai-summary {
 margin-bottom: 16rpx;
 padding: 18rpx 20rpx;
 background: #F6FFED;
 border: 1rpx solid #B7EB8F;
 border-radius: 6rpx;
 color: #389E0D;
 font-size: 24rpx;
 line-height: 1.6;
}


.match-loading,
.match-error,
.match-empty {
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  padding: 32rpx 24rpx;
  text-align: center;
}

.match-loading-text,
.match-error-text {
  font-size: 28rpx;
  color: #787774;
}

.match-retry-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
  padding: 14rpx 28rpx;
  background: #37352F;
  color: #FFFFFF;
  border-radius: 6rpx;
  font-size: 24rpx;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.match-more-wrap {
  margin-top: 20rpx;
  display: flex;
  justify-content: center;
}

.match-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 28rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  color: #37352F;
  border-radius: 999rpx;
  font-size: 24rpx;
}

.match-more-btn:active {
  background: #F7F7F5;
}

.match-card {
  display: flex;
  gap: 20rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  padding: 24rpx;
}

.match-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.match-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: 6rpx;
  border: 1rpx solid #E9E9E7;
  flex-shrink: 0;
}

.match-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F4;
  font-size: 52rpx;
}

.match-main {
  flex: 1;
  min-width: 0;
}

.match-top-row {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  margin-bottom: 14rpx;
}

.match-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #37352F;
  line-height: 1.5;
}

.match-level-badge {
  flex-shrink: 0;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.match-level-badge.high {
  background: #FFF1F0;
  color: #CF1322;
}

.match-level-badge.medium {
  background: #E6F4FF;
  color: #1677FF;
}

.match-level-badge.low {
  background: #F5F5F5;
  color: #595959;
}

.match-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.match-meta {
  font-size: 24rpx;
  color: #9B9A97;
}

.match-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 12rpx;
}

.match-reason-tag {
 padding: 8rpx 14rpx;
 background: #F7F7F5;
 border-radius: 999rpx;
 color: #5F5E5B;
 font-size: 22rpx;
}

.ai-review-box {
 margin-top: 16rpx;
 padding: 18rpx 20rpx;
 background: #F9F0FF;
 border: 1rpx solid #D3ADF7;
 border-radius: 6rpx;
}

.ai-review-head {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 16rpx;
 margin-bottom: 10rpx;
}

.ai-review-title {
 font-size: 24rpx;
 font-weight: 600;
 color: #531DAB;
}

.ai-confidence-badge {
 padding: 8rpx 14rpx;
 border-radius: 999rpx;
 font-size: 20rpx;
 font-weight: 600;
}

.ai-confidence-badge.high {
 background: #FFF1F0;
 color: #CF1322;
}

.ai-confidence-badge.medium {
 background: #E6F4FF;
 color: #1677FF;
}

.ai-confidence-badge.low {
 background: #F5F5F5;
 color: #595959;
}

.ai-review-score {
 font-size: 22rpx;
 color: #722ED1;
 margin-bottom: 8rpx;
}

.ai-review-reason {
 font-size: 24rpx;
 color: #37352F;
 line-height: 1.7;
}

.ai-review-warning {
 margin-top: 8rpx;
 font-size: 22rpx;
 color: #8C8C8C;
 line-height: 1.6;
}


/* 描述内容 */
.desc-content {
  font-size: 30rpx;
  color: #37352F;
  line-height: 2;
  white-space: pre-wrap;
}
/* 图片网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.detail-image {
  width: 100%;
  height: 320rpx;
  border-radius: 6rpx;
  border: 1rpx solid #E9E9E7;
}

/* 联系方式 */
.contact-section {
  margin-bottom: 48rpx;
}

.contact-card {
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  padding: 24rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F5F5F4;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-label {
  font-size: 26rpx;
  color: #9B9A97;
  width: 100rpx;
}

.contact-value {
  flex: 1;
  font-size: 30rpx;
  font-weight: 500;
  color: #37352F;
}

.copy-btn {
  padding: 12rpx 24rpx;
  background: #37352F;
  color: #FFFFFF;
  border-radius: 4rpx;
  font-size: 24rpx;
  transition: all 0.2s;
}

.copy-btn:active {
  background: #57534E;
}

.contact-empty {
  text-align: center;
  padding: 40rpx;
  color: #9B9A97;
  font-size: 28rpx;
}
/* 评论区 */
.comment-list {
  margin-bottom: 32rpx;
}

.comment-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #F5F5F4;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.comment-user {
  font-size: 26rpx;
  font-weight: 500;
  color: #37352F;
}

.comment-time {
  font-size: 24rpx;
  color: #9B9A97;
}

.comment-text {
  font-size: 28rpx;
  color: #37352F;
  line-height: 1.8;
}

.comment-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #9B9A97;
}

.comment-input-area {
  margin-top: 24rpx;
}

.comment-input {
  width: 100%;
  padding: 24rpx;
  background: #FFFFFF;
  border: 1rpx solid #E9E9E7;
  border-radius: 6rpx;
  font-size: 28rpx;
  color: #37352F;
  min-height: 160rpx;
  line-height: 1.8;
  margin-bottom: 16rpx;
  transition: all 0.2s;
}

.comment-input::placeholder {
  color: #9B9A97;
}

.comment-input:focus {
  border-color: #2383E2;
  box-shadow: 0 0 0 6rpx rgba(35, 131, 226, 0.1);
}

.send-btn {
  width: 100%;
  padding: 24rpx;
  background: #37352F;
  color: #FFFFFF;
  border-radius: 6rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s;
}

.send-btn:active {
  background: #57534E;
  transform: translateY(1rpx);
}
/* 操作按钮 */
.action-section {
  padding: 0 40rpx;
  margin-top: 60rpx;
}

.resolve-btn {
  width: 100%;
  padding: 28rpx;
  background: #0F7B6C;
  color: #FFFFFF;
  border-radius: 6rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s;
}

.resolve-btn:active {
  background: #0d6b5e;
  transform: translateY(1rpx);
}

.bottom-safe {
  height: 40rpx;
}
</style>