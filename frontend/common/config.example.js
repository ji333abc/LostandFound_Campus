// 配置说明：
// 1) 首次运行前，请复制本文件为 `config.js`
// 2) 支持通过项目根目录脚本 `node set-server-ip.js` 自动创建/更新 `config.js`

export const APP_CONFIG = {
  app: {
    name: '校园失物招领',
    homeSubtitle: '找回每一件重要的小物',
    loginSubtitle: '登录校园失物招领',
    registerSubtitle: '加入校园失物招领'
  },
  api: {
    // AUTO_MANAGED_BASE_URL: 可通过 `node set-server-ip.js` 自动替换
    baseUrl: 'http://localhost:3000',
    prefix: '/api',
    uploadPath: '/upload'
  },
  publish: {
    maxImages: 3
  }
};

export const API_BASE_URL = `${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.prefix}`;
export const API_UPLOAD_URL = `${API_BASE_URL}${APP_CONFIG.api.uploadPath}`;
export const STATIC_BASE_URL = APP_CONFIG.api.baseUrl;
export const MAX_UPLOAD_IMAGES = APP_CONFIG.publish.maxImages;
