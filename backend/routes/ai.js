const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middlewares/auth');
const router = express.Router();

function getMimeTypeByExt(ext) {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return map[ext.toLowerCase()] || 'image/jpeg';
}

function getRecognizeConfig(modeInput, maxCharsInput) {
  const mode = modeInput === 'detailed' ? 'detailed' : 'short';
  let maxChars = Number(maxCharsInput);

  if (!Number.isFinite(maxChars) || maxChars < 30 || maxChars > 500) {
    maxChars = mode === 'short' ? 80 : 180;
  }

  return { mode, maxChars };
}

function buildPrompt(mode, maxChars) {
  if (mode === 'detailed') {
    return `你是校园失物招领系统的识别助手。请只识别图片中最主要、最可能是失物或招领物品的那个物品，并生成一段适合发布页填写的中文描述。
要求：
1) 只描述主要物品，不要描述背景、桌面、环境、人物或其他无关内容；
2) 尽量包含：物品名称、颜色、材质或外观特征、明显细节、新旧状态；
3) 如果图片里有桌面、电脑、房间、人物等背景信息，请忽略，只描述物品本身；
4) 不要臆造无法确认的品牌、型号或细节，不确定时使用“疑似”或“可能”；
5) 使用2-3句自然中文，不要分点，不要加标题；
6) 总长度不超过${maxChars}字；
7) 仅输出描述正文。`;
  }

  return `你是校园失物招领系统的识别助手。请只识别图片中最主要、最可能是失物或招领物品的那个物品，并生成一条适合列表展示的简短中文描述。
要求：
1) 只描述主要物品，不要描述背景、桌面、环境、人物或其他无关内容；
2) 优先输出：物品名称 + 颜色/材质/外观特征 + 新旧状态；
3) 如果图片里有桌面、电脑、房间、人物等背景信息，请忽略，只描述物品本身；
4) 不要臆造无法确认的信息，不确定时使用“疑似”或“可能”；
5) 只输出1句话，不要分点，不要加标题；
6) 总长度不超过${maxChars}字；
7) 仅输出描述正文。`;
}

function normalizeAndLimitText(text, maxChars) {
  const normalized = String(text || '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[•*]/g, '')
    .trim();

  if (normalized.length <= maxChars) {
    return { description: normalized, truncated: false, rawLength: normalized.length };
  }

  return {
    description: `${normalized.slice(0, maxChars).trim()}…`,
    truncated: true,
    rawLength: normalized.length
  };
}

function extractTextContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item.text === 'string') {
          return item.text;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }

  return '';
}

// AI识别接口 - 使用阿里云百炼（OpenAI兼容）视觉模型
router.post('/recognize', auth, async (req, res) => {
  try {
    const { imageUrl, mode: modeInput, maxChars: maxCharsInput } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: '请提供图片URL' });
    }

    const { mode, maxChars } = getRecognizeConfig(modeInput, maxCharsInput);

    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
    const apiEndpoint =
      process.env.DASHSCOPE_API_ENDPOINT ||
      process.env.OPENAI_API_ENDPOINT ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    const model = process.env.OPENAI_MODEL || 'qwen3-vl-flash';

    if (!apiKey) {
      return res.status(500).json({ message: 'AI服务未配置，请联系管理员' });
    }

    // 构建可被模型访问的图片输入：
    // - /uploads/xxx：从本地读取并转 data URL（避免外网无法访问 localhost）
    // - http(s)://...：直接透传
    let imageInput = imageUrl;
    if (imageUrl.startsWith('/uploads/')) {
      const localFilePath = path.join(__dirname, '..', imageUrl.replace(/^\//, ''));
      if (!fs.existsSync(localFilePath)) {
        return res.status(400).json({ message: '图片文件不存在，请重新上传' });
      }

      const ext = path.extname(localFilePath);
      const mimeType = getMimeTypeByExt(ext);
      const base64 = fs.readFileSync(localFilePath).toString('base64');
      imageInput = `data:${mimeType};base64,${base64}`;
    } else if (!/^https?:\/\//i.test(imageUrl)) {
      return res.status(400).json({ message: 'imageUrl 格式不正确' });
    }

    const prompt = buildPrompt(mode, maxChars);

    // 调用 OpenAI 兼容 Chat Completions（阿里云百炼/千问兼容）接口
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageInput }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const raw = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(raw);
      } catch (e) {
        errorData = { message: raw };
      }

      console.error('AI API错误:', response.status, errorData, {
        endpoint: apiEndpoint,
        model,
        imageInputType: imageInput.startsWith('data:') ? 'data_url' : 'url'
      });
      return res.status(500).json({
        message: 'AI识别失败，请稍后重试',
        error: errorData.error?.message || errorData.message || `HTTP ${response.status}`
      });
    }

    const data = await response.json();
    const content = extractTextContent(data.choices?.[0]?.message?.content);
    const { description, truncated, rawLength } = normalizeAndLimitText(content, maxChars);

    if (!description) {
      return res.status(500).json({ message: 'AI识别结果为空' });
    }

    res.json({
      success: true,
      description,
      mode,
      maxChars,
      rawLength,
      truncated
    });
  } catch (error) {
    console.error('AI识别错误:', error);
    res.status(500).json({ 
      message: 'AI识别服务异常',
      error: error.message 
    });
  }
});

module.exports = router;