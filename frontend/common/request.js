// common/request.js
import { API_BASE_URL } from '@/common/config.js';

const BASE_URL = API_BASE_URL;

export function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': uni.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          // 不在这里显示 toast，让调用方决定如何处理错误
          reject(res);
        }
      },
      fail: (err) => {
        // 不在这里显示 toast，让调用方决定如何处理错误
        reject(err);
      }
    });
  });
}

export function getItemDetail(id) {
  return request({
    url: `/items/${id}`
  });
}

export function getItemComments(id) {
  return request({
    url: `/items/${id}/comments`
  });
}

export function getItemMatches(id, params = {}) {
  return request({
    url: `/items/${id}/matches`,
    data: params
  });
}

export function getMyItems() {
  return request({
    url: '/items/my'
  });
}

export function getMyNotifications(params = {}) {
  return request({
    url: '/notifications',
    data: params
  });
}

export function markNotificationRead(id) {
  return request({
    url: `/notifications/${id}/read`,
    method: 'PUT'
  });
}

export function markAllNotificationsRead() {
  return request({
    url: '/notifications/read-all',
    method: 'PUT'
  });
}