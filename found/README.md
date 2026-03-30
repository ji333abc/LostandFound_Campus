# 校园失物招领（uni-app）

一个基于 uni-app 的校园失物招领前端项目，支持：

- 用户注册 / 登录
- 失物信息发布与列表浏览
- 详情查看、留言互动
- 我的发布管理
- 管理员后台（状态更新、删除）

---

## 目录结构

```text
.
├─ common/
│  ├─ request.js        # 请求封装
│  └─ config.js         # 前端运行时配置（需与 config.yaml 保持同步）
├─ pages/
│  ├─ index/            # 首页
│  ├─ publish/          # 发布页
│  ├─ detail/           # 详情页
│  ├─ my/               # 我的
│  ├─ login/            # 登录
│  ├─ register/         # 注册
│  └─ admin/            # 管理后台
├─ config.yaml          # 可编辑配置（给维护者修改）
├─ pages.json
├─ main.js
└─ App.vue
```

---

## 可修改配置

你可以在项目根目录的 `config.yaml` 中修改：

- 应用名称与文案
- API 地址与前缀
- 上传接口路径
- 发布页最大图片数量

示例：

```yaml config.yaml
app:
  name: "校园失物招领"
  homeSubtitle: "找回每一件重要的小物"
  loginSubtitle: "登录校园失物招领"
  registerSubtitle: "加入校园失物招领"

api:
  baseUrl: "http://localhost:3000"
  prefix: "/api"
  uploadPath: "/upload"

publish:
  maxImages: 3
```

> 注意：uni-app 前端运行时默认不直接解析 yaml。当前项目通过 `common/config.js` 供代码读取，因此请**同步修改** `common/config.js` 中对应值。

---

## 接口说明（前端约定）

基础地址：`{baseUrl}{prefix}`，如 `http://localhost:3000/api`

常用接口：

- `POST /auth/login`
- `POST /auth/register`
- `GET /items`
- `POST /items`
- `GET /items/:id`
- `PUT /items/:id`
- `GET /items/:id/comments`
- `POST /items/:id/comments`
- `GET /admin/items`
- `PUT /admin/items/:id/status`
- `DELETE /admin/items/:id`
- `POST /upload`（上传）

---

## 一键替换服务器地址（上线部署推荐）

为了把本地 `localhost` 快速切换到线上服务器地址，项目已提供脚本：

- 脚本：`tools/set-server-ip.js`
- 作用：自动更新 `common/config.js` 中的 `APP_CONFIG.api.baseUrl`

在 `found/` 目录执行：

```bash
node tools/set-server-ip.js 8.134.12.34
```

默认会设置为：`http://8.134.12.34:3000`

也可以自定义端口：

```bash
node tools/set-server-ip.js 8.134.12.34 8080
```

也支持直接传完整 URL：

```bash
node tools/set-server-ip.js https://api.example.com
```

执行完成后，重新运行/打包前端即可生效。

> 同时建议把后端 `.env` 中的 `BASE_URL` 改为线上可访问地址，避免 AI 识别等依赖地址的功能出现不一致。

---

## 本地运行

### 方式一：HBuilderX（推荐）

1. 用 HBuilderX 打开项目目录。
2. 运行到浏览器或小程序模拟器。
3. 确保后端服务已启动，并与 `config.yaml` / `common/config.js` 中的 API 地址一致。

### 方式二：命令行（如已配置 uni-app CLI）

按你的 uni-app 工程配置执行对应命令（不同模板命令可能不同）。

---

## 关键实现说明

- 请求统一封装在 `common/request.js`
- Token 存储在本地缓存：`uni.setStorageSync('token', ...)`
- 登录用户信息缓存：`uni.setStorageSync('user', ...)`
- 发布页上传限制与上传地址来自配置文件

---

## 后续建议

为避免每次手动同步 `config.yaml` 与 `common/config.js`，建议新增一个构建前脚本：

- 读取 `config.yaml`
- 自动生成 `common/config.js`

如果你需要，我可以下一步直接帮你把这个自动同步脚本也补上。