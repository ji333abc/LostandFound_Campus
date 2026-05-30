const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const MatchCache = require('../models/MatchCache');
const auth = require('../middlewares/auth');

const router = express.Router();

const MATCH_LEVELS = {
  high: { min: 75, label: 'high' },
  medium: { min: 50, label: 'medium' },
  low: { min: 30, label: 'low' }
};

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function getMatchAiIdentity() {
  return {
    provider: String(process.env.MATCH_AI_PROVIDER || 'openai').trim().toLowerCase(),
    model: String(process.env.MATCH_AI_MODEL || '').trim()
  };
}

function getMatchCacheTtlMs() {
  const days = Math.max(1, Math.min(90, Number(process.env.MATCH_CACHE_TTL_DAYS) || 7));
  return days * 24 * 60 * 60 * 1000;
}

function sameTime(a, b) {
  return new Date(a).getTime() === new Date(b).getTime();
}

function formatDateForAI(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function formatItemForAI(item) {
  return {
    id: String(item._id),
    type: item.type || '',
    category: item.category || '',
    title: item.title || '',
    description: item.description || '',
    location: item.location || '',
    time: formatDateForAI(item.time),
    status: item.status || ''
  };
}

function extractJsonText(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';

  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw;
}

function normalizeAiConfidence(value) {
  const normalized = String(value || '').toLowerCase();
  if (['high', 'medium', 'low'].includes(normalized)) {
    return normalized;
  }
  return 'low';
}

function normalizeAiReview(rawReview, candidateId) {
  const confidence = normalizeAiConfidence(rawReview?.confidence);
  let numericScore = Math.max(0, Math.min(100, Number(rawReview?.score) || 0));
  let matched = rawReview?.matched === true || numericScore >= 60;

  if (matched) {
    if (confidence === 'high' && numericScore < 80) {
      numericScore = 85;
    } else if (confidence === 'medium' && numericScore < 60) {
      numericScore = 70;
    } else if (confidence === 'low' && numericScore < 40) {
      numericScore = 50;
    }
  } else {
    if (numericScore >= 60) {
      numericScore = 59;
    }
  }

  return {
    candidateId,
    reviewed: true,
    matched,
    confidence,
    score: numericScore,
    reason: String(rawReview?.reason || '').trim().slice(0, 200),
    warning: 'AI判断仅供参考，请结合实物细节与联系方式人工确认。'
  };
}

function buildAiBatchReviewPrompt(sourceItem, candidates) {
  return `你是校园失物招领系统的智能匹配助手。请根据“源记录”和“候选记录列表”的文本信息，判断每条候选记录是否可能与源记录指向同一个物品。

判断原则：
1) 必须谨慎，宁可保守，不要轻易判定为同一物品；
2) 重点参考：物品类别、名称、颜色/材质/外观特征、地点、时间、状态；
3) 如果只是地点接近但物品明显不同，应判定为不匹配；
4) 如果描述不完全一致，但核心物品特征接近，可以给中等置信度；
5) 不要编造不存在的品牌、型号或细节；
6) 只输出 JSON，不要输出任何额外解释或 Markdown；
7) 请保证字段含义一致：
   - matched=true 时，score 应尽量 >= 60；
   - confidence=high 时，score 应在 80-100；
   - confidence=medium 时，score 应在 60-79；
   - confidence=low 时，score 应在 0-59；
   - 如果判断不匹配，matched=false，score 应尽量低于 60。

请按以下 JSON 格式返回：
{
  "results": [
    {
      "candidateId": "候选ID",
      "matched": true,
      "confidence": "high|medium|low",
      "score": 0,
      "reason": "不超过60字的中文理由"
    }
  ]
}

源记录：
${JSON.stringify(formatItemForAI(sourceItem), null, 2)}

候选记录列表：
${JSON.stringify(candidates.map(formatItemForAI), null, 2)}`;
}

function maskApiEndpoint(endpoint) {
  try {
    const url = new URL(String(endpoint || ''));
    return `${url.origin}${url.pathname}`;
  } catch (error) {
    return String(endpoint || '');
  }
}

function extractAiTextContent(content) {
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
      .join('\n');
  }

  return '';
}

