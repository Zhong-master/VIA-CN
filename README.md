# VIA-CN

基于 [VGG Image Annotator (VIA) 3.0.13](https://github.com/ox-vgg/via) 的中文标注工具，支持**图片 / 视频 / 音频 / 图像成对比较**四类标注任务。纯静态实现，无需后端。

**[▶ 在线演示](https://zhong-master.github.io/VIA-CN/)** · [BSD-2-Clause](LICENSE)

![VIA-CN 图片标注器](https://raw.githubusercontent.com/Zhong-master/VIA-CN/main/docs/screenshots/image-annotator.png)

> **非官方分支**：本仓库是 VIA 的第三方中文汉化与改造版，与原项目及其作者无隶属关系。
> 原版权归 Abhishek Dutta / Visual Geometry Group, University of Oxford 所有，遵循 BSD-2-Clause（见 [LICENSE](LICENSE)）。

## 界面预览

### 图片标注

左侧是形状与类别工具，画布上按类别着色显示矩形 / 圆形 / 椭圆 / 多边形等区域，右侧编辑器列出当前文件的全部标注并可直接改类别或删除；底部缩略图栏显示每个文件的标注完成状态（绿色 = 已标注）。

![图片标注器](https://raw.githubusercontent.com/Zhong-master/VIA-CN/main/docs/screenshots/image-annotator.png)

### 视频标注

逐帧划定区域，或用时间轴定义时间片段（如「某个动作从第 2 秒持续到第 5 秒」）。

![视频标注器](https://raw.githubusercontent.com/Zhong-master/VIA-CN/main/docs/screenshots/video-annotator.png)

### 音频标注

波形 + 时间轴，用于语音片段切分、说话人标注等。

![音频标注器](https://raw.githubusercontent.com/Zhong-master/VIA-CN/main/docs/screenshots/audio-annotator.png)

### 图像成对比较

两张图并排放置，整组打分（例如「哪张更清晰」），适合做主观质量评估数据集。

![成对比较标注器](https://raw.githubusercontent.com/Zhong-master/VIA-CN/main/docs/screenshots/pair-annotator.png)

> 成对视图由项目 JSON 中的**多文件视图**（一个 `view` 含两个 `fid`）定义，并需同时保留对应的
> 单文件视图供查找（上游演示工程 `js/_via_demo_pair_annotator.js` 即此结构）。
> 界面上的“添加文件”会为每个文件建立独立视图，因此成对标注请通过**导入项目 JSON** 建立视图。

### 标注器入口

`index.html` 是四个标注器的统一选择入口。

![入口页](https://raw.githubusercontent.com/Zhong-master/VIA-CN/main/docs/screenshots/index.png)

## 功能

- **四种标注器**：图片、视频、音频、图像成对比较，`index.html` 为统一入口
- **中文界面**：工具栏、形状、提示、对话框、快捷键均已汉化（快捷键键名与 `COCO`/`YOLO`/`WebVTT` 等专有名词保留原文）
- **深色主题**：扁平化深色 UI，覆盖全部组件
- **类别管理**：左下角类别浮窗 + 右侧编辑器可新建 / 选择 / 改色 / 删除类别，绘制时自动归类；
  编辑器同时列出**当前文件的全部标注**，可直接修改已有区域的类别或删除标注
- **交互优化**：`a`/`d` 切换文件、滚轮以光标为中心缩放、手型拖拽平移、适应屏幕、放大 / 缩小 / 放大镜
- **底部缩略图栏**：点击直接切换文件，并显示每个文件的标注完成状态
- **自动保存**：文件、视图、类别、属性、标注自动保存到浏览器 localStorage，下次打开自动恢复；
  可在“导入 / 导出”面板点击“清除本地自动保存”删除
- **导入 / 导出**：CSV、COCO、YOLO、时间片段 CSV、WebVTT；支持导入 VIA2 项目 JSON
- **共享项目**：可通过 VIA 项目服务器导入共享项目（需能访问 `zeus.robots.ox.ac.uk`）

## 快速开始

### 方式一：内置零依赖服务器（推荐）

需要 Node.js 16+，无需安装任何依赖：

```bash
node bin/serve.js                  # http://127.0.0.1:8602/
node bin/serve.js -p 9000          # 指定端口；端口被占用时自动 +1 重试
node bin/serve.js --host 0.0.0.0   # 允许局域网内其他机器访问
```

本仓库同时按 npm 包规范组织（`name: via-cn`），发布到 npm 后可直接：

```bash
npx via-cn
```

### 方式二：任意静态服务器

**必须在仓库根目录启动**（HTML 位于根目录，`js/`、`css/` 为其子目录）：

```bash
python3 -m http.server 8602
```

然后访问 `http://localhost:8602/`。

> 请勿直接双击用 `file://` 打开 HTML，也不要把它部署到子路径——
> 相对资源路径 `js/`、`css/` 需要以仓库根目录作为站点根目录才能解析。
>
> 部署到 GitHub Pages 时请保留根目录的 `.nojekyll` 文件：Jekyll 默认会排除以下划线开头的文件，
> 而本项目的脚本是 `js/_via*.js`，缺少它会加载不出任何功能。

### 方式三：Docker

```bash
docker compose up -d
```

浏览器打开 `http://localhost:8000/`。

- 宿主机端口 8000 → 容器 8602；`docker-compose.yml` 默认绑定 `0.0.0.0`，**局域网内其他机器**可通过
  `http://<宿主机IP>:8000/` 访问（需放行防火墙 8000）
- 自定义端口：改 `docker-compose.yml` 的 `ports`，如 `"8080:8602"`
- 停止：`docker compose down`

## 数据说明

- 标注数据自动保存在**浏览器 localStorage**，并按标注器类型分别存储
  （`_via_cn_project_image` / `_video` / `_audio` / `_pair`），互不干扰
- localStorage 按**源（origin）**隔离：换域名或端口后看不到旧数据
- 本地文件的二进制内容**不会**写入 localStorage；恢复后若提示找不到文件，
  重新添加同一批文件即可重新绑定已有标注
- 跨浏览器 / 跨设备迁移请**导出 JSON** 后再**导入**
- 图片、音视频均通过浏览器本地加载（“添加文件”）

## 目录结构

```
├── index.html / via_image.html / via_video.html / via_audio.html / via_pair.html
├── js/                   # _via_*.js 模块（浏览器脚本，全局加载）
├── css/                  # 4 个 annotator 样式表
├── bin/serve.js          # 零依赖静态服务器
├── index.js              # npm 入口（导出资源目录路径）
├── package.json
├── docs/screenshots/     # 界面截图
├── .github/workflows/publish.yml   # 推 v* tag 时发布到 npm（OIDC 可信发布）
├── .nojekyll             # GitHub Pages：禁用 Jekyll，否则 js/_via*.js 会被排除
├── Dockerfile / docker-compose.yml
└── LICENSE
```

> `js/` 下的模块是供 `<script>` 标签全局加载的浏览器脚本，**没有** ESM/CJS 导出，
> 因此不能 `import { ... } from 'via-cn'`；`index.js` 只用于把资源目录位置暴露给构建工具。
>
> `js/_via_demo_*.js`（演示工程）、`js/_via_audio_spectrum.js`（实验性频谱组件）、
> `js/_via_debug_project.js`（示例数据）来自上游 VIA，当前页面未启用，保留供二次开发使用。

## 浏览器要求

建议使用最新版 Chrome / Edge / Firefox / Safari。视频与音频标注依赖
`<video>`/`<audio>`、Canvas 与 Web Audio，较旧的浏览器可能无法完整支持。

## 致谢与 License

[BSD-2-Clause](LICENSE)。基于 VIA 3.0.13 汉化与改造，原版权归
[Abhishek Dutta / Visual Geometry Group, Oxford University](https://www.robots.ox.ac.uk/~vgg/software/via/) 所有。
