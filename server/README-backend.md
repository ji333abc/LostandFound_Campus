# 校园失物招领后端说明

本文件用于说明后端配置文件 `backend.config.yaml` 的使用方式与字段含义。

---

## 配置文件

- 文件名：`backend.config.yaml`
- 作用：集中管理后端运行参数（端口、数据库、鉴权、上传、安全等）

示例结构：

```yaml backend.config.yaml
app:
  name: "校园失物招领-backend"
  env: "development"
  host: "0.0.0.0"
  port: 3000
  apiPrefix: "/api"

cors:
  enabled: true
  origin:
    - "http://localhost:5173"
    - "http://localhost:8080"
  credentials: true

database:
  type: "mongodb"
  uri: "mongodb://127.0.0.1:27017/found"

auth:
  jwtSecret: "please_change_me"
  jwtExpiresIn: "7d"

upload:
  dir: "uploads"
  maxFileSizeMB: 10
  allowedMimeTypes:
    - "image/jpeg"
    - "image/png"
    - "image/webp"

security:
  bcryptRounds: 10
  rateLimit:
    enabled: true
    windowMs: 900000
    max: 200

log:
  level: "info"
```

---

## 字段说明

### 1) app
- `env`：运行环境（development/test/production）
- `host`/`port`：服务监听地址与端口
- `apiPrefix`：统一接口前缀（建议与前端一致，如 `/api`）

### 2) cors
- `origin`：允许跨域访问的前端地址白名单
- `credentials`：是否允许携带凭证

### 3) database
- `uri`：MongoDB 连接字符串

### 4) auth
- `jwtSecret`：JWT 密钥（生产环境务必替换）
- `jwtExpiresIn`：Token 过期时间（如 `7d`）

### 5) upload
- `dir`：上传目录
- `maxFileSizeMB`：单文件最大大小
- `allowedMimeTypes`：允许上传的 MIME 类型

### 6) security
- `bcryptRounds`：密码加密强度
- `rateLimit`：接口限流参数

### 7) log
- `level`：日志级别（debug/info/warn/error）

---

## 与前端配置对齐

请确保以下配置与前端一致：

- 后端：`app.port` + `app.apiPrefix`
- 前端：`config.yaml` 中的 `api.baseUrl` + `api.prefix`

例如：
- 后端：`http://localhost:3000` + `/api`
- 前端：
  - `baseUrl: "http://localhost:3000"`
  - `prefix: "/api"`

---

## 安全建议

1. 不要在仓库中提交真实 `jwtSecret`。
2. 建议新增：
   - `backend.config.example.yaml`（示例）
   - 将真实配置加入 `.gitignore`
3. 生产环境开启严格 CORS 与限流。

---

## 下一步（可选）

如果你需要，我可以继续补：

- Node.js/Express 读取 `backend.config.yaml` 的启动代码
- 配置校验（缺字段启动失败）
- 按环境自动加载（dev/prod）