function buildMatchAiRequestBody(provider, model, prompt, maxTokens, temperature) {
  const systemPrompt = '你是谨慎的校园失物匹配助手，只输出合法 JSON。';

  if (provider === 'openai') {
    return {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };
  }

  if (provider === 'anthropic') {
    return {
      model,
      max_tokens: maxTokens,
      stream: false,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };
  }

  throw new Error(`暂不支持的匹配AI协议: ${provider}`);
}

function extractMatchAiResponseText(provider, data) {
  if (provider === 'openai') {
    const choice = data.choices?.[0] || {};
    const message = choice.message || {};
    return extractAiTextContent(message.content) ||
      extractAiTextContent(message.reasoning_content) ||
      extractAiTextContent(choice.text) ||
      extractAiTextContent(data.output_text) ||
      extractAiTextContent(data.content);
  }

  if (provider === 'anthropic') {
    return extractAiTextContent(data.content) ||
      extractAiTextContent(data.choices?.[0]?.message?.content);
  }

  return '';
}

function normalizeMatchAiEndpoint(provider, endpointInput) {
  const defaultEndpoint = provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : '';
  const raw = String(endpointInput || defaultEndpoint).trim().replace(/\/+$/, '');

  if (!raw) return '';

  if (provider === 'openai') {
    if (/\/chat\/completions$/i.test(raw)) return raw;
    if (/\/v1$/i.test(raw)) return `${raw}/chat/completions`;
    return `${raw}/v1/chat/completions`;
  }

  if (provider === 'anthropic') {
    if (/\/messages$/i.test(raw)) return raw;
    if (/\/v1$/i.test(raw)) return `${raw}/messages`;
    return `${raw}/v1/messages`;
  }

  return raw;
}

function buildEmptyAiContentMessage(provider, apiEndpoint, data) {
  const topLevelKeys = data && typeof data === 'object'
    ? Object.keys(data).slice(0, 8).join(',')
    : typeof data;
  const firstChoice = data?.choices?.[0] || {};
  const choiceKeys = firstChoice && typeof firstChoice === 'object'
    ? Object.keys(firstChoice).slice(0, 8).join(',')
    : '';
  const messageKeys = firstChoice.message && typeof firstChoice.message === 'object'
    ? Object.keys(firstChoice.message).slice(0, 8).join(',')
    : '';

  return `匹配AI返回内容为空: provider=${provider}, endpoint=${maskApiEndpoint(apiEndpoint)}, keys=${topLevelKeys}, choiceKeys=${choiceKeys}, messageKeys=${messageKeys}`;
}

async function runAiBatchReview(sourceItem, candidates) {
  const { provider, model } = getMatchAiIdentity();
  const apiKey = process.env.MATCH_AI_API_KEY;
  const maxTokens = Math.max(256, Math.min(4000, Number(process.env.MATCH_AI_MAX_TOKENS) || 1200));
  const temperature = Math.max(0, Math.min(1, Number(process.env.MATCH_AI_TEMPERATURE) || 0.2));
  const timeoutMs = Math.max(3000, Math.min(60000, Number(process.env.MATCH_AI_TIMEOUT_MS) || 15000));

  if (!['openai', 'anthropic'].includes(provider)) {
    return {
      enabled: false,
      reviewedCount: 0,
      failed: true,
      message: `暂不支持的匹配AI协议: ${provider}`
    };
  }

  const apiEndpoint = normalizeMatchAiEndpoint(provider, process.env.MATCH_AI_API_ENDPOINT);

  if (!apiKey || !apiEndpoint || !model) {
    return {
      enabled: false,
      reviewedCount: 0,
      failed: true,
      message: '匹配AI未配置'
    };
  }

  try {
    new URL(apiEndpoint);
  } catch (error) {
    throw new Error(`匹配AI接口地址无效: ${apiEndpoint}`);
  }

  const prompt = buildAiBatchReviewPrompt(sourceItem, candidates);
  const requestBody = buildMatchAiRequestBody(provider, model, prompt, maxTokens, temperature);
  let response;

  try {
    response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify(requestBody)
    });
  } catch (error) {
    const causeMessage = error?.cause?.message || error?.message || '未知网络错误';
    const causeCode = error?.cause?.code ? ` (${error.cause.code})` : '';
    throw new Error(`匹配AI请求失败${causeCode}: ${causeMessage} | endpoint=${maskApiEndpoint(apiEndpoint)}`);
  }

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`AI批量复核失败: HTTP ${response.status} ${raw}`);
  }

  const data = await response.json();
  const content = extractMatchAiResponseText(provider, data);
  if (!content) {
    throw new Error(buildEmptyAiContentMessage(provider, apiEndpoint, data));
  }

  const parsed = JSON.parse(extractJsonText(content));
  const resultList = Array.isArray(parsed?.results) ? parsed.results : [];
  const reviewMap = {};

  resultList.forEach((item) => {
    const candidateId = String(item?.candidateId || '');
    if (!candidateId) return;
    reviewMap[candidateId] = normalizeAiReview(item, candidateId);
  });

  return {
    enabled: true,
    reviewedCount: Object.keys(reviewMap).length,
    failed: false,
    model,
    provider,
    reviewMap
  };
}

