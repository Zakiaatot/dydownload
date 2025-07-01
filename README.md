# DyDownload 抖音视频下载工具

<div align="center">
  <img src="logo.png" width="128" height="128" alt="DyDownload Logo" />
  <h3>一个简洁高效的抖音视频下载桌面应用</h3>
  <p>基于 Electron 开发，支持自动识别、解析和下载抖音视频</p>
</div>

## ✨ 功能特性

### 🔄 智能剪贴板监听
- **实时监听**: 自动检测剪贴板内容变化
- **抖音链接识别**: 自动识别 `https://v.douyin.com/` 格式链接
- **去重处理**: 智能过滤重复内容
- **历史记录**: 保存最近操作记录

### 📹 视频解析与下载
- **一键解析**: 自动调用API解析抖音视频真实地址
- **自动下载**: 支持解析成功后自动下载视频
- **灵活命名**: 提供多种文件命名规则
- **状态跟踪**: 实时显示解析和下载状态

### ⚙️ 个性化设置
- **下载配置**: 自定义下载目录和文件命名方式
- **监听间隔**: 可调整剪贴板检查频率
- **批量操作**: 支持批量下载和管理
- **设置同步**: 配置文件导入导出功能

### 🔗 Webhook 集成
- **HTTP 推送**: 支持向指定URL推送解析结果
- **命令执行**: 可执行自定义系统命令
- **多重触发**: 支持多种触发条件
- **高级配置**: 支持复杂的HTTP请求配置

### 📊 日志系统
- **详细记录**: 记录所有解析和下载操作
- **状态统计**: 实时统计成功/失败数量
- **错误跟踪**: 详细的错误信息和调试日志
- **操作历史**: 完整的操作时间线

### 🎨 用户界面
- **现代化设计**: 简洁美观的界面
- **响应式布局**: 适配不同窗口尺寸
- **平滑动画**: 流畅的页面切换效果
- **开发者友好**: 开发模式指示器和调试工具

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 运行项目

#### 开发模式（推荐）
```bash
npm run dev
```
开发模式特性：
- ✨ 自动热加载：文件修改后自动刷新
- 🛠️ 开发者工具：自动打开控制台
- ⌨️ 快捷键：F5刷新，F12切换开发者工具
- 📊 开发模式指示器：右上角显示"🚀 DEV"

#### 生产模式
```bash
npm start
```

#### 调试模式
```bash
npm run debug
```

### 构建应用
```bash
# 构建所有平台
npm run build

# 构建 Windows 版本
npm run build-win

# 构建 macOS 版本
npm run build-mac

# 构建 Linux 版本
npm run build-linux
```

## 📋 使用方法

### 基本流程
1. **启动应用**：运行 `npm run dev` 或 `npm start`
2. **开启监听**：在功能页面点击"开始监听"按钮
3. **复制链接**：在抖音APP中分享视频，复制链接
4. **自动处理**：应用自动识别并解析视频链接
5. **下载视频**：根据设置自动下载或手动下载

### 高级配置
1. **设置下载目录**：在设置页面选择视频保存位置
2. **配置文件命名**：选择适合的文件命名规则
3. **Webhook集成**：配置HTTP推送或命令执行
4. **监听参数调整**：根据需要调整检查频率

## 🔧 技术架构

### 技术栈
- **前端框架**: Electron 27.3.11
- **渲染进程**: HTML5 + CSS3 + JavaScript ES6+
- **主进程**: Node.js
- **构建工具**: Electron Builder

### 核心模块
- **PageRouter**: 页面路由管理
- **ClipboardMonitor**: 剪贴板监听
- **VideoDownloader**: 视频下载器
- **SettingsManager**: 设置管理
- **LogManager**: 日志系统
- **WebhookManager**: Webhook集成

### 项目结构
```
dydownload/
├── main.js              # Electron 主进程
├── renderer.js          # 渲染进程脚本
├── index.html           # 应用主页面
├── styles.css           # 样式文件
├── dev-utils.js         # 开发工具
├── package.json         # 项目配置
├── logo.png             # 应用图标
├── README.md            # 项目说明
├── DEVELOPMENT.md       # 开发指南
└── .gitignore           # Git忽略文件
```

## 🛠️ 开发指南

### 开发环境设置
1. 安装 Node.js (推荐 v16+)
2. 克隆项目：`git clone <repository-url>`
3. 安装依赖：`npm install`
4. 启动开发：`npm run dev`

### 调试技巧
```javascript
// 开发者控制台中可用的全局对象
devUtils.info()            // 查看应用信息
devUtils.reload()          // 手动刷新页面
devUtils.clipboardInfo()   // 剪贴板状态
devUtils.douyinInfo()      // 抖音链接信息
devUtils.logInfo()         // 日志系统信息
devUtils.testDownload()    // 测试下载功能
devUtils.testNamingRules() // 测试文件命名规则
```

### 贡献指南
1. Fork 项目
2. 创建特性分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交 Pull Request

## 📝 配置说明

### 文件命名规则
- **时间戳_原始名称**: `1234567890_douyin_video.mp4`
- **视频标题_时间戳**: `我的视频_1234567890.mp4`
- **MD5哈希值**: `abc123def456.mp4`
- **序号_时间戳**: `video_0001_1234567890.mp4`
- **视频标识符**: `dd80aeXR4M8.mp4`（从链接中提取）

### API配置
- 默认解析API: `https://api.xhus.cn/api/douyin?url={链接}`
- 支持自定义API端点
- 自动重试机制

### Webhook配置
支持以下触发条件：
- 链接检测时
- 解析成功时
- 下载完成时
- 下载失败时

## ⚠️ 注意事项

- 请遵守抖音的使用条款和版权规定
- 下载的视频仅供个人学习和研究使用
- 请勿将此工具用于商业用途
- 建议定期更新应用以获得最新功能

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 🤝 支持与反馈

如果你在使用过程中遇到问题或有建议：
- 提交 Issue：报告bug或功能请求
- 参与讨论：分享使用经验
- 贡献代码：提交Pull Request

---

<div align="center">
  <p>如果这个项目对你有帮助，请给它一个 ⭐️</p>
</div> 