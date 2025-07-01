const { app, BrowserWindow, ipcMain, dialog, Menu, net } = require('electron');
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

// IPC处理器：执行HTTP Webhook
ipcMain.handle('execute-http-webhook', async (event, config, context) => {
  try {
    // 替换变量的函数
    function replaceVariables(template, context) {
      if (typeof template !== 'string') return template;
      return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return context[varName] !== undefined ? context[varName] : match;
      });
    }
    
    // 对象中的变量替换
    function replaceVariablesInObject(obj, context) {
      if (typeof obj === 'string') {
        return replaceVariables(obj, context);
      } else if (Array.isArray(obj)) {
        return obj.map(item => replaceVariablesInObject(item, context));
      } else if (obj && typeof obj === 'object') {
        const result = {};
        Object.keys(obj).forEach(key => {
          result[key] = replaceVariablesInObject(obj[key], context);
        });
        return result;
      }
      return obj;
    }
    
    const url = replaceVariables(config.url, context);
    const method = config.method || 'POST';
    
    // 创建请求选项
    const requestOptions = {
      method: method,
      url: url
    };
    
    // 使用Electron的net模块创建请求
    const request = net.request(requestOptions);
    
    // 设置请求头
    if (config.headers) {
      Object.keys(config.headers).forEach(key => {
        const value = replaceVariables(config.headers[key], context);
        request.setHeader(key, value);
      });
    }
    
    // 处理请求体
    let bodyData = '';
    if (config.body) {
      if (config.body.type === 'multipart') {
        // 处理文件上传 - 使用简单的multipart实现
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
        request.setHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
        
        let formData = '';
        for (const field of config.body.fields) {
          const value = replaceVariables(field.value, context);
          formData += `--${boundary}\r\n`;
          
          if (field.type === 'file' && value) {
            try {
              await fs.access(value);
              const fileContent = await fs.readFile(value);
              const fileName = path.basename(value);
              formData += `Content-Disposition: form-data; name="${field.name}"; filename="${fileName}"\r\n`;
              formData += `Content-Type: application/octet-stream\r\n\r\n`;
              // 对于二进制文件，我们需要特殊处理
              bodyData = Buffer.concat([
                Buffer.from(formData, 'utf8'),
                fileContent,
                Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
              ]);
              break; // 简化实现，只处理第一个文件
            } catch {
              throw new Error(`文件不存在: ${value}`);
            }
          } else {
            formData += `Content-Disposition: form-data; name="${field.name}"\r\n\r\n`;
            formData += `${value}\r\n`;
          }
        }
        
        if (!bodyData) {
          formData += `--${boundary}--\r\n`;
          bodyData = formData;
        }
        
      } else if (config.body.type === 'json') {
        request.setHeader('Content-Type', 'application/json');
        bodyData = JSON.stringify(replaceVariablesInObject(config.body.data, context));
        
      } else if (config.body.type === 'form') {
        // 处理application/x-www-form-urlencoded
        request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        const params = new URLSearchParams();
        for (const field of config.body.fields) {
          const value = replaceVariables(field.value, context);
          params.append(field.name, value);
        }
        bodyData = params.toString();
        
      } else if (config.body.type === 'raw') {
        bodyData = replaceVariables(config.body.data, context);
      }
    }
    
    // 返回Promise包装的请求
    return new Promise((resolve, reject) => {
      let responseData = '';
      let statusCode = 0;
      
      request.on('response', (response) => {
        statusCode = response.statusCode;
        
        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });
        
        response.on('end', () => {
          if (statusCode >= 200 && statusCode < 300) {
            resolve({ 
              success: true, 
              status: statusCode, 
              data: responseData 
            });
          } else {
            resolve({ 
              success: false, 
              error: `HTTP ${statusCode}: ${responseData}` 
            });
          }
        });
      });
      
      request.on('error', (error) => {
        resolve({ 
          success: false, 
          error: `请求失败: ${error.message}` 
        });
      });
      
      // 发送请求体
      if (bodyData) {
        if (Buffer.isBuffer(bodyData)) {
          request.write(bodyData);
        } else {
          request.write(bodyData, 'utf8');
        }
      }
      
      request.end();
    });
    
  } catch (error) {
    console.error('❌ HTTP Webhook执行失败:', error);
    return { success: false, error: error.message };
  }
});

// IPC处理器：执行命令行Webhook
ipcMain.handle('execute-command-webhook', async (event, config, context) => {
  try {
    const { spawn } = require('child_process');
    
    // 替换变量的函数
    function replaceVariables(template, context) {
      if (typeof template !== 'string') return template;
      return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return context[varName] !== undefined ? context[varName] : match;
      });
    }
    
    const command = replaceVariables(config.command, context);
    const args = config.args ? 
      config.args.map(arg => replaceVariables(arg, context)) : [];
    
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code, stdout, stderr });
        } else {
          resolve({ success: false, error: `命令执行失败 (退出码: ${code}): ${stderr}`, code, stdout, stderr });
        }
      });
      
      process.on('error', (error) => {
        resolve({ success: false, error: `命令执行错误: ${error.message}` });
      });
      
      // 设置超时
      const timeout = config.timeout || 30000;
      setTimeout(() => {
        process.kill();
        resolve({ success: false, error: `命令执行超时 (${timeout}ms)` });
      }, timeout);
    });
    
  } catch (error) {
    console.error('❌ 命令Webhook执行失败:', error);
    return { success: false, error: error.message };
  }
}); 