async function loadCachedAiReviews(sourceItem, entries, provider, model) {
  if (!model || entries.length === 0) {
    return { reviewMap: {}, hitIds: new Set() };
  }

  const candidateIds = entries.map((entry) => entry.item._id);
  const rows = await MatchCache.find({
    sourceItem: sourceItem._id,
    candidateItem: { $in: candidateIds },
    provider,
    model,
    expiresAt: { $gt: new Date() }
  });

  const entryMap = new Map(entries.map((entry) => [String(entry.item._id), entry]));
  const reviewMap = {};
  const hitIds = new Set();

  rows.forEach((row) => {
    const candidateId = String(row.candidateItem);
    const entry = entryMap.get(candidateId);
    if (!entry) return;
    if (!sameTime(row.sourceUpdatedAt, sourceItem.updatedAt)) return;
    if (!sameTime(row.candidateUpdatedAt, entry.item.updatedAt)) return;

    reviewMap[candidateId] = {
      candidateId,
      matched: row.matched,
      score: row.aiScore,
      confidence: row.confidence,
      reason: row.reason,
      cached: true
    };
    hitIds.add(candidateId);
  });

  return { reviewMap, hitIds };
}

async function saveAiReviewCache(sourceItem, entries, provider, model, reviewMap) {
  if (!model || entries.length === 0) return;

  const expiresAt = new Date(Date.now() + getMatchCacheTtlMs());
  await Promise.all(entries.map((entry) => {
    const candidateId = String(entry.item._id);
    const review = reviewMap[candidateId];
    if (!review) return Promise.resolve();

    return MatchCache.updateOne(
      {
        sourceItem: sourceItem._id,
        candidateItem: entry.item._id,
        provider,
        model
      },
      {
        $set: {
          ruleScore: entry.score,
          aiScore: review.score,
          matched: review.matched,
          confidence: review.confidence,
          reason: review.reason || '',
          sourceUpdatedAt: sourceItem.updatedAt,
          candidateUpdatedAt: entry.item.updatedAt,
          expiresAt
        }
      },
      { upsert: true }
    );
  }));
}

function applyAiReviewsToMatches(entries, reviewMap) {
  return entries.map((entry) => {
    const candidateId = String(entry.item._id);
    const review = reviewMap[candidateId];
    if (!review) {
      return null;
    }

    return {
      ...entry,
      ruleScore: entry.score,
      ruleLevel: entry.level,
      ruleReasons: entry.reasons,
      ruleBreakdown: entry.breakdown,
      score: review.score,
      level: getMatchLevel(review.score),
      reasons: review.reason ? [review.reason] : ['AI已完成复核'],
      scoreSource: review.cached ? 'ai-cache' : 'ai',
      aiReview: {
        enabled: true,
        ...review
      }
    };
  }).filter(Boolean);
}

function buildMatchNotificationMessage(sourceItem, matchedItem, score, level, aiReview) {
  const isLostOwner = sourceItem.type === 'lost';
  const title = isLostOwner
    ? '有1件新发布的招领物品可能是你遗失的物品'
    : '有1条新发布的失物信息可能与你的招领记录匹配';
  const confidenceText = {
    high: '高置信',
    medium: '中置信',
    low: '低置信'
  }[aiReview?.confidence] || '低置信';
  const reason = aiReview?.reason ? `理由：${aiReview.reason}` : '请进入详情页结合实物细节人工确认。';
  const content = isLostOwner
    ? `新发布的“${matchedItem.title}”可能与你的“${sourceItem.title}”相关（AI匹配分 ${score}，${confidenceText}）。${reason}`
    : `新发布的“${matchedItem.title}”可能与你发布的“${sourceItem.title}”相关（AI匹配分 ${score}，${confidenceText}）。${reason}`;

  return {
    title,
    content,
    matchLevel: level
  };
}

