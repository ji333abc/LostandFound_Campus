import { APP_CONFIG, STATIC_BASE_URL } from './config.js';

export const categories = APP_CONFIG.categories;

function pad2(value) {
  const normalized = String(value);
  return normalized.length >= 2 ? normalized : `0${normalized}`;
}

export function resolveAssetUrl(value) {
  if (!value) {
    return '';
  }

  if (/^(https?:|data:|blob:|file:)/i.test(value)) {
    return value;
  }

  return `${STATIC_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

export function itemTypeLabel(type) {
  return type === 'found' ? '招领' : '寻物';
}

export function itemTypeTone(type) {
  return type === 'found' ? 'tonal' : 'primary';
}

export function statusLabel(status) {
  return status === 'resolved' ? '已完结' : '进行中';
}

export function matchLevelLabel(level) {
  if (level === 'high') return '高匹配';
  if (level === 'medium') return '中匹配';
  if (level === 'low') return '低匹配';
  return '可参考';
}

export function formatDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return '';
  }

  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return '';
  }

  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`;
}

export function firstImage(item) {
  if (!item || !Array.isArray(item.images) || item.images.length === 0) {
    return '';
  }
  return resolveAssetUrl(item.images[0]);
}

export function userIdOf(value) {
  if (!value) {
    return '';
  }
  return value._id || value.id || value;
}

export function toastError(error, fallback) {
  const message =
    (error && error.data && error.data.message) ||
    (error && error.message) ||
    fallback ||
    '操作失败';

  uni.showToast({
    title: message,
    icon: 'none'
  });
}
