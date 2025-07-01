# 开发指南

## 热加载功能

### 启动开发模式
```bash
npm run dev
```

### 功能特点
- 🔥 **自动热加载**: 修改 HTML、CSS、JS 文件后自动刷新应用
- 🛠️ **开发者工具**: 自动打开开发者控制台
- ⌨️ **快捷键支持**: 
  - `F5`: 手动刷新页面
  - `F12`: 切换开发者工具显示/隐藏
- 📊 **调试信息**: 在控制台中查看文件变化日志

### 开发模式指示器
应用右上角会显示绿色的 "🚀 DEV" 标识，表示当前处于开发模式。
点击该指示器可以查看应用信息。

### 调试工具
在开发模式下，控制台中提供了全局 `devUtils` 对象：

```javascript
// 查看应用信息
devUtils.info()

// 手动刷新页面
devUtils.reload()

// 访问路由对象
devUtils.router

// 访问剪贴板监听器
devUtils.clipboard

// 查看剪贴板详细信息
devUtils.clipboardInfo()

// 查看抖音链接信息
devUtils.douyinInfo()

// 查看日志系统信息
devUtils.logInfo()

// 添加测试日志
devUtils.addTestLog()

// 查看设置系统信息
devUtils.settingsInfo()

// 查看下载系统信息
devUtils.downloadInfo()

// 测试下载功能
devUtils.testDownload()
```

## 剪贴板监听功能

### 功能说明
- 🔄 **实时监听**: 每500ms检查一次剪贴板内容变化
- 📝 **历史记录**: 保存最近50条不重复的剪贴板内容
- 🎵 **抖音链接识别**: 自动识别并提取抖音视频链接
- ⏰ **时间戳**: 记录每次复制的具体时间
- 🗑️ **清空功能**: 支持分别清空剪贴板和抖音链接历史
- 🔒 **去重处理**: 自动过滤重复的剪贴板内容和链接

### 抖音链接功能
- 📱 **自动识别**: 检测 `https://v.douyin.com/` 格式的链接
- 🔄 **API解析**: 自动调用解析API获取真实视频地址
- 📹 **视频URL**: 提取并显示可直接播放的视频链接
- 🎯 **状态显示**: 实时显示解析状态（解析中/成功/失败）
- 🔗 **双重链接**: 原始链接和解析后的视频地址都可点击
- 📊 **独立管理**: 抖音链接单独显示和管理
- 🎨 **状态颜色**: 不同解析状态有不同的颜色标识

### 使用方法
1. 点击功能页面的开关按钮开始监听
2. 在抖音应用中分享视频，复制链接文本
3. 返回应用查看：
   - 抖音链接区域：只显示提取的视频链接和描述
   - 剪贴板内容区域：显示完整的复制内容
4. 切换到日志页面查看详细的解析记录：
   - 📝 原分享文本：完整的剪贴板内容
   - 🔗 分享链接：提取的抖音链接
   - 📹 直链地址：解析出的视频URL
   - ⏰ 时间戳：解析时间
   - 📊 状态统计：成功/失败数量
5. 点击对应的"清空"按钮清除相应历史

## 设置页面功能

### 自动下载设置
- 🔧 **自动保存视频**: 开启后解析成功的视频会自动下载
- 📁 **保存目录**: 选择视频保存的文件夹路径
- 📝 **文件命名规则**: 五种命名方式
  - 时间戳_原始名称: `1234567890_douyin_video.mp4`
  - 视频标题_时间戳: `我的视频_1234567890.mp4`
  - MD5哈希值: `abc123def456.mp4`
  - 序号_时间戳: `video_0001_1234567890.mp4`
  - 视频标识符: `dd80aeXR4M8.mp4`

### 应用设置
- ⏱️ **监听间隔**: 剪贴板检查频率，默认500毫秒
- 📊 **最大日志数**: 保留的最大日志条数，默认100条

### 设置管理
- 💾 **保存设置**: 将当前设置保存到本地存储
- 🔄 **重置设置**: 恢复所有设置为默认值
- 📤 **导出设置**: 将设置导出为JSON文件
- 📥 **导入设置**: 从JSON文件导入设置配置

### 自动下载流程
1. 开启自动下载开关
2. 设置视频保存目录
3. 选择文件命名规则
4. 保存设置
5. 当检测到抖音链接并解析成功后，视频会自动下载到指定目录
6. 下载状态会在日志页面显示

## Webhook 集成功能

