# AI识别功能配置说明

## 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-4o-mini

# 服务器基础URL（用于构建完整的图片URL）
BASE_URL=http://localhost:3000
```

## 配置说明

- `OPENAI_API_KEY`: OpenAI API密钥（必需）
- `OPENAI_API_ENDPOINT`: API端点地址（可选，默认为OpenAI官方地址）
- `OPENAI_MODEL`: 使用的模型（可选，默认为 gpt-4o-mini，支持视觉识别）
- `BASE_URL`: 服务器基础URL，用于构建完整的图片访问地址

## 支持的模型

- `gpt-4o-mini`: 推荐使用，性价比高
- `gpt-4o`: 更强大的识别能力
- `gpt-4-turbo`: 高性能版本

## 使用其他AI服务

如果使用兼容OpenAI API的其他服务（如Azure OpenAI、国内API等），只需修改：
- `OPENAI_API_ENDPOINT`: 改为对应服务的端点
- `OPENAI_API_KEY`: 改为对应服务的密钥

## API接口

### POST /api/ai/recognize

识别图片中的物品并生成描述

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "imageUrl": "/uploads/xxx.jpg"
}
```

**响应：**
```json
{
  "success": true,
  "description": "一部黑色iPhone 13 Pro，屏幕完好，背面有轻微划痕，配有透明保护壳。"
}
```
```