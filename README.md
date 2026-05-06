# 校园失物招领系统

一个基于 **uni-app + Node.js + Express + MongoDB** 的前后端分离项目，面向校园失物招领场景。

---

## 项目简介

本项目主要用于实现校园失物与招领信息的发布、浏览和管理，适合作为课程设计、毕业设计或全栈练习项目。

项目分为两个部分：
- `frontend/`：前端（uni-app）
- `backend/`：后端（Node.js + Express）

---

## 功能模块

- 用户注册与登录
- 失物 / 招领信息发布
- 信息列表与详情查看
- 评论互动
- 我的发布管理
- 通知提醒
- 图片上传
- 管理员管理
- AI 图片识别辅助描述

---

## 技术栈

### 前端
- uni-app
- Vue
- HBuilderX / uni-app 工具链

### 后端
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Multer
- dotenv
- bcryptjs
- cors

---

## 项目结构

```text
.
├─ frontend/               # 前端项目（uni-app）
├─ backend/                # 后端项目（Node.js + Express）
├─ set-server-ip.js        # 一键切换前端访问后端地址脚本
├─ .gitignore
└─ README.md
```

---

## 快速开始

### 1. 启动后端

进入后端目录：

```bash
cd backend
```

安装依赖：

```bash
npm install
```

配置环境变量：

1. 复制示例文件
2. 重命名为 `.env`
3. 按需修改数据库、端口、JWT 密钥等配置

可参考：

```text
backend/.env.example
```

启动后端：

```bash
npm run dev
```

如果你的项目没有配置 `dev` 脚本，也可以使用：

```bash
npm start
```

---

### 2. 启动前端

使用 **HBuilderX** 打开：

```text
frontend/
```

前端接口配置文件位于：

```text
frontend/common/config.js
```

首次运行前，请先复制示例配置：

```bash
cp frontend/common/config.example.js frontend/common/config.js
```

默认接口地址通常类似：

```text
http://localhost:3000/api
```

请确保这里的地址与后端服务保持一致。

---

## 地址配置脚本

项目根目录提供了一个脚本，用于统一修改前后端的服务地址：

```bash
node set-server-ip.js <host> [port]
```

`<host>` 是前端访问后端用的地址，例如本机调试用 `localhost`，手机真机调试用电脑在同一 Wi-Fi 下的 IPv4（如 `192.168.1.23`），公网部署用服务器 IP 或域名。

脚本只会自动更新：
- `frontend/common/config.js`（如不存在会从 `config.example.js` 自动创建）

后端端口请与 `backend/.env` 中的 `PORT` 保持一致；如果需要修改后端监听端口、`HOST` 或跨域配置，请手动修改 `backend/.env` 后重启后端。

---

## 管理员角色设置脚本

后端提供了管理员权限设置工具：

```bash
node backend/set-admin.js 用户名
```

示例：

```bash
node backend/set-admin.js test
```

将用户设置回普通用户：

```bash
node backend/set-admin.js test user
```

---

## 文档说明

更多说明可查看：

- 前端文档：`frontend/README.md`
- 后端文档：`backend/README-backend.md`
