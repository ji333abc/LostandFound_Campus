<script>
export default {
  onLaunch() {
    // App lifecycle kept intentionally small; pages own their data loading.
  }
};
</script>

<style>
page {
  min-height: 100%;
  background: #f8faf6;
  color: #171d1b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 28rpx;
}

page,
view,
text,
input,
textarea,
button,
scroll-view,
picker,
image {
  box-sizing: border-box;
}

button {
  padding: 0;
  margin: 0;
  line-height: 1;
  background: transparent;
}

button::after {
  border: 0;
}

input,
textarea {
  color: #171d1b;
}

.m3-page {
  min-height: 100vh;
  padding: 28rpx;
  padding-bottom: calc(36rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 10% 0%, rgba(0, 106, 96, 0.08), transparent 36%),
    linear-gradient(180deg, #f8faf6 0%, #eff5ef 100%);
}

.tab-page {
  padding-bottom: calc(176rpx + env(safe-area-inset-bottom));
}

.m3-shell {
  width: 100%;
  max-width: 1180rpx;
  margin: 0 auto;
}

.m3-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1rpx solid rgba(111, 121, 116, 0.18);
  border-radius: 28rpx;
  box-shadow: 0 18rpx 46rpx rgba(20, 48, 42, 0.08);
}

.m3-surface {
  background: rgba(243, 249, 244, 0.94);
  border: 1rpx solid rgba(111, 121, 116, 0.16);
  border-radius: 32rpx;
}

.m3-title {
  display: block;
  color: #171d1b;
  font-size: 44rpx;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1.16;
}

.m3-subtitle {
  display: block;
  margin-top: 10rpx;
  color: #5d6b66;
  font-size: 26rpx;
  line-height: 1.55;
}

.m3-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin: 34rpx 4rpx 18rpx;
}

.m3-section-title text:first-child {
  color: #171d1b;
  font-size: 32rpx;
  font-weight: 700;
}

.m3-section-title text:last-child {
  color: #60706a;
  font-size: 24rpx;
}

.m3-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #e5f0eb;
  color: #36524b;
  font-size: 24rpx;
  font-weight: 600;
  white-space: nowrap;
}

.m3-chip.primary {
  background: #006a60;
  color: #ffffff;
}

.m3-chip.warn {
  background: #ffdad6;
  color: #8c1d18;
}

.m3-chip.tonal {
  background: #cce8e1;
  color: #00201c;
}

.m3-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 80rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  color: #ffffff;
  background: #006a60;
  font-size: 28rpx;
  font-weight: 700;
}

.m3-btn.secondary {
  color: #006a60;
  background: #cce8e1;
}

.m3-btn.text {
  min-height: 64rpx;
  padding: 0 18rpx;
  color: #006a60;
  background: transparent;
}

.m3-btn.danger {
  color: #ffffff;
  background: #ba1a1a;
}

.m3-btn[disabled],
.m3-btn.disabled {
  color: #8b9691;
  background: #dfe6e1;
}

.m3-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  border-radius: 999rpx;
  color: #006a60;
  background: #cce8e1;
  font-size: 34rpx;
  font-weight: 800;
}

.m3-field {
  margin-top: 26rpx;
}

.m3-label {
  display: block;
  margin-bottom: 12rpx;
  color: #3f4d48;
  font-size: 25rpx;
  font-weight: 700;
}

.m3-input,
.m3-textarea,
.m3-picker {
  width: 100%;
  min-height: 92rpx;
  padding: 0 28rpx;
  border: 1rpx solid #c1ccc6;
  border-radius: 24rpx;
  background: #ffffff;
  color: #171d1b;
  font-size: 28rpx;
}

.m3-textarea {
  min-height: 190rpx;
  padding-top: 24rpx;
  line-height: 1.55;
}

.m3-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m3-segment {
  display: flex;
  gap: 8rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: #e4ebe6;
}

.m3-segment-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 68rpx;
  border-radius: 999rpx;
  color: #4d5c57;
  font-size: 26rpx;
  font-weight: 700;
}

.m3-segment-item.active {
  color: #ffffff;
  background: #006a60;
  box-shadow: 0 8rpx 18rpx rgba(0, 106, 96, 0.22);
}

.m3-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320rpx;
  padding: 42rpx;
  color: #60706a;
  text-align: center;
}

.m3-empty-title {
  color: #243832;
  font-size: 30rpx;
  font-weight: 750;
}

.m3-empty-desc {
  margin-top: 12rpx;
  color: #66766f;
  font-size: 25rpx;
  line-height: 1.55;
}

.m3-row {
  display: flex;
  align-items: center;
}

.m3-row.between {
  justify-content: space-between;
}

.m3-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 22rpx;
}

.m3-grid-item {
  width: 100%;
}

@media screen and (min-width: 768px) {
  .m3-page {
    padding-left: 44rpx;
    padding-right: 44rpx;
  }

  .m3-grid-item {
    width: calc(50% - 11rpx);
  }
}

@media screen and (min-width: 1180px) {
  .m3-grid-item {
    width: calc(33.333% - 16rpx);
  }
}
</style>
