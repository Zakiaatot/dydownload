# 构建指南

本指南帮助你正确构建和打包 DyDownload 应用。

## 🚀 快速构建

### 1. 安装依赖
```bash
npm install
```

### 2. 测试应用
```bash
# 开发模式测试
npm run dev

# 生产模式测试
npm start
```

### 3. 构建应用
```bash
# 构建当前平台
npm run build

# 构建特定平台
npm run build-win    # Windows
npm run build-mac    # macOS  
npm run build-linux  # Linux
```

## 🔧 构建配置

### Electron Builder 配置
项目已在 `package.json` 中配置了 `electron-builder`：

```json
{
  "build": {
    "appId": "com.dydownload.app",
    "productName": "抖音下载工具",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!node_modules/**/*",
      "!dist/**/*", 
      "!.git/**/*"
    ]
  }
}
```

### 重要说明
- ✅ **已彻底修复**: v1.1.2 完全解决打包后模块依赖问题
- 🔒 **安全架构**: Webhook功能使用主进程-IPC通信架构
- ⚡ **零依赖**: 完全基于Electron内置模块，无外部HTTP库依赖
- 📦 **完美打包**: 所有功能在打包后完全正常工作

## 🧪 构建前测试

### 验证核心功能
1. **剪贴板监听**: 测试抖音链接识别
2. **视频解析**: 验证API调用正常
3. **文件下载**: 测试各种命名规则
4. **Webhook功能**: 验证HTTP和命令执行
5. **设置管理**: 测试配置保存和加载

### 测试命令
```bash
# 在开发者控制台中运行
devUtils.info()              // 查看应用状态
devUtils.testNamingRules()   // 测试文件命名
devUtils.testDownload()      // 测试下载功能

// 测试Webhook IPC通信
const { ipcRenderer } = require('electron');
await ipcRenderer.invoke('execute-http-webhook', {
  url: 'https://httpbin.org/post',
  method: 'POST',
  body: { type: 'json', data: { test: true } }
}, { title: 'Test' });
```

## 📁 构建输出

构建完成后，文件位于 `dist/` 目录：

### macOS
- `dist/mac/抖音下载工具.app` - 应用程序包
- `dist/抖音下载工具-1.1.2.dmg` - 安装镜像

### Windows  
- `dist/win-unpacked/` - 解压版应用
- `dist/抖音下载工具 Setup 1.1.2.exe` - 安装程序

### Linux
- `dist/抖音下载工具-1.1.2.AppImage` - AppImage格式

## ⚠️ 常见问题

### 1. 模块缺失错误
**问题**: `Cannot find module 'xxx'`  
**解决**: 确保使用 v1.1.2+ 版本，已彻底修复此问题

### 2. 构建失败
**问题**: 构建过程中出错  
**解决**: 
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 3. 应用无法启动
**问题**: 打包后应用启动失败  
**解决**: 检查是否有路径问题，确保资源文件正确打包

### 4. Webhook功能异常
**问题**: 打包后Webhook不工作  
**解决**: v1.1.2+ 已彻底修复，使用Electron内置模块确保完美兼容

## 🔍 调试构建问题

### 启用详细日志
```bash
# 构建时启用详细输出
DEBUG=electron-builder npm run build
```

### 检查打包内容
```bash
# macOS - 查看应用内容
open dist/mac/抖音下载工具.app/Contents/Resources/

# Windows - 查看应用目录  
explorer dist/win-unpacked/
```

### 测试打包应用
构建完成后，先测试打包的应用：
1. 运行打包后的应用
2. 测试所有核心功能
3. 检查控制台是否有错误
4. 验证文件路径和权限

## 📋 发布检查清单

发布前确保：
- [ ] 版本号已更新
- [ ] CHANGELOG.md 已更新
- [ ] 所有功能测试通过
- [ ] 打包应用运行正常
- [ ] 文档更新完整
- [ ] 没有开发模式代码残留

## 🚀 自动化构建

可以设置GitHub Actions等CI/CD：

```yaml
# .github/workflows/build.yml
name: Build
on: [push, pull_request]
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
```

## 💡 优化建议

1. **减小包体积**: 排除不必要的文件
2. **代码签名**: 为发布版本添加代码签名
3. **自动更新**: 集成electron-updater
4. **错误报告**: 添加崩溃报告系统
5. **性能监控**: 添加性能指标收集 