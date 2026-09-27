# VIA-CN 标注工具

基于 **VGG Image Annotator (VIA) 3.0.13**（[ox-vgg/via](https://github.com/ox-vgg/via)）的汉化 + 现代化优化版，用于图像 / 视频 / 音频 / 成对比较的深度学习数据标注。

## 功能亮点

- **四种标注器**：图片、视频、音频、图像成对比较（`index.html` 为选择入口）
- **中文界面**：工具栏 / 形状 / 提示 / 对话框 / 快捷键（少量专有名词与快捷键键名保留英文）
- **深色主题**：现代化扁平风，适配所有组件
- **类别管理**：左下角类别浮窗 + 右侧编辑器创建/选择/改色/删除类别，绘制时自动归类；
  右侧编辑器还会列出**当前文件的全部标注**，可直接修改已有区域的类别或删除
- **交互优化**：`a/d` 切换文件、滚轮以鼠标为中心缩放、手型拖拽平移、适应屏幕、放大 / 缩小 / 放大镜
- **底部缩略图栏**：点击直接切换文件
- **自动保存**：标注内容（文件、视图、类别、属性、标注）自动保存到 **浏览器 localStorage**，
  下次打开自动恢复；可在“导入/导出”面板点击“清除本地自动保存”删除
- **导入/导出**：CSV / COCO / YOLO / 时间片段 CSV / WebVTT；支持导入 VIA2 项目 JSON
- **共享项目**：可通过 VIA 项目服务器导入共享项目（需要能访问 `zeus.robots.ox.ac.uk`）

## Docker 一键部署（docker compose）

```bash
docker compose build
docker compose up -d
```

浏览器打开 `http://localhost:8000/`。

> 宿主机端口 8000 → 容器 8602。`docker-compose.yml` 默认绑定 `0.0.0.0`，**局域网内其他机器**可通过 `http://<宿主机IP>:8000/` 访问（需确保宿主机防火墙放行 8000）。

自定义端口：修改 `docker-compose.yml` 的 `ports` 映射即可，如 `"8080:8602"` 后访问 `http://localhost:8080/`。

停止服务：`docker compose down`

## 直接使用（无需 Docker）

**必须在仓库根目录启动静态服务器**（HTML 在根目录，`js/`、`css/` 为子目录）：

```bash
python3 -m http.server 8602
```

然后访问 `http://localhost:8602/`。请勿直接双击 `file://` 打开 HTML，也不要部署到子路径
（`python3 -m http.server` 需在**本目录内**启动，或让 Web 服务器把本目录映射为站点根目录）。

## 数据说明

- 标注数据自动保存在**浏览器 localStorage**，并按标注器类型分别存储
  （`_via_cn_project_image` / `_video` / `_audio` / `_pair`），互不干扰
- 本地图片的二进制内容**不会**写入 localStorage；恢复后如提示“找不到文件”，
  重新添加同一批文件即可重新绑定已有标注
- 换浏览器 / 设备时，请**导出 JSON** 再**导入**
- 图片通过浏览器本地加载（添加文件）

## 目录结构

```
├── index.html            # 标注器选择入口
├── via_image.html        # 图片标注
├── via_video.html        # 视频标注
├── via_audio.html        # 音频标注
├── via_pair.html         # 成对比较
├── js/                   # _via_*.js 模块
├── css/                  # 4 个 annotator css
├── Dockerfile
├── docker-compose.yml
└── LICENSE
```

> `js/_via_demo_*.js`（演示工程）、`js/_via_audio_spectrum.js`（实验性频谱组件）、
> `js/_via_debug_project.js`（示例数据）来自上游 VIA，当前页面未启用，保留供二次开发 /
> 打包演示页使用。

## License

本仓库基于 VIA 3.0.13 汉化，原版权归 [Abhishek Dutta / VGG / Oxford University](http://www.robots.ox.ac.uk/~vgg/software/via/)，遵循 **BSD-2-Clause**（见 LICENSE）。
