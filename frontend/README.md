# 校园失物招领前端（uni-app）

这是本项目的前端部分，基于 uni-app 开发，主要面向校园失物招领场景。

支持的核心功能包括：

- 用户注册、登录、退出登录
- 失物 / 招领信息发布
- 信息列表浏览、搜索与详情查看
- 评论互动
- 我的发布管理
- 管理员后台管理
- 图片上传
- 与后端 API 联调

---

## 项目结构

```text
frontend/
├─ common/                 # 公共方法与配置
│  ├─ config.example.js    # 前端配置示例（提交到仓库）
│  ├─ config.js            # 前端运行时配置（本地生成，不提交）
│  └─ request.js           # 请求封装
├─ custom-tab-bar/         # 自定义 tabBar
├─ pages/                  # 页面目录
├─ static/                 # 静态资源
├─ tools/                  # 前端辅助脚本
├─ App.vue
├─ main.js
├─ manifest.json
├─ pages.json
├─ uni.scss
└─ config.yaml             # 维护者查看/同步参考配置
```

---

## 运行环境

建议使用以下方式开发和运行：

- HBuilderX（推荐）
- uni-app 对应开发工具链
- 已启动的后端服务

---

## 本地运行

### 方式一：HBuilderX

1. 使用 HBuilderX 打开 `frontend/` 目录。
2. 运行到浏览器、真机或小程序模拟器。
3. 确认后端服务已经启动。
4. 确认前端接口地址与后端实际地址一致。

### 方式二：命令行

如果你已经安装并配置好 uni-app CLI，也可以按你当前模板支持的方式运行。

---

## 前端配置说明

前端运行时实际读取的是：

- `common/config.js`

首次使用前，请先从示例文件复制：

```bash
cp frontend/common/config.example.js frontend/common/config.js
```

当前默认配置关键项如下：

- `baseUrl`: `http://localhost:3000`
- `prefix`: `/api`
- `uploadPath`: `/upload`
- `maxImages`: `3`

接口基础地址会拼接为：

```text
http://localhost:3000/api
```

### 关于 `config.yaml`

项目中保留了 `config.yaml`，方便维护者查看和统一管理配置含义。

但需要注意：

> uni-app 前端运行时不会直接读取 `config.yaml`，实际生效的是 `common/config.js`。

所以如果你修改了接口地址，请优先检查：

- `frontend/common/config.js`

---

## 一键切换服务器地址

如果你部署到了服务器，可以使用项目根目录脚本快速切换地址：

- 脚本：`set-server-ip.js`

在项目根目录执行：

```bash
node set-server-ip.js <host>
```

也可以指定端口：

```bash
node set-server-ip.js <host> 8080
```

也支持直接传完整 URL：

```bash
node set-server-ip.js https://api.example.com
```

这个脚本会自动处理：

- `frontend/common/config.js` 中的前端接口地址（如不存在会从 `config.example.js` 自动创建）
- `backend/.env` 中的后端相关地址配置


修改后请重新运行前端，并按需重启后端。

---

## 主要接口约定

前端目前会用到的主要接口包括：

- `POST /auth/register` 用户注册
- `POST /auth/login` 用户登录
- `GET /auth/me` 获取当前用户信息
- `GET /items` 获取信息列表
- `GET /items/:id` 获取信息详情
- `POST /items` 发布信息
- `PUT /items/:id` 修改信息
- `DELETE /items/:id` 删除信息
- `GET /items/my` 获取我的发布
- `GET /items/:id/comments` 获取评论列表
- `POST /items/:id/comments` 发表评论
- `DELETE /items/:id/comments/:commentId` 删除评论
- `POST /upload` 上传图片
- `GET /admin/items` 管理员获取全部信息
- `PUT /admin/items/:id/status` 管理员修改状态
- `DELETE /admin/items/:id` 管理员删除信息
- `GET /notifications` 获取通知列表

---

## 关键实现说明

- 请求封装：`common/request.js`
- Token 本地缓存：`uni.setStorageSync('token', ...)`
- 用户信息缓存：`uni.setStorageSync('user', ...)`
- 静态资源访问基址来自 `common/config.js`
- 上传数量限制由配置项控制

---


## 常见问题

### 1. 页面能打开，但接口请求失败

请检查：

- 后端是否已启动
- `common/config.js` 中的 `baseUrl` 是否正确
- 后端端口是否为 `3000`
- 后端 CORS 是否允许当前前端地址访问

### 2. 上传图片失败

请检查：

- 后端上传接口是否正常
- 前端上传地址是否为 `/api/upload`
- 是否已登录

### 3. 修改了 `config.yaml` 但前端没生效

因为运行时实际读取的是 `common/config.js`，不是 `config.yaml`。