async function createMatchNotificationsForNewItem(newItem) {
  const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
  const candidateCreatedAt = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const ruleCandidateLimit = 10;
  const notificationLimit = 5;
  const ruleMinScore = 40;
  const aiMinScore = 60;

  const candidates = await Item.find({
    _id: { $ne: newItem._id },
    type: oppositeType,
    status: 'open',
    createdAt: { $gte: candidateCreatedAt }
  }).limit(200);

  const ruleMatches = candidates
    .filter((candidate) => String(candidate.owner) !== String(newItem.owner))
    .map((candidate) => {
      const result = scoreMatch(newItem, candidate);
      return {
        item: candidate,
        ruleScore: result.score,
        ruleLevel: result.level
      };
    })
    .filter((entry) => entry.ruleScore >= ruleMinScore)
    .sort((a, b) => b.ruleScore - a.ruleScore)
    .slice(0, ruleCandidateLimit);

  if (!ruleMatches.length) {
    return;
  }

  const aiResult = await runAiBatchReview(newItem, ruleMatches.map((entry) => entry.item));
  if (!aiResult.enabled || aiResult.failed) {
    console.warn(`匹配AI通知未生成: ${aiResult.message || 'AI复核失败'}`);
    return;
  }

  const reviewMap = aiResult.reviewMap || {};
  const matches = ruleMatches
    .map((entry) => {
      const review = reviewMap[String(entry.item._id)];
      if (!review || !review.matched || review.score < aiMinScore) {
        return null;
      }

      return {
        item: entry.item,
        ruleScore: entry.ruleScore,
        score: review.score,
        level: getMatchLevel(review.score),
        aiReview: review
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, notificationLimit);

  for (const entry of matches) {
    const sourceItem = entry.item;
    const matchedItem = newItem;
    const message = buildMatchNotificationMessage(sourceItem, matchedItem, entry.score, entry.level, entry.aiReview);

    await Notification.updateOne(
      {
        sourceItem: sourceItem._id,
        matchedItem: matchedItem._id,
        type: 'match_found'
      },
      {
        $setOnInsert: {
          user: sourceItem.owner,
          type: 'match_found',
          title: message.title,
          content: message.content,
          sourceItem: sourceItem._id,
          matchedItem: matchedItem._id,
          matchScore: entry.score,
          matchLevel: message.matchLevel,
          read: false
        }
      },
      { upsert: true }
    );
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，。！？；：、“”‘’（）()【】\[\]{}《》,.!?;:'"\-_/\\|]+/g, '');
}

function buildBigrams(text) {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  if (normalized.length === 1) return [normalized];

  const grams = [];
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.push(normalized.slice(i, i + 2));
  }
  return grams;
}

function calcTextSimilarity(a, b) {
  const gramsA = new Set(buildBigrams(a));
  const gramsB = new Set(buildBigrams(b));

  if (!gramsA.size || !gramsB.size) return 0;

  let intersection = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) {
      intersection += 1;
    }
  }

  const union = new Set([...gramsA, ...gramsB]).size;
  return union ? intersection / union : 0;
}

function getCategoryScore(sourceItem, candidate, reasons) {
  if (!sourceItem.category || !candidate.category) return 0;
  if (sourceItem.category === candidate.category) {
    reasons.push(`分类一致（${sourceItem.category}）`);
    return 15;
  }
  return 0;
}

function getTitleScore(sourceItem, candidate, reasons) {
  const similarity = calcTextSimilarity(sourceItem.title, candidate.title);
  if (similarity >= 0.6) {
    reasons.push('标题关键词高度相似');
    return 28;
  }
  if (similarity >= 0.35) {
    reasons.push('标题关键词有一定相似度');
    return 17;
  }
  if (similarity >= 0.2) {
    return 9;
  }
  return 0;
}

function getDescriptionScore(sourceItem, candidate, reasons) {
  const similarity = calcTextSimilarity(sourceItem.description, candidate.description);
  if (similarity >= 0.5) {
    reasons.push('描述内容高度相似');
    return 34;
  }
  if (similarity >= 0.28) {
    reasons.push('描述内容有一定相似度');
    return 20;
  }
  if (similarity >= 0.15) {
    return 9;
  }
  return 0;
}