### 功能概述
Webhook功能允许应用在特定事件发生时自动向外部服务发送通知或执行自定义操作。

### 支持的触发条件
- 🔍 **链接检测时**: 检测到抖音链接时触发
- ✅ **解析成功时**: 视频链接解析成功时触发
- 📥 **下载完成时**: 视频下载完成时触发
- ❌ **下载失败时**: 视频下载失败时触发

### Webhook类型
1. **HTTP Webhook**: 向指定URL发送HTTP请求
2. **Command Webhook**: 执行系统命令

### HTTP Webhook配置
```javascript
{
  id: "webhook_123",
  name: "通知服务器",
  enabled: true,
  type: "http",
  trigger: "download_success",
  config: {
    url: "https://api.example.com/webhook",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_TOKEN"
    },
    body: {
      type: "json",
      config: {
        title: "{{title}}",
        url: "{{videoUrl}}",
        originalUrl: "{{shareUrl}}",
        downloadPath: "{{downloadPath}}",
        timestamp: "{{timestamp}}"
      }
    }
  }
}
```

### Command Webhook配置
```javascript
{
  id: "webhook_456",
  name: "处理下载完成",
  enabled: true,
  type: "command",
  trigger: "download_success",
  config: {
    command: "python process_video.py",
    args: ["{{downloadPath}}", "{{title}}"],
    workingDirectory: "/path/to/scripts",
    timeout: 30000
  }
}
```

### 变量替换
在Webhook配置中，可以使用以下变量：
- `{{title}}`: 视频标题
- `{{shareUrl}}`: 原始分享链接
- `{{videoUrl}}`: 解析后的视频地址
- `{{downloadPath}}`: 下载文件路径
- `{{timestamp}}`: 时间戳
- `{{error}}`: 错误信息（仅在失败时可用）

### 管理Webhook
```javascript
// 查看所有webhook
devUtils.webhookInfo()

// 手动执行webhook
window.webhookManager.executeWebhooks('download_success', {
  title: '测试视频',
  shareUrl: 'https://v.douyin.com/test',
  videoUrl: 'https://example.com/video.mp4',
  downloadPath: '/downloads/video.mp4'
})

// 测试特定webhook
window.webhookManager.testWebhook(webhookObject)

// 添加新webhook
window.webhookManager.addWebhook(webhookConfig)

// 删除webhook
window.webhookManager.removeWebhook(webhookId)

// 调试IPC通信
const { ipcRenderer } = require('electron');

// 测试HTTP Webhook IPC调用
ipcRenderer.invoke('execute-http-webhook', {
  url: 'https://httpbin.org/post',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { type: 'json', data: { test: 'data' } }
}, { title: 'Test Video' })

// 测试命令 Webhook IPC调用
ipcRenderer.invoke('execute-command-webhook', {
  command: 'echo',
  args: ['Hello World']
}, { title: 'Test' })
```

### 技术实现
- 使用Electron的clipboard API读取剪贴板
- 正则表达式匹配抖音链接：`/https:\/\/v\.douyin\.com\/[A-Za-z0-9\-_]+\/?/g`
- 调用第三方API解析视频：`https://api.xhus.cn/api/douyin?url={链接}`
- 异步处理API请求，不阻塞界面
- 状态管理：parsing（解析中）→ success/error（成功/失败）
- 自动提取API返回的 `data.url` 作为视频地址
- HTML转义确保安全显示
- 错误处理和重试机制
- 设置持久化存储到localStorage
- 文件系统操作使用Node.js fs模块
- 异步下载避免界面阻塞
- 下载去重防止重复操作
- 灵活的文件命名策略
- 完整的日志记录系统（解析+下载）

### Webhook架构设计
- **主进程处理**: HTTP请求和命令执行在主进程中进行
- **IPC通信**: 渲染进程通过IPC与主进程通信
- **零依赖架构**: 完全基于Electron内置`net`模块
- **安全隔离**: 避免渲染进程直接访问Node.js模块
- **错误隔离**: 主进程错误不会影响界面响应
- **完美打包**: 无外部依赖，打包后100%兼容

## 文件监听
以下文件的修改会触发自动重载：
- `index.html` - 主页面文件
- `styles.css` - 样式文件  
- `renderer.js` - 渲染进程脚本
- `main.js` - 主进程文件（需要重启应用）

## 开发技巧

### 1. 样式调试
- 在开发者工具中实时修改CSS
- 保存到文件后会自动应用更改

