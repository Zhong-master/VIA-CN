#!/usr/bin/env node
'use strict';

/**
 * via-cn 本地静态服务器（零依赖）。
 *
 *   npx via-cn                 # http://127.0.0.1:8602/
 *   npx via-cn -p 9000         # 指定端口
 *   npx via-cn --host 0.0.0.0  # 允许局域网访问
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PORT = 8602;
const DEFAULT_HOST = '127.0.0.1';
const MAX_PORT_TRIES = 10;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
};

function usage() {
  const pkg = require(path.join(ROOT, 'package.json'));
  console.log(`
via-cn ${pkg.version} —— 本地启动 VIA-CN 标注工具

用法:
  via-cn [选项]

选项:
  -p, --port <端口>   监听端口（默认 ${DEFAULT_PORT}；被占用时自动 +1 重试）
      --host <地址>   监听地址（默认 ${DEFAULT_HOST}；局域网共享用 0.0.0.0）
  -v, --version       显示版本号
  -h, --help          显示本帮助

示例:
  npx via-cn
  npx via-cn -p 9000 --host 0.0.0.0
`);
}

function parse_args(argv) {
  const opts = { port: DEFAULT_PORT, host: DEFAULT_HOST };
  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      usage();
      process.exit(0);
    } else if (arg === '-v' || arg === '--version') {
      console.log(require(path.join(ROOT, 'package.json')).version);
      process.exit(0);
    } else if (arg === '-p' || arg === '--port') {
      opts.port = parseInt(argv[++i], 10);
    } else if (arg.indexOf('--port=') === 0) {
      opts.port = parseInt(arg.slice('--port='.length), 10);
    } else if (arg === '--host') {
      opts.host = argv[++i];
    } else if (arg.indexOf('--host=') === 0) {
      opts.host = arg.slice('--host='.length);
    } else {
      console.error('未知选项: ' + arg);
      usage();
      process.exit(1);
    }
  }
  if (!Number.isInteger(opts.port) || opts.port < 1 || opts.port > 65535) {
    console.error('端口无效: ' + opts.port);
    process.exit(1);
  }
  if (!opts.host) {
    console.error('监听地址无效');
    process.exit(1);
  }
  return opts;
}

function send_error(res, status, message) {
  const body = `<!DOCTYPE html><html lang="zh-CN"><meta charset="utf-8">` +
               `<title>${status}</title>` +
               `<body style="font-family:system-ui,sans-serif;padding:2rem">` +
               `<h1>${status}</h1><p>${message}</p>` +
               `<p><a href="/">返回标注器选择页</a></p></body></html>`;
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-cache',
  });
  res.end(body);
}

function send_file(req, res, file) {
  const ext = path.extname(file).toLowerCase();
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  };
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      send_error(res, 404, '找不到该文件。');
      return;
    }
    headers['Content-Length'] = stat.size;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = fs.createReadStream(file);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
}

function create_handler() {
  return function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('405 Method Not Allowed');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      send_error(res, 400, '请求地址无法解析。');
      return;
    }

    // 拒绝访问隐藏文件/目录（.git、.env 等）
    if (pathname.split('/').some((seg) => seg.length > 1 && seg[0] === '.')) {
      send_error(res, 403, '禁止访问隐藏路径。');
      return;
    }

    if (pathname.slice(-1) === '/') {
      pathname += 'index.html';
    }

    const file = path.normalize(path.join(ROOT, pathname));
    if (file !== ROOT && file.indexOf(ROOT + path.sep) !== 0) {
      send_error(res, 403, '禁止访问包目录之外的文件。');
      return;
    }

    fs.stat(file, (err, stat) => {
      if (!err && stat.isDirectory()) {
        send_file(req, res, path.join(file, 'index.html'));
        return;
      }
      if (err && path.extname(file) === '') {
        // 允许 /via_image 这样的无扩展名简写
        send_file(req, res, file + '.html');
        return;
      }
      send_file(req, res, file);
    });
  };
}

function start(opts) {
  const server = http.createServer(create_handler());
  let port = opts.port;
  let tries = 0;

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && tries < MAX_PORT_TRIES) {
      tries += 1;
      port = opts.port + tries;
      console.error(`端口 ${port - 1} 已被占用，改用 ${port} …`);
      server.listen(port, opts.host);
      return;
    }
    if (err.code === 'EADDRINUSE') {
      console.error(`端口 ${opts.port}-${opts.port + MAX_PORT_TRIES} 都被占用，请用 -p 指定其他端口。`);
    } else {
      console.error('启动失败：' + err.message);
    }
    process.exit(1);
  });

  server.on('listening', () => {
    const addr = server.address();
    const host = addr.family === 'IPv6' ? `[${addr.address}]` : addr.address;
    const base = `http://${host}:${addr.port}`;
    console.log('');
    console.log(`  VIA-CN 已启动（资源目录 ${ROOT}）`);
    console.log('');
    console.log(`  选择标注器   ${base}/`);
    console.log(`  图片标注     ${base}/via_image.html`);
    console.log(`  视频标注     ${base}/via_video.html`);
    console.log(`  音频标注     ${base}/via_audio.html`);
    console.log(`  成对比较     ${base}/via_pair.html`);
    console.log('');
    console.log('  按 Ctrl+C 退出');
    console.log('');
  });

  server.listen(port, opts.host);
}

start(parse_args(process.argv.slice(2)));
