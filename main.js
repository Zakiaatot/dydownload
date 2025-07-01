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
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
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
    
    console.log('\n📡 ========== HTTP Webhook 请求开始 ==========');
    console.log(`🆔 请求ID: ${requestId}`);
    console.log(`📍 URL: ${url}`);
    console.log(`🔄 方法: ${method}`);
    console.log(`📅 时间: ${new Date().toLocaleString()}`);
    
    // 记录上下文变量
    console.log('🔧 上下文变量:');
    Object.keys(context).forEach(key => {
      console.log(`   ${key}: ${context[key]}`);
    });
    
    // 记录原始配置
    console.log('⚙️ 原始配置:');
    console.log('   URL模板:', config.url);
    if (config.headers) {
      console.log('   请求头模板:', JSON.stringify(config.headers, null, 2));
    }
    if (config.body) {
      console.log(`   请求体类型: ${config.body.type}`);
      if (config.body.type === 'json') {
        console.log('   请求体数据:', JSON.stringify(config.body.data, null, 2));
      }
    }
    
    // 创建请求选项
    const requestOptions = {
      method: method,
      url: url
    };
    
    // 使用Electron的net模块创建请求
    const request = net.request(requestOptions);
    
    // 处理并记录请求头
    const processedHeaders = {};
    if (config.headers) {
      console.log('\n📋 处理请求头:');
      Object.keys(config.headers).forEach(key => {
        const value = replaceVariables(config.headers[key], context);
        processedHeaders[key] = value;
        request.setHeader(key, value);
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log('\n📋 无自定义请求头');
    }
    
    // 处理请求体
    let bodyData = '';
    console.log('\n📦 处理请求体:');
    
    if (config.body) {
      console.log(`   类型: ${config.body.type}`);
      
      if (config.body.type === 'multipart') {
        // 处理文件上传 - 完整的multipart实现
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
        const contentType = `multipart/form-data; boundary=${boundary}`;
        request.setHeader('Content-Type', contentType);
        console.log(`   Content-Type: ${contentType}`);
        console.log('   字段列表:');
        
        const parts = [];
        let hasFiles = false;
        
        // 处理所有字段
        for (const field of config.body.fields) {
          const value = replaceVariables(field.value, context);
          
          if (field.type === 'file' && value) {
            try {
              await fs.access(value);
              const fileContent = await fs.readFile(value);
              const fileName = path.basename(value);
              console.log(`     📎 ${field.name}:`);
              console.log(`       文件路径: ${value}`);
              console.log(`       文件名: ${fileName}`);
              console.log(`       文件大小: ${fileContent.length} 字节`);
              
              // 构建文件字段的头部
              const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
              parts.push({
                type: 'file',
                header: Buffer.from(fileHeader, 'utf8'),
                content: fileContent,
                footer: Buffer.from('\r\n', 'utf8')
              });
              hasFiles = true;
            } catch (error) {
              console.log(`     ❌ ${field.name}: 文件访问失败`);
              console.log(`       尝试路径: ${value}`);
              console.log(`       错误信息: ${error.message}`);
              throw new Error(`文件不存在: ${value}`);
            }
          } else {
            console.log(`     📝 ${field.name}: "${value}"`);
            
            // 构建文本字段
            const textPart = `--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"\r\n\r\n${value}\r\n`;
            parts.push({
              type: 'text',
              content: Buffer.from(textPart, 'utf8')
            });
          }
        }
        
        // 添加结束边界
        const endBoundary = Buffer.from(`--${boundary}--\r\n`, 'utf8');
        
        // 组装所有部分
        const bufferParts = [];
        for (const part of parts) {
          if (part.type === 'file') {
            bufferParts.push(part.header);
            bufferParts.push(part.content);
            bufferParts.push(part.footer);
          } else {
            bufferParts.push(part.content);
          }
        }
        bufferParts.push(endBoundary);
        
        bodyData = Buffer.concat(bufferParts);
        
      } else if (config.body.type === 'json') {
        const contentType = 'application/json';
        request.setHeader('Content-Type', contentType);
        console.log(`   Content-Type: ${contentType}`);
        const processedData = replaceVariablesInObject(config.body.data, context);
        bodyData = JSON.stringify(processedData);
        console.log(`   JSON数据: ${bodyData}`);
        
      } else if (config.body.type === 'form') {
        // 处理application/x-www-form-urlencoded
        const contentType = 'application/x-www-form-urlencoded';
        request.setHeader('Content-Type', contentType);
        console.log(`   Content-Type: ${contentType}`);
        console.log('   表单字段:');
        
        const params = new URLSearchParams();
        for (const field of config.body.fields) {
          const value = replaceVariables(field.value, context);
          params.append(field.name, value);
          console.log(`     ${field.name}: "${value}"`);
        }
        bodyData = params.toString();
        console.log(`   编码后: ${bodyData}`);
        
      } else if (config.body.type === 'raw') {
        bodyData = replaceVariables(config.body.data, context);
        console.log(`   原始数据: ${bodyData}`);
      }
      
      if (bodyData && !Buffer.isBuffer(bodyData)) {
        console.log(`   数据长度: ${bodyData.length} 字符`);
      } else if (Buffer.isBuffer(bodyData)) {
        console.log(`   数据长度: ${bodyData.length} 字节 (二进制)`);
      }
    } else {
      console.log('   无请求体');
    }
    
    // 发送请求
    console.log('\n🚀 发送请求...');
    
    // 返回Promise包装的请求
    return new Promise((resolve, reject) => {
      let responseData = '';
      let statusCode = 0;
      let responseHeaders = {};
      const startTime = Date.now();
      
      request.on('response', (response) => {
        statusCode = response.statusCode;
        responseHeaders = response.headers || {};
        
        console.log('\n📨 收到响应:');
        console.log(`   状态码: ${statusCode}`);
        console.log(`   响应头:`, JSON.stringify(responseHeaders, null, 2));
        
        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });
        
        response.on('end', () => {
          const duration = Date.now() - startTime;
          
          console.log('\n📄 响应完成:');
          console.log(`   耗时: ${duration}ms`);
          console.log(`   响应体长度: ${responseData.length} 字符`);
          
          // 如果响应体不太长，显示完整内容
          if (responseData.length < 1000) {
            console.log(`   响应体内容: ${responseData}`);
          } else {
            console.log(`   响应体预览: ${responseData.substring(0, 500)}...`);
          }
          
          if (statusCode >= 200 && statusCode < 300) {
            console.log(`✅ [${requestId}] HTTP Webhook 执行成功`);
            console.log('📡 ========================================\n');
            resolve({ 
              success: true, 
              status: statusCode, 
              data: responseData,
              headers: responseHeaders,
              duration: duration
            });
          } else {
            console.log(`❌ [${requestId}] HTTP Webhook 执行失败: HTTP ${statusCode}`);
            console.log('📡 ========================================\n');
            resolve({ 
              success: false, 
              error: `HTTP ${statusCode}: ${responseData}`,
              status: statusCode,
              headers: responseHeaders,
              duration: duration
            });
          }
        });
      });
      
      request.on('error', (error) => {
        const duration = Date.now() - startTime;
        console.log(`\n❌ [${requestId}] 请求错误: ${error.message}`);
        console.log(`   耗时: ${duration}ms`);
        console.log('📡 ========================================\n');
        
        resolve({ 
          success: false, 
          error: `请求失败: ${error.message}`,
          duration: duration
        });
      });
      
      // 发送请求体
      if (bodyData) {
        console.log('📤 发送请求体...');
        if (Buffer.isBuffer(bodyData)) {
          request.write(bodyData);
        } else {
          request.write(bodyData, 'utf8');
        }
      }
      
      request.end();
      console.log('📡 请求已发送，等待响应...');
    });
    
  } catch (error) {
    console.error(`❌ [${requestId}] HTTP Webhook执行失败:`, error);
    console.log('📡 ========================================\n');
    return { success: false, error: error.message };
  }
});

