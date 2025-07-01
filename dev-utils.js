// 开发工具和调试函数
const fs = require('fs');
const path = require('path');

class DevUtils {
  constructor() {
    this.isDevMode = process.argv.includes('--dev');
    if (this.isDevMode) {
      this.setupDevTools();
    }
  }

  setupDevTools() {
    console.log('🚀 开发模式已启用');
    console.log('📁 项目目录:', __dirname);
    console.log('⚡ 热加载已启用');
    console.log('🛠️  快捷键: F5=刷新, F12=切换开发者工具');
    
    // 监听文件变化
    this.watchFiles();
  }

  watchFiles() {
    const filesToWatch = ['index.html', 'styles.css', 'renderer.js'];
    
    filesToWatch.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.watchFile(filePath, (curr, prev) => {
          console.log(`📝 文件已修改: ${file} (${new Date().toLocaleTimeString()})`);
        });
      }
    });
  }

  log(message, type = 'info') {
    if (!this.isDevMode) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
  }

  // 在渲染进程中注入调试信息
  injectDebugInfo(window) {
    if (!this.isDevMode) return;
    
    window.webContents.executeJavaScript(`
      console.log('%c🚀 DyDownload 开发模式', 'color: #667eea; font-size: 16px; font-weight: bold;');
      console.log('%c⚡ 热加载已启用 - 修改文件将自动刷新', 'color: #4ade80;');
      console.log('%c🛠️  快捷键: F5=刷新, F12=开发者工具', 'color: #f59e0b;');
      
      // 添加全局调试函数
      window.devUtils = {
        reload: () => location.reload(),
        router: window.router,
        clipboard: window.clipboardMonitor,
        info: () => {
          console.table({
            '应用名称': 'DyDownload',
            '当前页面': document.querySelector('.page.active')?.id || '未知',
            '窗口尺寸': window.innerWidth + 'x' + window.innerHeight,
            '剪贴板监听': window.clipboardMonitor?.isMonitoring ? '运行中' : '已停止',
            '剪贴板历史': window.clipboardMonitor?.clipboardHistory?.length || 0,
            '抖音链接数': window.clipboardMonitor?.douyinHistory?.length || 0,
            '日志总数': window.logManager?.logs?.length || 0,
            '自动下载': window.settingsManager?.settings.autoDownload ? '开启' : '关闭',
            '用户代理': navigator.userAgent
          });
        },
        clipboardInfo: () => {
          if (window.clipboardMonitor) {
            console.group('📋 剪贴板监听状态');
            console.log('监听状态:', window.clipboardMonitor.isMonitoring ? '运行中' : '已停止');
            console.log('剪贴板历史:', window.clipboardMonitor.clipboardHistory.length);
            console.log('抖音链接数:', window.clipboardMonitor.douyinHistory.length);
            console.log('最后内容:', window.clipboardMonitor.lastClipboardContent || '无');
            console.log('最大历史数:', window.clipboardMonitor.maxHistory);
            console.groupEnd();
          } else {
            console.log('❌ 剪贴板监听器未初始化');
          }
        },
        douyinInfo: () => {
          if (window.clipboardMonitor && window.clipboardMonitor.douyinHistory) {
            console.group('🎵 抖音链接状态');
            console.log('链接总数:', window.clipboardMonitor.douyinHistory.length);
            console.table(window.clipboardMonitor.douyinHistory.map(item => ({
              '时间': item.timestamp.toLocaleTimeString(),
              '状态': item.status,
              '原链接': item.link,
              '视频URL': item.videoUrl ? '已获取' : '无',
              '错误': item.error || '无'
            })));
            console.groupEnd();
          } else {
            console.log('❌ 抖音链接数据未找到');
          }
        },
        testDouyinApi: (url) => {
          if (window.clipboardMonitor) {
            const testItem = {
              link: url || 'https://v.douyin.com/4iq7mCLl-p0/',
              originalContent: '测试内容：这是一个测试的抖音视频分享链接，用于验证API解析功能是否正常工作。',
              timestamp: new Date(),
              id: Date.now(),
              status: 'parsing',
              videoUrl: null,
              error: null
            };
            console.log('🧪 测试抖音API解析...');
            window.clipboardMonitor.parseDouyinVideo(testItem);
          } else {
            console.log('❌ 剪贴板监听器未初始化');
          }
        },
        logInfo: () => {
          if (window.logManager) {
            console.group('📝 日志系统状态');
            console.log('日志总数:', window.logManager.logs.length);
            console.log('成功解析:', window.logManager.logs.filter(log => log.type === 'success').length);
            console.log('解析失败:', window.logManager.logs.filter(log => log.type === 'error').length);
            console.log('最大日志数:', window.logManager.maxLogs);
            console.groupEnd();
            
            if (window.logManager.logs.length > 0) {
              console.table(window.logManager.logs.slice(0, 5).map(log => ({
                '时间': log.timestamp.toLocaleTimeString(),
                '状态': log.type,
                '分享链接': log.shareLink,
                '直链': log.directLink ? '已获取' : '无',
                '错误': log.error || '无'
              })));
            }
          } else {
            console.log('❌ 日志管理器未初始化');
          }
        },
        addTestLog: () => {
          if (window.logManager) {
            window.logManager.addLog(
              'success',
              '测试原文：这是一个测试的分享文本，包含抖音视频链接 https://v.douyin.com/test123/ 用于测试日志功能。',
              'https://v.douyin.com/test123/',
              'https://test.video.url/sample.mp4'
            );
            console.log('✅ 已添加测试日志');
          } else {
            console.log('❌ 日志管理器未初始化');
          }
        },
        settingsInfo: () => {
          if (window.settingsManager) {
            console.group('⚙️ 设置系统状态');
            console.log('自动下载:', window.settingsManager.settings.autoDownload);
            console.log('下载目录:', window.settingsManager.settings.downloadPath);
            console.log('命名规则:', window.settingsManager.settings.namingRule);
            console.log('监听间隔:', window.settingsManager.settings.monitorInterval);
            console.log('最大日志数:', window.settingsManager.settings.maxLogs);
            console.groupEnd();
            
            console.table(window.settingsManager.settings);
          } else {
            console.log('❌ 设置管理器未初始化');
          }
        },
        downloadInfo: () => {
          if (window.videoDownloader) {
            console.group('📥 下载系统状态');
            console.log('正在下载:', window.videoDownloader.downloading.size);
            console.log('下载计数:', window.videoDownloader.downloadCount);
            console.log('下载队列:', Array.from(window.videoDownloader.downloading));
            console.groupEnd();
          } else {
            console.log('❌ 下载管理器未初始化');
          }
        },
        testDownload: () => {
          if (window.videoDownloader) {
            const testUrl = 'https://test.video.url/sample.mp4';
            const testText = '测试下载：这是一个测试视频下载功能的模拟视频链接。';
            const testLink = 'https://v.douyin.com/test123/';
            
            console.log('🧪 测试视频下载功能...');
            window.videoDownloader.downloadVideo(testUrl, testText, testLink)
              .then(result => {
                if (result) {
                  console.log('✅ 测试下载成功:', result);
                } else {
                  console.log('❌ 测试下载失败或被跳过');
                }
              });
          } else {
            console.log('❌ 下载管理器未初始化');
          }
        }
      };
      
      console.log('%c使用 devUtils.info() 查看应用信息', 'color: #8b5cf6;');
    `);
  }
}

module.exports = new DevUtils(); 