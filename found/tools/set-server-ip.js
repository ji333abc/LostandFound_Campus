#!/usr/bin/env node

/**
 * 一键替换前端 API 地址（common/config.js 中的 APP_CONFIG.api.baseUrl）
 *
 * 用法：
 *   node tools/set-server-ip.js 8.134.12.34
 *   node tools/set-server-ip.js 8.134.12.34 3000
 *   node tools/set-server-ip.js http://8.134.12.34:3000
 *   node tools/set-server-ip.js https://api.example.com
 */

const fs = require('fs');
const path = require('path');

function normalizeBaseUrl(input, portArg) {
  if (!input || !String(input).trim()) {
    throw new Error('请传入服务器IP或完整URL');
  }

  const raw = String(input).trim();

  // 传完整 URL
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }

  // 仅传 IP / 域名
  const host = raw.replace(/\/$/, '');
  const port = portArg ? String(portArg).trim() : '3000';
  return `http://${host}:${port}`;
}

function updateFrontConfig(newBaseUrl) {
  const configPath = path.resolve(__dirname, '..', 'common', 'config.js');

  if (!fs.existsSync(configPath)) {
    throw new Error(`未找到文件：${configPath}`);
  }

  const source = fs.readFileSync(configPath, 'utf8');

  // 仅替换 api 配置里的 baseUrl 字段
  const pattern = /(baseUrl:\s*)(['"`])([^'"`]+)(['"`])/;
  if (!pattern.test(source)) {
    throw new Error('未在 common/config.js 中找到 baseUrl 字段');
  }

  const updated = source.replace(pattern, (_, prefix, q1, _old, q2) => {
    const q = q1 || q2 || "'";
    return `${prefix}${q}${newBaseUrl}${q}`;
  });

  fs.writeFileSync(configPath, updated, 'utf8');
  return configPath;
}

function main() {
  const [, , ipOrUrl, port] = process.argv;

  try {
    const baseUrl = normalizeBaseUrl(ipOrUrl, port);
    const filePath = updateFrontConfig(baseUrl);

    console.log('✅ 前端 API 地址已更新');
    console.log(`   文件: ${filePath}`);
    console.log(`   新地址: ${baseUrl}`);
    console.log('\n下一步建议：');
    console.log('1) 重新编译/重新运行前端');
    console.log('2) 确认后端 .env 中 BASE_URL 与公网访问地址一致（用于AI识别等场景）');
  } catch (err) {
    console.error(`❌ 更新失败: ${err.message}`);
    console.error('\n用法示例：');
    console.error('  node tools/set-server-ip.js 8.134.12.34');
    console.error('  node tools/set-server-ip.js 8.134.12.34 3000');
    console.error('  node tools/set-server-ip.js https://api.example.com');
    process.exit(1);
  }
}

main();
