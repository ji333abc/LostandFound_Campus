#!/usr/bin/env node

/**
 * 项目一键切换服务器地址（前端 + 后端）
 *
 * 用法：
 *   node set-server-ip.js 8.134.12.34
 *   node set-server-ip.js 8.134.12.34 8080
 *   node set-server-ip.js https://api.example.com
 *   node set-server-ip.js 8.134.12.34 3000 .env.server
 *   node set-server-ip.js 8.134.12.34 3000 .env.server http://localhost:5173
 */

const fs = require('fs');
const path = require('path');

function normalize(input, portArg) {
  if (!input || !String(input).trim()) {
    throw new Error('请传入服务器 IP / 域名 / URL');
  }

  const raw = String(input).trim();
  if (/^https?:\/\//i.test(raw)) {
    const clean = raw.replace(/\/$/, '');
    const u = new URL(clean);
    const explicitPort = u.port;
    // 后端监听端口：优先参数端口，其次 URL 显式端口，最后 3000
    const backendPort = String(portArg || explicitPort || '3000').trim();
    return { baseUrl: clean, backendPort };
  }

  const host = raw.replace(/\/$/, '');
  const backendPort = String(portArg || '3000').trim();
  return {
    baseUrl: `http://${host}:${backendPort}`,
    backendPort
  };
}

function updateFrontConfig(baseUrl) {
  const file = path.resolve(__dirname, 'found', 'common', 'config.js');
  if (!fs.existsSync(file)) throw new Error(`前端配置文件不存在：${file}`);

  const src = fs.readFileSync(file, 'utf8');
  const pattern = /(baseUrl:\s*)(['"`])([^'"`]+)(['"`])/;
  if (!pattern.test(src)) throw new Error('未找到 found/common/config.js 的 baseUrl 字段');

  const out = src.replace(pattern, (_, p1, q1, _old, q2) => `${p1}${q1 || q2 || "'"}${baseUrl}${q1 || q2 || "'"}`);
  fs.writeFileSync(file, out, 'utf8');
  return file;
}

function upsertEnvLine(content, key, value) {
  const line = `${key}=${value}`;
  const reg = new RegExp(`^${key}=.*$`, 'm');
  if (reg.test(content)) {
    return content.replace(reg, line);
  }
  const suffix = content.endsWith('\n') || content.length === 0 ? '' : '\n';
  return `${content}${suffix}${line}\n`;
}

function updateServerEnv(baseUrl, backendPort, envFileName, corsOrigin) {
  const envName = envFileName || '.env';
  const file = path.resolve(__dirname, 'server', envName);

  let content = '';
  if (fs.existsSync(file)) {
    content = fs.readFileSync(file, 'utf8');
  }

  content = upsertEnvLine(content, 'BASE_URL', baseUrl);
  content = upsertEnvLine(content, 'HOST', '0.0.0.0');
  content = upsertEnvLine(content, 'PORT', backendPort);
  // 默认放开，避免开发环境因 CORS 配错导致“前端请求全部失败”
  content = upsertEnvLine(content, 'CORS_ORIGIN', corsOrigin || '*');

  fs.writeFileSync(file, content, 'utf8');
  return file;
}

function main() {
  const [, , ipOrUrl, portOrEnv, maybeEnv, maybeCorsOrigin] = process.argv;

  try {
    // 支持：node set-server-ip.js 1.2.3.4 3000 .env.server
    // 支持：node set-server-ip.js 1.2.3.4 .env.server
    let portArg = undefined;
    let envName = '.env';

    if (portOrEnv) {
      if (/^\.env(\.|$)/.test(String(portOrEnv))) {
        envName = String(portOrEnv);
      } else {
        portArg = String(portOrEnv);
      }
    }
    if (maybeEnv) {
      envName = String(maybeEnv);
    }

    const { baseUrl, backendPort } = normalize(ipOrUrl, portArg);

    const frontFile = updateFrontConfig(baseUrl);
    const envFile = updateServerEnv(baseUrl, backendPort, envName, maybeCorsOrigin);

    console.log('✅ 一键切换完成');
    console.log(`- 前端已更新: ${frontFile}`);
    console.log(`- 后端已更新: ${envFile}`);
    console.log(`- 新地址: ${baseUrl}`);
    console.log('\n下一步：');
    console.log('1) 重启后端服务');
    console.log('2) 重新编译/运行前端');
  } catch (err) {
    console.error(`❌ 失败: ${err.message}`);
    console.error('\n示例：');
    console.error('  node set-server-ip.js 8.134.12.34');
    console.error('  node set-server-ip.js 8.134.12.34 8080');
    console.error('  node set-server-ip.js https://api.example.com');
    console.error('  node set-server-ip.js 8.134.12.34 .env.server');
    console.error('  node set-server-ip.js 8.134.12.34 3000 .env.server http://localhost:5173');
    process.exit(1);
  }
}

main();
