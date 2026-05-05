import { API_BASE_URL, API_UPLOAD_URL } from './config.js';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function normalizePath(url) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function parseResponseData(data) {
  if (typeof data !== 'string') {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    return { message: data };
  }
}

function buildAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeAuthError(status, data, fallback) {
  if (status === 401) {
    clearSession();
    return '登录已过期，请重新登录';
  }
  return (data && data.message) || fallback;
}

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || '';
}

export function getStoredUser() {
  return uni.getStorageSync(USER_KEY) || null;
}

export function saveSession(token, user) {
  uni.setStorageSync(TOKEN_KEY, token);
  uni.setStorageSync(USER_KEY, user || null);
}

export function clearSession() {
  uni.removeStorageSync(TOKEN_KEY);
  uni.removeStorageSync(USER_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function currentRouteUrl() {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  if (!page) {
    return '/pages/index/index';
  }

  const options = page.options || (page.$page && page.$page.options) || {};
  const query = Object.keys(options)
    .filter((key) => options[key] !== undefined && options[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(options[key])}`)
    .join('&');

  return `/${page.route}${query ? `?${query}` : ''}`;
}

export function requireLogin() {
  if (isLoggedIn()) {
    return true;
  }

  const redirect = encodeURIComponent(currentRouteUrl());
  uni.navigateTo({
    url: `/pages/login/login?redirect=${redirect}`
  });
  return false;
}

export function request(options) {
  const method = String(options.method || 'GET').toUpperCase();
  const header = {
    'Content-Type': 'application/json',
    ...buildAuthHeader(),
    ...(options.header || {})
  };

  return new Promise((resolve, reject) => {
    uni.request({
      url: normalizePath(options.url),
      method,
      data: options.data || {},
      header,
      success(res) {
        const data = parseResponseData(res.data);
        const status = Number(res.statusCode || 0);

        if (status >= 200 && status < 300) {
          resolve(data);
          return;
        }

        reject({
          statusCode: status,
          data,
          message: normalizeAuthError(status, data, `请求失败：${status || '未知状态'}`)
        });
      },
      fail(error) {
        reject({
          message: error.errMsg || '网络连接失败',
          data: error
        });
      }
    });
  });
}

export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: API_UPLOAD_URL,
      filePath,
      name: 'file',
      header: buildAuthHeader(),
      success(res) {
        const data = parseResponseData(res.data);
        const status = Number(res.statusCode || 0);

        if (status >= 200 && status < 300) {
          resolve(data);
          return;
        }

        reject({
          statusCode: status,
          data,
          message: normalizeAuthError(status, data, `上传失败：${status || '未知状态'}`)
        });
      },
      fail(error) {
        reject({
          message: error.errMsg || '图片上传失败',
          data: error
        });
      }
    });
  });
}