function getLocationScore(sourceItem, candidate, reasons) {
  const similarity = calcTextSimilarity(sourceItem.location, candidate.location);
  if (similarity >= 0.6) {
    reasons.push('地点信息高度接近');
    return 15;
  }
  if (similarity >= 0.3) {
    reasons.push('地点信息有一定重合');
    return 9;
  }
  if (similarity >= 0.15) {
    return 4;
  }
  return 0;
}

function getTimeScore(sourceItem, candidate, reasons) {
  if (!sourceItem.time || !candidate.time) return 0;

  const diffMs = Math.abs(new Date(sourceItem.time).getTime() - new Date(candidate.time).getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) {
    reasons.push('时间非常接近（1天内）');
    return 8;
  }
  if (diffDays <= 3) {
    reasons.push('时间较接近（3天内）');
    return 6;
  }
  if (diffDays <= 7) {
    reasons.push('时间有一定接近（7天内）');
    return 4;
  }
  if (diffDays <= 15) {
    return 2;
  }
  if (diffDays <= 30) {
    return 1;
  }
  return 0;
}

function getMatchLevel(score) {
  if (score >= MATCH_LEVELS.high.min) return MATCH_LEVELS.high.label;
  if (score >= MATCH_LEVELS.medium.min) return MATCH_LEVELS.medium.label;
  if (score >= MATCH_LEVELS.low.min) return MATCH_LEVELS.low.label;
  return 'none';
}

function scoreMatch(sourceItem, candidate) {
  const reasons = [];
  const breakdown = {
    category: getCategoryScore(sourceItem, candidate, reasons),
    title: getTitleScore(sourceItem, candidate, reasons),
    description: getDescriptionScore(sourceItem, candidate, reasons),
    location: getLocationScore(sourceItem, candidate, reasons),
    time: getTimeScore(sourceItem, candidate, reasons)
  };

  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const level = getMatchLevel(score);

  return { score, level, reasons, breakdown };
}

