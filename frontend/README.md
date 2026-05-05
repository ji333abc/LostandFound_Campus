# 校园失物招领前端

这是校园失物招领系统的 uni-app 前端，使用 Vue 3 和 Material Design 3 风格实现，目标运行端包括 H5、App 和常见小程序端。

## 目录结构

```text
frontend/
  App.vue                    # 全局样式、Material 3 基础组件样式
  main.js                    # uni-app 入口
  pages.json                 # 页面路由、导航栏、tabBar 配置
  manifest.json              # 应用与各平台配置
  common/
    config.example.js        # 前端配置示例
    config.js                # 本地实际配置，已被 git 忽略
    request.js               # 请求、上传、登录态封装
    utils.js                 # 日期、图片路径、标签等工具函数
  custom-tab-bar/index.vue   # 自定义底部导航
  pages/
    index/index.vue          # 首页列表、搜索、筛选
    publish/publish.vue      # 发布信息、图片上传、AI 识别
    detail/detail.vue        # 详情、联系方式、评论、匹配结果
    my/my.vue                # 我的、通知摘要、我的发布
    notifications/notifications.vue # 通知列表
    login/login.vue          # 登录
    register/register.vue    # 注册
    admin/items.vue          # 管理员信息管理
```

## 运行方式

1. 用 HBuilderX 打开 `frontend/` 目录。
2. 确认 `frontend/common/config.js` 存在。
3. 修改 `config.js` 里的 `baseUrl`，让它指向后端服务。
4. 在 HBuilderX 中运行到 H5、App 或目标小程序。

项目根目录提供了同步脚本，可同时更新前端服务地址和后端 `.env`：

```bash
node set-server-ip.js 127.0.0.1 3000
```

也可以传入局域网 IP，方便手机或真机调试：

```bash
node set-server-ip.js 192.168.1.10 3000
```

## 配置说明

`frontend/common/config.js` 示例：

```js
export const APP_CONFIG = {
  api: {
    baseUrl: 'http://localhost:3000',
    prefix: '/api',
    uploadPath: '/upload'
  },
  publish: {
    maxImages: 3
  }
};
```

常用导出：

- `API_BASE_URL`：普通接口地址，例如 `http://localhost:3000/api`
- `API_UPLOAD_URL`：图片上传地址，例如 `http://localhost:3000/api/upload`
- `STATIC_BASE_URL`：图片静态资源基地址
- `MAX_UPLOAD_IMAGES`：发布页最多上传图片数量

## 已接入功能

- 首页信息流、关键词搜索、类型筛选、分类筛选
- 登录、注册、登录态本地保存
- 发布寻物或招领信息
- 图片上传，最多 3 张
- AI 图片识别，支持简略和详细两种描述
- 详情页查看联系方式、评论和可能匹配项
- 我的页面查看通知摘要和我的发布
- 通知列表、标记已读、全部已读
- 管理员信息管理、状态更新和删除

## 接口约定

前端请求统一走 `common/request.js`：

- 普通请求使用 `request(options)`
- 图片上传使用 `uploadImage(filePath)`
- JWT 存储在 `uni` storage 的 `token`
- 登录用户信息存储在 `user`
- 接口返回 `401` 时会清理本地登录态

后端接口前缀为 `/api`，主要接口包括：

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/items`
- `POST /api/items`
- `POST /api/upload`
- `POST /api/ai/recognize`
- `GET /api/notifications`

## H5 调试提示

- H5 白屏时，先检查 `index.html` 是否保留了 `<script type="module" src="/main.js"></script>`。
- H5 请求失败时，检查 `config.js` 的 `baseUrl` 和后端 CORS 配置。
- 图片上传提示登录过期时，重新登录后再上传。
- 真机访问本机后端时，不要使用 `localhost`，请使用电脑局域网 IP。

## 注意事项

- `frontend/common/config.js` 是本地配置文件，不提交到 git。
- `frontend/unpackage/` 是 HBuilderX 编译产物，不提交到 git。
- 前端不依赖额外 UI 框架，主要使用 uni-app 原生组件和本地样式。
- AI 识别需要后端配置对应的模型 API Key。
