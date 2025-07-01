const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// 引入开发工具
const devUtils = require('./dev-utils');

// 开发模式下启用热加载
if (process.argv.includes('--dev')) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit',
    ignored: [
      /node_modules|[\/\\]\./,  // 忽略node_modules和隐藏文件
      /\.git/,                  // 忽略git文件
      /\.DS_Store/             // 忽略macOS系统文件
    ]
  });
}

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'logo.png'), // 设置应用图标
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    resizable: true, // 允许调整窗口大小
    minWidth: 700,
    minHeight: 500,
    frame: true,
    titleBarStyle: 'default',
    show: false // 先不显示，等页面加载完成后再显示
  });

  // 加载应用的index.html
  mainWindow.loadFile('index.html');

  // 当页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 注入开发调试信息
    devUtils.injectDebugInfo(mainWindow);
  });

  // 开发模式下的功能
  if (process.argv.includes('--dev')) {
    // 自动打开开发者工具
    mainWindow.webContents.openDevTools();
    
    // 添加快捷键支持
    const { globalShortcut } = require('electron');
    
    // F5 刷新页面
    globalShortcut.register('F5', () => {
      mainWindow.webContents.reload();
    });
    
    // F12 切换开发者工具
    globalShortcut.register('F12', () => {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    });
  }
}

// 设置简洁的菜单
function createMenu() {
  if (process.platform === 'darwin') {
    // macOS需要保留基本的应用菜单
    const template = [
      {
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    // Windows和Linux完全移除菜单栏
    Menu.setApplicationMenu(null);
  }
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createMenu();
  createWindow();
});

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 清理全局快捷键
  if (process.argv.includes('--dev')) {
    const { globalShortcut } = require('electron');
    globalShortcut.unregisterAll();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC处理器：文件对话框
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

// IPC处理器：保存对话框
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

// IPC处理器：保存设置到用户目录
ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log('✅ 设置已保存到:', settingsPath);
    return { success: true, path: settingsPath };
  } catch (error) {
    console.error('❌ 保存设置失败:', error);
    return { success: false, error: error.message };
  }
});

// IPC处理器：从用户目录加载设置
ipcMain.handle('load-settings', async (event) => {
  try {
    const userDataPath = app.getPath('userData');
    const settingsPath = path.join(userDataPath, 'settings.json');
    
    // 检查文件是否存在
    try {
      await fs.access(settingsPath);
    } catch {
      // 文件不存在，返回默认设置
      return { success: true, settings: null };
    }
    
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);
    console.log('✅ 设置已加载from:', settingsPath);
    return { success: true, settings };
  } catch (error) {
    console.error('❌ 加载设置失败:', error);
    return { success: false, error: error.message };
  }
});

// IPC处理器：获取用户数据目录路径
ipcMain.handle('get-user-data-path', async (event) => {
  return app.getPath('userData');
});

// IPC处理器：保存webhook配置
ipcMain.handle('save-webhooks', async (event, webhooks) => {
  try {
    const userDataPath = app.getPath('userData');
    const webhooksPath = path.join(userDataPath, 'webhooks.json');
    await fs.writeFile(webhooksPath, JSON.stringify(webhooks, null, 2), 'utf8');
    console.log('✅ Webhook配置已保存到:', webhooksPath);
    return { success: true, path: webhooksPath };
  } catch (error) {
    console.error('❌ 保存Webhook配置失败:', error);
    return { success: false, error: error.message };
  }
});

// IPC处理器：加载webhook配置
ipcMain.handle('load-webhooks', async (event) => {
  try {
    const userDataPath = app.getPath('userData');
    const webhooksPath = path.join(userDataPath, 'webhooks.json');
    
    // 检查文件是否存在
    try {
      await fs.access(webhooksPath);
    } catch {
      // 文件不存在，返回空配置
      return { success: true, webhooks: [] };
    }
    
    const data = await fs.readFile(webhooksPath, 'utf8');
    const webhooks = JSON.parse(data);
    console.log('✅ Webhook配置已加载from:', webhooksPath);
    return { success: true, webhooks };
  } catch (error) {
    console.error('❌ 加载Webhook配置失败:', error);
    return { success: false, error: error.message };
  }
}); 