### 2. 控制台调试
- 使用 `console.log()` 输出调试信息
- 查看网络请求和错误信息

### 3. 页面路由测试
```javascript
// 在控制台中测试路由切换
devUtils.router.navigateTo('function')  // 切换到功能页面
devUtils.router.navigateTo('logs')      // 切换到日志页面
```

### 4. 剪贴板功能调试
```javascript
// 手动启动/停止剪贴板监听
devUtils.clipboard.startMonitoring()
devUtils.clipboard.stopMonitoring()

// 查看剪贴板历史
console.log(devUtils.clipboard.clipboardHistory)

// 查看抖音链接历史
console.log(devUtils.clipboard.douyinHistory)

// 清空剪贴板历史
devUtils.clipboard.clearHistory()

// 清空抖音链接历史
devUtils.clipboard.clearDouyinHistory()

// 查看详细状态
devUtils.clipboardInfo()

// 查看抖音链接详细信息
devUtils.douyinInfo()

// 手动测试抖音链接匹配
devUtils.clipboard.checkDouyinLinks('测试文本 https://v.douyin.com/4iq7mCLl-p0/ 包含抖音链接')

// 测试API解析功能
devUtils.testDouyinApi('https://v.douyin.com/4iq7mCLl-p0/')

// 查看某个链接的完整解析结果
console.log(devUtils.clipboard.douyinHistory[0])

// 查看日志系统状态
devUtils.logInfo()

// 添加测试日志
devUtils.addTestLog()

// 清空日志
window.logManager.clearLogs()

// 查看日志数据
console.log(window.logManager.logs)

// 查看设置系统状态
devUtils.settingsInfo()

// 查看下载系统状态  
devUtils.downloadInfo()

// 测试下载功能
devUtils.testDownload()

// 测试文件命名规则
devUtils.testNamingRules()

// 手动保存设置
window.settingsManager.saveSettings()

// 手动加载设置
window.settingsManager.loadSettings()

// 切换自动下载
window.settingsManager.settings.autoDownload = !window.settingsManager.settings.autoDownload

// 查看下载队列
console.log(Array.from(window.videoDownloader.downloading))
```

## 生产模式
```bash
npm start
```
生产模式下不会加载开发工具和热加载功能。

## 故障排除

### 热加载不工作
1. 确保使用 `npm run dev` 启动
2. 检查控制台是否有错误信息
3. 尝试手动按 `F5` 刷新

### 开发者工具无法打开
- 按 `F12` 切换开发者工具
- 或者重启应用

### 文件监听失效
- 检查文件权限
- 重启开发服务器

## 项目管理

### 版本控制
- 使用语义化版本号 (Semantic Versioning)
- 主版本号.次版本号.修订号 (如: 1.2.3)
- 每次发布前更新 `package.json` 中的版本号

### 代码规范
- 使用统一的代码风格
- 变量和函数使用驼峰命名法
- 类名使用帕斯卡命名法
- 常量使用全大写加下划线

### 文档维护
- 新功能开发时同步更新文档
- 保持 README.md 和 DEVELOPMENT.md 的信息准确性
- API 变更时及时更新相关说明
- 定期检查和更新过时的信息

### 测试建议
```javascript
// 功能测试清单
1. 剪贴板监听功能
   - 启动/停止监听
   - 抖音链接识别
   - 历史记录管理

2. 视频解析功能
   - API调用成功/失败
   - 解析结果显示
   - 错误处理

3. 下载功能
   - 自动下载设置
   - 文件命名规则
   - 下载状态跟踪

4. 设置管理
   - 保存/加载设置
   - 导入/导出配置
   - 重置默认值

5. Webhook功能
   - HTTP请求发送
   - 命令执行
   - 变量替换

6. 界面交互
   - 页面切换
   - 按钮响应
   - 状态更新
```

### 性能优化
- 定期清理不必要的控制台输出
- 优化剪贴板检查频率
- 合理设置日志数量上限
- 避免内存泄漏

### 安全考虑
- 验证用户输入
- 安全地处理文件路径
- 谨慎执行系统命令
- 保护敏感配置信息

### 发布流程
1. 运行测试确保功能正常
2. 更新版本号和更新日志
3. 构建应用程序包
4. 测试构建后的应用
5. 发布到相应平台

### 贡献指南
- Fork 项目到个人仓库
- 创建功能分支进行开发
- 遵循现有的代码风格
- 提交清晰的提交信息
- 创建详细的 Pull Request
- 确保通过所有测试 