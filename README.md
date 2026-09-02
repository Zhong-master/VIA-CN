# VIA-CN 图像标注工具

基于 **VGG Image Annotator (VIA) 3.0.13**（[ox-vgg/via](https://github.com/ox-vgg/via)）的汉化 + 现代化优化版，用于图像/视频/音频的深度学习数据标注。

## 功能亮点

- **全中文界面**：工具栏/形状/tooltip/对话框/快捷键
- **深色主题**：现代化扁平风，适配所有组件
- **三栏布局**：左侧缩放/形状 + 顶部菜单 + 右侧属性编辑器
- **交互优化**：`a/d` 切换文件、滚轮以鼠标为中心缩放、手拖拽平移
- **底部缩略图栏**：点击直接切换文件
- **标注状态边框**：绿=已标注（区域+属性）/ 黄=仅画框 / 蓝=选中 / 无框=空白，打开自动定位最后已标注
- **导出**：CSV / COCO / YOLO 等标注格式

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

任意静态服务器托管本目录即可（目录结构需保持 html 在根、js/css 子目录）：
```bash
python3 -m http.server 8602
```

## 数据说明

- 标注数据保存在**浏览器 localStorage**，换浏览器/设备需**导出 JSON** 再**导入**
- 图片通过浏览器本地加载（添加文件）

## 目录结构

```
├── index.html / via_image.html / via_video.html / via_pair.html
├── js/     # 28 个 _via_*.js 模块
├── css/    # 4 个 annotator css
├── Dockerfile
├── docker-compose.yml
└── LICENSE
```

## License

本仓库基于 VIA 3.0.13 汉化，原版权归 [Abhishek Dutta / VGG / Oxford University](http://www.robots.ox.ac.uk/~vgg/software/via/)，遵循 **BSD-2-Clause**（见 LICENSE）。
