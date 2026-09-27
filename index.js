'use strict';

/**
 * via-cn —— 目录定位入口。
 *
 * 本包的主体是静态资源（HTML / JS / CSS），这里只把资源位置暴露给构建工具，
 * 方便在 Vite / webpack 等工具里把标注器拷贝到 public 目录：
 *
 *   const via = require('via-cn');
 *   copy(via.dir + '/**', 'public/via');
 *
 * 想在浏览器里 import 本包并不适用：js/ 下的模块是供 <script> 标签
 * 全局加载的脚本，没有 ESM/CJS 导出。
 */

const path = require('path');

const dir = __dirname;

module.exports = {
  /** 包根目录（HTML / js / css 所在目录） */
  dir,
  /** 各标注器的 HTML 入口绝对路径 */
  entries: {
    index: path.join(dir, 'index.html'),
    image: path.join(dir, 'via_image.html'),
    video: path.join(dir, 'via_video.html'),
    audio: path.join(dir, 'via_audio.html'),
    pair: path.join(dir, 'via_pair.html'),
  },
  /** 资源目录绝对路径 */
  js: path.join(dir, 'js'),
  css: path.join(dir, 'css'),
};
