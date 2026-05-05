// 首次运行可复制为 config.js；也可使用项目根目录的 set-server-ip.js 自动生成。
export const APP_CONFIG = {
  app: {
    name: '校园失物招领',
    homeSubtitle: '找回每一件重要的小物'
  },
  api: {
    baseUrl: 'http://localhost:3000',
    prefix: '/api',
    uploadPath: '/upload'
  },
  publish: {
    maxImages: 3
  },
  categories: ['证件', '数码', '书籍', '生活用品', '服饰', '钥匙', '校园卡', '其他']
};

export const API_BASE_URL = `${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.prefix}`;
export const API_UPLOAD_URL = `${API_BASE_URL}${APP_CONFIG.api.uploadPath}`;
export const STATIC_BASE_URL = APP_CONFIG.api.baseUrl;
export const MAX_UPLOAD_IMAGES = APP_CONFIG.publish.maxImages;
