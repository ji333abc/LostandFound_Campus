#!/usr/bin/env node

/**
 * 项目一键切换前端访问后端的地址
 *
 * 用法：
 *   node set-server-ip.js <后端访问地址> [后端端口]
 *
 * 示例：
 *   node set-server-ip.js localhost
 *   node set-server-ip.js 127.0.0.1
 *   node set-server-ip.js 192.168.1.23
 *   node set-server-ip.js 192.168.1.23 3000
 *   node set-server-ip.js https://api.example.com
 *
 * 说明：
 *   - 前端实际读取 frontend/common/config.js
 *   - 若 config.js 不存在，脚本会尝试从 config.example.js 自动创建
 *   - 后端 PORT / HOST / CORS_ORIGIN 请在 backend/.env 中手动修改
 */

const fs = require('fs');
const path = require('path');

function printUsage(write = console.log) {
  write('用法：');
  write('  node set-server-ip.js <后端访问地址> [后端端口]');
  write('');
  write('参数说明：');
  write('  <后端访问地址> 是前端、浏览器或手机用来访问后端的地址。');
  write('    - 本机电脑调试：localhost 或 127.0.0.1');
  write('    - 手机真机调试：填写电脑在同一 Wi-Fi 下的 IPv4，例如 192.168.1.23');
  write('    - 公网部署：填写服务器公网 IP 或域名，例如 https://api.example.com');
  write('  [后端端口] 要和 backend/.env 里的 PORT 保持一致。');
  write('    - 输入 IP / 域名时，不填默认 3000');
  write('    - 输入完整 http(s) URL 时，会按 URL 原样使用');
  write('');
  write('示例：');
  write('  node set-server-ip.js localhost');
  write('  node set-server-ip.js 127.0.0.1');
  write('  node set-server-ip.js 192.168.1.23');
  write('  node set-server-ip.js 192.168.1.23 3000');
  write('  node set-server-ip.js https://api.example.com');
  write('');
  write('注意：');
  write('  这个脚本只修改 frontend/common/config.js，不会修改 backend/.env。');
}

function normalizePort(portArg) {
  if (portArg === undefined || portArg === null || String(portArg).trim() === '') {
    return '3000';
  }

  const port = String(portArg).trim();
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error('后端端口必须是 1-65535 之间的数字');
  }
  return port;
}

function normalize(input, portArg) {
  if (!input || !String(input).trim()) {
    throw new Error('请传入后端访问地址');
  }

  const raw = String(input).trim();
  if (/^https?:\/\//i.test(raw)) {
    const clean = raw.replace(/\/+$/, '');
    const u = new URL(clean);
    if (portArg !== undefined) {
      u.port = normalizePort(portArg);
      return u.toString().replace(/\/+$/, '');
    }
    return clean;
  }

  const host = raw.replace(/\/+$/, '');
  const hostWithoutPort = host.replace(/:\d+$/, '');
  const hostPortMatch = host.match(/:(\d+)$/);
  const backendPort = portArg !== undefined
    ? normalizePort(portArg)
    : (hostPortMatch ? normalizePort(hostPortMatch[1]) : '3000');

  return `http://${hostWithoutPort}:${backendPort}`;
}

function updateFrontConfig(baseUrl) {
  const frontDir = path.resolve(__dirname, 'frontend', 'common');
  const file = path.resolve(frontDir, 'config.js');
  const exampleFile = path.resolve(frontDir, 'config.example.js');

  if (!fs.existsSync(file)) {
    if (!fs.existsSync(exampleFile)) {
      throw new Error(`前端配置文件不存在，且未找到示例文件：${exampleFile}`);
    }
    fs.copyFileSync(exampleFile, file);
    console.log(`ℹ️ 已从示例文件创建前端配置：${file}`);
  }

  const src = fs.readFileSync(file, 'utf8');
  const pattern = /(baseUrl:\s*)(['"`])([^'"`]+)(['"`])/;
  if (!pattern.test(src)) throw new Error('未找到 frontend/common/config.js 的 baseUrl 字段');

  const out = src.replace(pattern, (_, p1, q1, _old, q2) => `${p1}${q1 || q2 || "'"}${baseUrl}${q1 || q2 || "'"}`);
  fs.writeFileSync(file, out, 'utf8');
  return file;
}

function main() {
  const args = process.argv.slice(2);

  try {
    if (args.includes('--help') || args.includes('-h')) {
      printUsage();
      return;
    }

    const [hostOrUrl, portArg, extraArg] = args;
    if (extraArg !== undefined) {
      throw new Error('参数过多，只需要传入后端访问地址和可选端口');
    }

    const baseUrl = normalize(hostOrUrl, portArg);

    const frontFile = updateFrontConfig(baseUrl);

    console.log('✅ 前端后端地址已更新');
    console.log(`- 前端已更新: ${frontFile}`);
    console.log(`- 新的后端访问地址: ${baseUrl}`);
    console.log('\n提示：');
    console.log('- 这个脚本只修改 frontend/common/config.js，不会修改 backend/.env。');
    console.log('- 如果后端端口变了，请手动修改 backend/.env 的 PORT，并重启后端服务。');
  } catch (err) {
    console.error(`❌ 失败: ${err.message}`);
    console.error('');
    printUsage(console.error);
    process.exit(1);
  }
}

main();