// 获取我的发布（需要登录）
router.get('/my', auth, async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, category, description, location, time, images, contact } = req.body;

    // 验证必填字段
    if (!title || !type) {
      return res.status(400).json({ message: '标题和类型必填' });
    }

    // 验证标题长度
    if (title.length < 2 || title.length > 100) {
      return res.status(400).json({ message: '标题长度必须在 2-100 字之间' });
    }

    // 验证类型
    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({ message: '类型只能是 lost 或 found' });
    }

    // 验证图片数量
    if (images && images.length > 3) {
      return res.status(400).json({ message: '最多上传 3 张图片' });
    }

    const item = await Item.create({
      title,
      type,
      category,
      description,
      location,
      time,
      images: images || [],
      contact,
      owner: req.user.id
    });

    createMatchNotificationsForNewItem(item).catch((notifyError) => {
      console.error('生成AI匹配提醒失败:', notifyError.message);
    });

    res.json({ message: '发布成功', data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, category, keyword, status, page = 1, pageSize = 10 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [list, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .populate('owner', 'username'),
      Item.countDocuments(filter)
    ]);

    res.json({ data: list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/matches', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const minScore = Math.max(0, Math.min(100, Number(req.query.minScore) || 20));
    const candidateDays = Math.max(1, Math.min(365, Number(req.query.candidateDays) || 180));
    const limit = Math.max(1, Math.min(10, Number(req.query.limit) || 10));
    const useAI = parseBoolean(req.query.useAI, true);
    const aiLimit = Math.max(1, Math.min(10, Number(req.query.aiLimit) || 10));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: '无效的 ID 格式' });
    }

    const sourceItem = await Item.findById(id).populate('owner', 'username');
    if (!sourceItem) {
      return res.status(404).json({ message: '未找到该信息' });
    }

    const currentUser = await User.findById(req.user.id).select('role');
    const isOwner = String(sourceItem.owner?._id || sourceItem.owner) === req.user.id;
    const isAdmin = currentUser?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '仅发布者本人可查看可能匹配结果' });
    }

    const oppositeType = sourceItem.type === 'lost' ? 'found' : 'lost';
    const candidateCreatedAt = new Date(Date.now() - candidateDays * 24 * 60 * 60 * 1000);

    const candidateFilter = {
      _id: { $ne: sourceItem._id },
      type: oppositeType,
      status: 'open',
      createdAt: { $gte: candidateCreatedAt }
    };

    const candidates = await Item.find(candidateFilter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('owner', 'username');

    let matches = candidates
      .map((candidate) => {
        const result = scoreMatch(sourceItem, candidate);
        return {
          item: candidate,
          score: result.score,
          level: result.level,
          reasons: result.reasons,
          breakdown: result.breakdown,
          aiReview: {
            enabled: useAI,
            reviewed: false
          }
        };
      })
      .filter((entry) => entry.score >= minScore)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
      })
      .slice(0, limit);

    let aiSummary = {
      enabled: useAI,
      requested: useAI ? Math.min(aiLimit, matches.length) : 0,
      reviewed: 0,
      failed: false,
      message: ''
    };

    if (useAI && matches.length > 0) {
      const requestedCount = Math.min(aiLimit, matches.length);
      const requestedEntries = matches.slice(0, requestedCount);
      const { provider, model } = getMatchAiIdentity();
      try {
        const cached = await loadCachedAiReviews(sourceItem, requestedEntries, provider, model);
        const missEntries = requestedEntries.filter((entry) => !cached.hitIds.has(String(entry.item._id)));
        const missCandidates = missEntries.map((entry) => entry.item);
        let aiResult = {
          enabled: true,
          reviewedCount: 0,
          failed: false,
          message: '',
          model,
          provider,
          reviewMap: {}
        };

        if (missCandidates.length > 0) {
          aiResult = await runAiBatchReview(sourceItem, missCandidates);
          await saveAiReviewCache(sourceItem, missEntries, aiResult.provider, aiResult.model, aiResult.reviewMap || {});
        }

        const reviewMap = {
          ...cached.reviewMap,
          ...(aiResult.reviewMap || {})
        };

        const aiReviewedMatches = applyAiReviewsToMatches(requestedEntries, reviewMap);

        if (!aiResult.failed && aiReviewedMatches.length > 0) {
          matches = aiReviewedMatches.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
          });
        }

        aiSummary = {
          enabled: aiResult.enabled,
          requested: requestedCount,
          reviewed: Object.keys(reviewMap).length,
          failed: aiResult.failed || false,
          message: aiResult.message || '',
          model: aiResult.model || '',
          provider: aiResult.provider || '',
          cacheHits: cached.hitIds.size,
          cacheMisses: missEntries.length
        };
      } catch (error) {
        console.error('AI匹配复核失败:', error.message);
        if (error?.cause) {
          console.error('AI匹配复核底层原因:', error.cause);
        }
        aiSummary = {
          enabled: true,
          requested: Math.min(aiLimit, matches.length),
          reviewed: 0,
          failed: true,
          message: error.message || '匹配AI暂时不可用，已返回规则匹配结果'
        };
      }
    }

    res.json({
      data: {
        sourceItem,
        summary: {
          sourceType: sourceItem.type,
          targetType: oppositeType,
          totalCandidates: candidates.length,
          returned: matches.length,
          minScore,
          candidateDays,
          limit,
          useAI,
          aiLimit
        },
        aiSummary,
        matches
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'username phone wechat college');
    if (!item) {
      return res.status(404).json({ message: '未找到该信息' });
    }
    res.json({ data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: '未找到该信息' });
    }
    if (String(item.owner) !== req.user.id) {
      return res.status(403).json({ message: '无权限修改' });
    }

    const updatable = ['title', 'type', 'category', 'description', 'location', 'time', 'images', 'contact', 'status'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();
    res.json({ message: '修改成功', data: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: '未找到该信息' });
    }
    if (String(item.owner) !== req.user.id) {
      return res.status(403).json({ message: '无权限删除' });
    }

    await item.deleteOne();
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取某条信息的评论列表
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ item: id })
      .sort({ createdAt: 1 })
      .populate('user', 'username college');
    res.json({ data: comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发表评论
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: '未找到该信息' });
    }

    const comment = await Comment.create({
      item: id,
      user: req.user.id,
      content
    });

    const populated = await comment.populate('user', 'username college');

    res.json({ message: '评论成功', data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除评论
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    // 检查权限：只有评论作者或管理员可以删除
    const user = await User.findById(req.user.id);
    if (String(comment.user) !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: '无权限删除此评论' });
    }

    await comment.deleteOne();
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
