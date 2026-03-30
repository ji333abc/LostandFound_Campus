# 校园失物招领系统

一个基于 **uni-app + Node.js + Express + MongoDB** 的前后端分离项目，面向校园失物招领场景，支持用户发布失物/招领信息、浏览详情、评论互动、消息通知、图片上传以及管理员管理等功能。

适合作为：
- 课程设计 / 毕业设计
- 全栈项目练习
- 校园服务类应用原型
- 项目展示作品

---

## 项目预览

本项目采用前后端分离结构：
- `frontend/`：uni-app 前端工程
- `backend/`：Node.js 后端服务

---

## 功能模块

### 用户端
- 用户注册与登录
- 发布失物信息
- 发布招领信息
- 信息列表浏览
- 信息详情查看
- 评论与互动
- 我的发布管理
- 通知消息提醒
- 图片上传
- AI 图片识别辅助描述

### 管理端
- 管理员身份设置
- 用户/信息管理（按后端接口能力扩展）
- 内容审核与维护基础支持

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
├─ set-server-ip.js        # 一键同步前后端服务地址脚本
├─ .gitignore
└─ README.md
```

---

## 快速开始

## 1. 启动后端

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

## 2. 启动前端

使用 **HBuilderX** 打开：

```text
frontend/
```

前端实际接口配置文件位于：

```text
frontend/common/config.js
```

默认接口地址通常类似：

```text
http://localhost:3000/api
```

请确保这里的地址与后端服务保持一致。

---

## 服务器地址同步脚本

项目根目录提供了一个快捷脚本，用于统一修改前后端的服务地址：

```bash
node set-server-ip.js 8.134.12.34
```

也支持以下写法：

```bash
node set-server-ip.js 8.134.12.34 8080
node set-server-ip.js https://api.example.com
node set-server-ip.js 8.134.12.34 3000 .env.server
node set-server-ip.js 8.134.12.34 3000 .env.server http://localhost:5173
```

该脚本会自动更新：
- `frontend/common/config.js`
- `backend/.env` 或指定环境文件

适合本地调试、部署到服务器、切换接口地址时使用。

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

更多说明请查看子目录文档：

- 前端文档：`frontend/README.md`
- 后端文档：`backend/README-backend.md`

---

## 提交到 GitHub 时通常不上传的内容

以下内容通常不建议提交到仓库：
- `backend/node_modules/`
- `backend/uploads/`
- `backend/.env`
- `backend/.env.local`
- `frontend/node_modules/`
- `frontend/unpackage/`
- 日志文件、缓存文件、临时文件

这些规则通常已经在根目录 `.gitignore` 中配置。

---

## 适用场景

本项目适用于：
- 校园失物招领平台原型
- Web / 移动端课程设计
- 前后端分离项目学习
- MongoDB + Express 实战练习
- GitHub 项目展示

---

## 后续可优化方向

- 增加项目截图
- 增加部署文档
- 增加接口文档
- 增加权限说明
- 增加测试与错误处理说明
- 增加 Docker / 云服务器部署示例

---

## License

如无特殊说明，本项目仅用于学习与交流。若你计划公开发布或商用，请根据实际情况补充许可证说明。