// IPC处理器：执行命令行Webhook
ipcMain.handle('execute-command-webhook', async (event, config, context) => {
  const requestId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
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
    const timeout = config.timeout || 30000;
    
    console.log('\n⚡ ========== 命令 Webhook 执行开始 ==========');
    console.log(`🆔 执行ID: ${requestId}`);
    console.log(`📅 时间: ${new Date().toLocaleString()}`);
    
    // 记录上下文变量
    console.log('🔧 上下文变量:');
    Object.keys(context).forEach(key => {
      console.log(`   ${key}: ${context[key]}`);
    });
    
    // 记录命令信息
    console.log('⚙️ 命令配置:');
    console.log(`   原始命令: ${config.command}`);
    console.log(`   处理后命令: ${command}`);
    if (config.args) {
      console.log(`   原始参数: [${config.args.join(', ')}]`);
      console.log(`   处理后参数: [${args.join(', ')}]`);
    } else {
      console.log(`   参数: 无`);
    }
    console.log(`   超时时间: ${timeout}ms`);
    console.log(`   执行模式: spawn with shell`);
    
    console.log('\n🚀 开始执行命令...');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      let timeoutHandle;
      
      // 设置超时
      timeoutHandle = setTimeout(() => {
        console.log(`⏰ [${requestId}] 命令执行超时，正在终止进程...`);
        process.kill('SIGTERM');
        
        // 如果SIGTERM不起作用，5秒后强制杀死
        setTimeout(() => {
          if (!process.killed) {
            console.log(`🔪 [${requestId}] 强制终止进程`);
            process.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);
      
      console.log(`📊 进程ID: ${process.pid}`);
      
      process.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        console.log(`📤 [${requestId}] stdout: ${chunk.trim()}`);
      });
      
      process.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        console.log(`📥 [${requestId}] stderr: ${chunk.trim()}`);
      });
      
      process.on('close', (code, signal) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;
        
        console.log('\n📄 命令执行完成:');
        console.log(`   耗时: ${duration}ms`);
        console.log(`   退出码: ${code}`);
        if (signal) {
          console.log(`   终止信号: ${signal}`);
        }
        
        if (code === 0) {
          console.log(`✅ [${requestId}] 命令执行成功`);
          
          if (stdout) {
            console.log(`   标准输出 (${stdout.length} 字符):`);
            if (stdout.length < 1000) {
              console.log(stdout.split('\n').map(line => `     ${line}`).join('\n'));
            } else {
              const preview = stdout.substring(0, 500);
              console.log(preview.split('\n').map(line => `     ${line}`).join('\n'));
              console.log(`     ... (输出过长，已截断)`);
            }
          } else {
            console.log(`   标准输出: (无输出)`);
          }
          
          if (stderr) {
            console.log(`   标准错误输出:`);
            console.log(stderr.split('\n').map(line => `     ${line}`).join('\n'));
          }
          
          console.log('⚡ ========================================\n');
          
          resolve({ 
            success: true, 
            code, 
            stdout, 
            stderr,
            duration,
            signal
          });
        } else {
          console.log(`❌ [${requestId}] 命令执行失败:`);
          console.log(`   错误代码: ${code}`);
          
          if (stderr) {
            console.log(`   标准错误输出:`);
            console.log(stderr.split('\n').map(line => `     ${line}`).join('\n'));
          }
          
          if (stdout) {
            console.log(`   标准输出:`);
            console.log(stdout.split('\n').map(line => `     ${line}`).join('\n'));
          }
          
          console.log('⚡ ========================================\n');
          
          resolve({ 
            success: false, 
            error: `命令执行失败 (退出码: ${code}): ${stderr}`, 
            code, 
            stdout, 
            stderr,
            duration,
            signal
          });
        }
      });
      
      process.on('error', (error) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;
        
        console.log(`❌ [${requestId}] 命令执行错误: ${error.message}`);
        console.log(`   耗时: ${duration}ms`);
        console.log('⚡ ========================================\n');
        
        resolve({ 
          success: false, 
          error: `命令执行错误: ${error.message}`,
          duration
        });
      });
    });
    
  } catch (error) {
    console.error(`❌ [${requestId}] 命令Webhook执行失败:`, error);
    console.log('⚡ ========================================\n');
    return { success: false, error: error.message };
  }
}); 