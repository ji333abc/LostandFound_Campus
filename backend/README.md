# 校园失物招领后端（Node.js + Express + MongoDB）

这是本项目的后端部分，负责提供用户认证、失物信息管理、评论、通知、上传和管理员接口。

---

## 技术栈

- Node.js
- Express
- MongoDB + Mongoose
- JWT 鉴权
- Multer 文件上传
- bcryptjs 密码加密
- dotenv 环境变量管理

---

## 项目结构

```text
backend/
├─ middlewares/          # 鉴权与权限中间件
├─ models/               # 数据模型
├─ routes/               # 接口路由
├─ uploads/              # 上传文件目录（运行时生成）
├─ app.js                # 应用入口
├─ package.json
├─ .env.example          # 环境变量示例
├─ .env.local.example    # 本地环境变量示例
├─ backend.config.yaml   # 配置说明示例
└─ set-admin.js          # 设置管理员脚本
```

---

## 已实现功能

- 用户注册、登录、获取当前用户信息
- 失物 / 招领信息的发布、修改、删除、查询
- 我的发布列表
- 评论列表、发表评论、删除评论
- 图片上传
- 管理员查看全部信息、修改状态、删除信息
- 管理员查看用户列表、修改用户角色
- 通知列表、单条已读、全部已读
- AI 识别接口

---

## 安装依赖

进入后端目录后执行：

```bash
npm install
```

---

## 环境变量配置

后端运行依赖 `.env` 或其他指定环境文件。

项目中已经提供示例文件，建议你复制后再填写自己的配置。

### 常见做法

直接复制示例文件：

```bash
cp .env.example .env
```

然后按需修改 `.env` 中的配置，再启动项目。

### 环境变量说明 

- `MONGODB_URI`：MongoDB 连接字符串（本地常用：`mongodb://127.0.0.1:27017/campus_lost_found`）
- `JWT_SECRET`：JWT 签名密钥（必填，不能为空）
- `PORT`：后端服务监听端口（默认 `3000`）
- `HOST`：后端服务监听地址（推荐 `0.0.0.0`，允许外部访问）
- `BASE_URL`：后端对外访问地址（用于拼接图片等完整链接）
- `CORS_ORIGIN`：允许跨域访问的前端来源（开发可用 `*`，生产建议填写前端域名）

> `HOST + PORT` 用于“服务监听”；`BASE_URL` 用于“告诉前端如何访问后端”。
>
> 示例：服务监听 `0.0.0.0:3000`，但对外通过域名访问时，`BASE_URL` 可以写成 `https://example.com`。

AI 相关（按需配置）：

- `OPENAI_API_KEY`：OpenAI 接口密钥（图片识别能力）
- `OPENAI_API_ENDPOINT`：OpenAI 接口地址
- `OPENAI_MODEL`：OpenAI 模型名称
- `MATCH_AI_PROVIDER`：匹配 AI 提供方（示例：`anthropic`）
- `MATCH_AI_API_KEY`：匹配 AI 接口密钥
- `MATCH_AI_API_ENDPOINT`：匹配 AI 接口地址
- `MATCH_AI_MODEL`：匹配 AI 模型名称
- `MATCH_AI_MAX_TOKENS`：匹配 AI 返回长度上限

### 启动前最重要的一项

如果没有配置 `JWT_SECRET`，服务会直接启动失败。

---

## 启动项目

### 开发模式

```bash
npm run dev
```

### 使用本地环境文件启动

```bash
npm run dev:local
```

### 生产/普通启动

```bash
npm start
```

### 使用指定环境文件启动

```bash
npm run start:local
npm run start:server
```

---

## 接口前缀

当前后端在 `app.js` 中注册的统一前缀为：

```text
/api
```

因此本地默认基础地址通常为：

```text
http://localhost:3000/api
```

---

## 主要接口

### 认证相关

- `POST /api/auth/register` 注册
- `POST /api/auth/login` 登录
- `GET /api/auth/me` 获取当前用户信息

### 失物信息相关

- `GET /api/items` 获取列表
- `GET /api/items/my` 获取我的发布
- `POST /api/items` 发布信息
- `GET /api/items/:id` 获取详情
- `PUT /api/items/:id` 更新信息
- `DELETE /api/items/:id` 删除信息
- `GET /api/items/:id/matches` 获取匹配结果

### 评论相关

- `GET /api/items/:id/comments` 获取评论列表
- `POST /api/items/:id/comments` 发表评论
- `DELETE /api/items/:id/comments/:commentId` 删除评论

### 上传相关

- `POST /api/upload` 上传文件

### 管理员相关

- `GET /api/admin/users` 获取用户列表
- `PUT /api/admin/users/:id/role` 修改用户角色
- `GET /api/admin/items` 获取全部物品信息
- `PUT /api/admin/items/:id/status` 修改信息状态
- `DELETE /api/admin/items/:id` 删除信息

### 通知相关

- `GET /api/notifications` 获取通知列表
- `PUT /api/notifications/:id/read` 标记单条已读
- `PUT /api/notifications/read-all` 全部已读

### AI 相关

- `POST /api/ai/recognize` AI 图片识别

---

## 与前端联调

请确保前后端配置一致：

- 后端端口：默认 `3000`
- 后端接口前缀：`/api`
- 前端配置文件：`frontend/common/config.js`

前端默认会请求：

```text
http://localhost:3000/api
```

如果你改了后端地址，也要同步修改前端。

你也可以在项目根目录使用：

```bash
node set-server-ip.js <host>
```

自动同步前后端相关地址。

---

## 管理员说明

项目中有一个辅助脚本：

- `set-admin.js`

通常用于把指定用户设置为管理员或恢复普通用户。

在使用前请先确认：

- 数据库已连接成功
- 目标用户已经注册
- 当前环境变量配置正确
- 命令示例：`node set-admin.js test`
- 恢复普通用户：`node set-admin.js test user`

---



## 关于 `backend.config.yaml`

当前项目真正运行主要依赖的是环境变量和 `app.js`。


---

## 常见问题

### 1. 服务启动失败并提示 `JWT_SECRET` 未设置

说明你还没有正确配置环境变量文件，请先补上 `JWT_SECRET`。

### 2. 前端请求后端失败

请检查：

- 后端是否已经启动
- 端口是否正确
- 前端 `baseUrl` 是否正确
- `CORS_ORIGIN` 是否允许当前前端地址访问

### 3. 图片访问失败

请检查：

- `uploads/` 目录是否存在
- 后端是否正确暴露了 `/uploads` 静态目录
- 数据库存储的图片地址是否正确