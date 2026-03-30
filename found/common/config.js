// 配置说明：
// 1) 可编辑的配置统一维护在项目根目录 config.yaml
// 2) 本文件用于前端运行时读取（uni-app 默认不直接解析 yaml），请与 config.yaml 保持同步
// 3) 支持通过脚本 tools/set-server-ip.js 一键更新 api.baseUrl

export const APP_CONFIG = {
  app: {
    name: '校园失物招领',
    homeSubtitle: '找回每一件重要的小物',
    loginSubtitle: '登录校园失物招领',
    registerSubtitle: '加入校园失物招领'
  },
  api: {
    // AUTO_MANAGED_BASE_URL: 可通过 `node tools/set-server-ip.js` 自动替换
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
