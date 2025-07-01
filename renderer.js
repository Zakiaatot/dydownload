// 页面路由管理
class PageRouter {
    constructor() {
        this.currentPage = 'function';
        this.initEventListeners();
        this.ensureCorrectPageState();
    }
    
    ensureCorrectPageState() {
        // 确保功能页面是活跃的，其他页面不活跃
        const pages = document.querySelectorAll('.page');
        const navItems = document.querySelectorAll('.nav-item');
        
        pages.forEach(page => {
            if (page.id === 'function-page') {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === 'function') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    initEventListeners() {
        // 为所有导航项添加点击事件
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetPage = item.getAttribute('data-page');
                this.navigateTo(targetPage);
            });
        });
    }

    navigateTo(pageName) {
        if (pageName === this.currentPage) return;

        // 更新导航菜单状态
        this.updateNavState(pageName);
        
        // 切换页面
        this.switchPage(pageName);
        
        // 更新当前页面
        this.currentPage = pageName;
    }

    updateNavState(activePage) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const pageName = item.getAttribute('data-page');
            if (pageName === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    switchPage(targetPage) {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            if (page.id === targetPage + '-page') {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        // 如果是设置页面且尚未初始化，才加载设置
        if (targetPage === 'settings' && window.settingsManager && !window.settingsManager.isInitialized) {
            window.settingsManager.loadSettings().catch(console.error);
            window.settingsManager.isInitialized = true;
        }
    }
}

// 当DOM加载完成后初始化路由
document.addEventListener('DOMContentLoaded', async () => {
    // 显示加载页面，隐藏主应用
    const loadingScreen = document.getElementById('loading-screen');
    const mainApp = document.getElementById('main-app');
    const loadingText = document.querySelector('.loading-text');
    
    try {
        // 更新加载状态
        loadingText.textContent = '正在初始化路由...';
        await sleep(300);
        
        const router = new PageRouter();
        
        // 更新加载状态
        loadingText.textContent = '正在加载界面效果...';
        await sleep(200);
        
        // 添加一些交互效果
        addInteractionEffects();
        
        // 更新加载状态
        loadingText.textContent = '正在检测运行环境...';
        await sleep(200);
        
        // 检测并显示开发模式
        checkDevMode();
        
        // 更新加载状态
        loadingText.textContent = '正在初始化功能模块...';
        await sleep(300);
        
        // 初始化剪贴板监听功能（包含设置加载）
        await initClipboardMonitor();
        
        // 更新加载状态
        loadingText.textContent = '启动完成！';
        await sleep(300);
        
        // 确保主应用已准备好显示
        mainApp.style.opacity = '0';
        mainApp.style.display = 'flex';
        
        // 延迟一帧确保DOM更新完成
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // 隐藏加载页面，显示主应用
        loadingScreen.classList.add('hidden');
        mainApp.style.transition = 'opacity 0.3s ease';
        mainApp.style.opacity = '1';
        
        // 等待过渡动画完成后完全移除加载页面
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainApp.style.transition = '';
        }, 500);
        
        console.log('🚀 应用启动完成！');
        
    } catch (error) {
        console.error('❌ 应用启动失败:', error);
        loadingText.textContent = '启动失败，请重试...';
        
        // 即使出错也要显示主应用
        setTimeout(() => {
            mainApp.style.opacity = '0';
            mainApp.style.display = 'flex';
            requestAnimationFrame(() => {
                loadingScreen.classList.add('hidden');
                mainApp.style.transition = 'opacity 0.3s ease';
                mainApp.style.opacity = '1';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    mainApp.style.transition = '';
                }, 500);
            });
        }, 2000);
    }
});

// 睡眠函数，用于模拟加载时间
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 添加交互效果
function addInteractionEffects() {
    // 为导航项添加悬浮效果
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            if (!item.classList.contains('active')) {
                item.style.transform = 'translateY(-2px)';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            if (!item.classList.contains('active')) {
                item.style.transform = 'translateY(0)';
            }
        });
    });
}

// 检测开发模式
function checkDevMode() {
    // 通过检查是否存在开发者工具或特定的开发环境变量来判断
    const isDevMode = window.devUtils || 
                     (typeof process !== 'undefined' && process.argv && process.argv.includes('--dev'));
    
    if (isDevMode) {
        const devIndicator = document.getElementById('dev-indicator');
        if (devIndicator) {
            devIndicator.style.display = 'block';
            
            // 添加点击事件来切换开发者工具
            devIndicator.addEventListener('click', () => {
                if (window.devUtils) {
                    window.devUtils.info();
                }
            });
            
            // 添加悬浮提示
            devIndicator.title = '点击查看开发信息 | 热加载已启用';
        }
        
        console.log('🔥 热加载已启用！修改文件会自动刷新页面');
    }
}

// 剪贴板监听功能
class ClipboardMonitor {
    constructor() {
        this.isMonitoring = false;
        this.intervalId = null;
        this.lastClipboardContent = '';
        this.clipboardHistory = [];
        this.douyinHistory = [];
        this.maxHistory = 50; // 最多保存50条记录
        this.interval = 500; // 默认监听间隔
        
        // 抖音链接正则表达式
        this.douyinRegex = /https:\/\/v\.douyin\.com\/[A-Za-z0-9\-_]+\/?/g;
        
        // 获取DOM元素
        this.toggle = document.getElementById('clipboard-toggle');
        this.statusLabel = document.getElementById('switch-status');
        this.display = document.getElementById('clipboard-display');
        this.clearBtn = document.getElementById('clear-clipboard');
        this.douyinDisplay = document.getElementById('douyin-display');
        this.clearDouyinBtn = document.getElementById('clear-douyin');
        
        this.initEvents();
    }
    
    initEvents() {
        // 开关切换事件
        this.toggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startMonitoring();
            } else {
                this.stopMonitoring();
            }
        });
        
        // 清空剪贴板按钮事件
        this.clearBtn?.addEventListener('click', () => {
            this.clearHistory();
        });
        
        // 清空抖音链接按钮事件
        this.clearDouyinBtn?.addEventListener('click', () => {
            this.clearDouyinHistory();
        });
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        try {
            // 检查是否有clipboard API
            const { clipboard } = require('electron');
            
            this.isMonitoring = true;
            this.statusLabel.textContent = '停止监听';
            
            // 初始读取一次剪贴板内容
            this.checkClipboard();
            
            // 使用设置中的监听间隔，默认500ms
            const interval = window.settingsManager?.settings.monitorInterval || 500;
            this.intervalId = setInterval(() => {
                this.checkClipboard();
            }, interval);
            
            console.log('📋 剪贴板监听已开始');
            
        } catch (error) {
            console.error('❌ 无法启动剪贴板监听:', error);
            this.toggle.checked = false;
            alert('无法访问剪贴板，请确保应用有相应权限');
        }
    }
    
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        this.statusLabel.textContent = '开始监听';
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('📋 剪贴板监听已停止');
    }
    
    checkClipboard() {
        try {
            const { clipboard } = require('electron');
            const currentContent = clipboard.readText();
            
            // 如果内容有变化且不为空
            if (currentContent && currentContent !== this.lastClipboardContent) {
                this.lastClipboardContent = currentContent;
                
                // 添加到剪贴板历史
                this.addToHistory(currentContent);
                
                // 检查是否包含抖音链接
                this.checkDouyinLinks(currentContent);
                
                // 更新显示
                this.updateDisplay();
                this.updateDouyinDisplay();
            }
        } catch (error) {
            console.error('❌ 读取剪贴板失败:', error);
        }
    }
    
    addToHistory(content) {
        const timestamp = new Date();
        const item = {
            content: content.trim(),
            timestamp: timestamp,
            id: Date.now()
        };
        
        // 避免重复内容
        const isDuplicate = this.clipboardHistory.some(
            historyItem => historyItem.content === item.content
        );
        
        if (!isDuplicate) {
            this.clipboardHistory.unshift(item);
            
            // 限制历史记录数量
            if (this.clipboardHistory.length > this.maxHistory) {
                this.clipboardHistory = this.clipboardHistory.slice(0, this.maxHistory);
            }
        }
    }
    
    updateDisplay() {
        if (!this.display) return;
        
        if (this.clipboardHistory.length === 0) {
            this.display.innerHTML = '<p class="empty-state">暂无剪贴板内容</p>';
            this.clearBtn.disabled = true;
            return;
        }
        
        this.clearBtn.disabled = false;
        
        const historyHtml = this.clipboardHistory.map(item => {
            const timeStr = this.formatTime(item.timestamp);
            const contentPreview = this.formatContent(item.content);
            
            return `
                <div class="clipboard-item" data-id="${item.id}">
                    <div class="timestamp">${timeStr}</div>
                    <div class="content">${contentPreview}</div>
                </div>
            `;
        }).join('');
        
        this.display.innerHTML = historyHtml;
        
        // 滚动到顶部显示最新内容
        this.display.scrollTop = 0;
    }
    
    formatTime(timestamp) {
        return timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    formatContent(content) {
        // 转义HTML字符
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // 限制显示长度
        if (escaped.length > 200) {
            return escaped.substring(0, 200) + '...';
        }
        
        return escaped;
    }
    
    formatVideoUrl(url) {
        // 简化视频URL显示，只显示关键部分
        if (url.length > 60) {
            const start = url.substring(0, 30);
            const end = url.substring(url.length - 20);
            return start + '...' + end;
        }
        return url;
    }
    
    clearHistory() {
        this.clipboardHistory = [];
        this.lastClipboardContent = '';
        this.updateDisplay();
        console.log('🗑️ 剪贴板历史已清空');
    }
    
    checkDouyinLinks(content) {
        // 重置正则表达式的lastIndex
        this.douyinRegex.lastIndex = 0;
        
        const matches = content.match(this.douyinRegex);
        if (matches && matches.length > 0) {
            matches.forEach(link => {
                this.addToDouyinHistory(link, content);
            });
        }
    }
    
    addToDouyinHistory(link, originalContent) {
        const timestamp = new Date();
        
        // 检查是否已存在相同链接
        const isDuplicate = this.douyinHistory.some(
            item => item.link === link
        );
        
        if (!isDuplicate) {
            const item = {
                link: link,
                originalContent: originalContent.trim(),
                timestamp: timestamp,
                id: Date.now(),
                status: 'parsing', // 解析状态：parsing, success, error
                videoUrl: null,
                error: null
            };
            
            this.douyinHistory.unshift(item);
            
            // 限制历史记录数量
            if (this.douyinHistory.length > this.maxHistory) {
                this.douyinHistory = this.douyinHistory.slice(0, this.maxHistory);
            }
            
            console.log('🎵 发现抖音链接:', link);
            
            // 异步解析视频URL
            this.parseDouyinVideo(item);
        }
    }
    
    updateDouyinDisplay() {
        if (!this.douyinDisplay) return;
        
        if (this.douyinHistory.length === 0) {
            this.douyinDisplay.innerHTML = '<p class="empty-state">暂无抖音链接</p>';
            this.clearDouyinBtn.disabled = true;
            return;
        }
        
        this.clearDouyinBtn.disabled = false;
        
        const historyHtml = this.douyinHistory.map(item => {
            const timeStr = this.formatTime(item.timestamp);
            let statusHtml = '';
            let videoUrlHtml = '';
            
            // 根据解析状态显示不同内容
            switch (item.status) {
                case 'parsing':
                    statusHtml = '<div class="status parsing">🔄 解析中...</div>';
                    break;
                case 'success':
                    statusHtml = '<div class="status success">✅ 解析成功</div>';
                    if (item.videoUrl) {
                        videoUrlHtml = `<div class="video-url">
                            <span class="label">📹 视频地址:</span>
                            <a href="${item.videoUrl}" class="video-link" target="_blank" title="点击播放视频">${this.formatVideoUrl(item.videoUrl)}</a>
                        </div>`;
                    }
                    break;
                case 'error':
                    statusHtml = `<div class="status error">❌ 解析失败: ${item.error}</div>`;
                    break;
            }
            
            return `
                <div class="douyin-item ${item.status}" data-id="${item.id}">
                    <div class="timestamp">${timeStr}</div>
                    <a href="${item.link}" class="link" target="_blank" title="点击打开原链接">${item.link}</a>
                    ${statusHtml}
                    ${videoUrlHtml}
                </div>
            `;
        }).join('');
        
        this.douyinDisplay.innerHTML = historyHtml;
        
        // 滚动到顶部显示最新内容
        this.douyinDisplay.scrollTop = 0;
    }
    
    extractDescription(content, link) {
        // 移除链接，获取描述文本
        let description = content.replace(this.douyinRegex, '').trim();
        
        // 移除一些常见的无用文本
        description = description.replace(/复制此链接.*?！?$/, '').trim();
        description = description.replace(/^[\d\.\s]+[A-Za-z]*[:\/]*\s*/, '').trim();
        
        // 如果描述太长，截取前100个字符
        if (description.length > 100) {
            description = description.substring(0, 100) + '...';
        }
        
        return description || null;
    }
    
    clearDouyinHistory() {
        this.douyinHistory = [];
        this.updateDouyinDisplay();
        console.log('🗑️ 抖音链接历史已清空');
    }
    
    async parseDouyinVideo(item) {
        try {
            const apiUrl = `https://api.xhus.cn/api/douyin?url=${encodeURIComponent(item.link)}`;
            console.log('🔄 正在解析抖音视频:', item.link);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.code === 200 && data.data && data.data.url) {
                // 解析成功
                item.status = 'success';
                item.videoUrl = data.data.url;
                item.title = data.data.title || null;
                item.author = data.data.author || null;
                console.log('✅ 抖音视频解析成功:', data.data.url);
                
                // 记录成功日志
                if (window.logManager) {
                    window.logManager.addLog(
                        'success',
                        item.originalContent,
                        item.link,
                        item.videoUrl
                    );
                }
                
                // 自动下载视频
                if (window.videoDownloader) {
                    setTimeout(() => {
                        window.videoDownloader.downloadVideo(
                            item.videoUrl,
                            item.originalContent,
                            item.link
                        );
                    }, 1000); // 延迟1秒下载，避免频繁操作
                }
            } else {
                // API返回错误
                throw new Error(data.msg || '解析失败');
            }
            
        } catch (error) {
            // 解析失败
            item.status = 'error';
            item.error = error.message;
            console.error('❌ 抖音视频解析失败:', error.message);
            
            // 记录失败日志
            if (window.logManager) {
                window.logManager.addLog(
                    'error',
                    item.originalContent,
                    item.link,
                    null,
                    error.message
                );
            }
        }
        
        // 更新显示
        this.updateDouyinDisplay();
    }
}

// 日志管理系统
class LogManager {
    constructor() {
        this.logs = [];
        this.maxLogs = 100; // 最多保存100条日志
        
        // 获取DOM元素
        this.display = document.getElementById('logs-display');
        this.clearBtn = document.getElementById('clear-logs');
        this.totalCount = document.getElementById('log-total');
        this.successCount = document.getElementById('log-success');
        this.errorCount = document.getElementById('log-error');
        this.downloadCount = document.getElementById('log-download');
        
        this.initEvents();
    }
    
    initEvents() {
        // 清空日志按钮事件
        this.clearBtn?.addEventListener('click', () => {
            this.clearLogs();
        });
    }
    
    addLog(type, originalText, shareLink, directLink = null, error = null, downloadPath = null, webhookData = null) {
        const timestamp = new Date();
        
        const logItem = {
            id: Date.now(),
            type: type, // 'success', 'error', 'download', 'webhook'
            timestamp: timestamp,
            originalText: originalText,
            shareLink: shareLink,
            directLink: directLink,
            error: error,
            downloadPath: downloadPath,
            webhookData: webhookData
        };
        
        this.logs.unshift(logItem);
        
        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
        
        // 更新显示
        this.updateDisplay();
        this.updateStats();
        
        console.log(`📝 日志记录: ${type === 'success' ? '✅' : type === 'webhook' ? '📡' : '❌'} ${shareLink}`);
    }
    
    updateDisplay() {
        if (!this.display) return;
        
        if (this.logs.length === 0) {
            this.display.innerHTML = '<p class="empty-state">暂无日志信息</p>';
            return;
        }
        
        const logsHtml = this.logs.map(log => {
            const timeStr = this.formatTime(log.timestamp);
            const statusClass = log.type;
            const statusText = log.type === 'success' ? '解析成功' : 
                             log.type === 'error' ? '解析失败' : 
                             log.type === 'download' ? '下载完成' : 
                             log.type === 'webhook' ? 'Webhook执行' : '未知状态';
            
            return `
                <div class="log-item ${statusClass}" data-id="${log.id}">
                    <div class="log-header">
                        <span class="log-time">${timeStr}</span>
                        <span class="log-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="log-content">
                        <div class="log-section">
                            <span class="log-label">📝 原分享文本</span>
                            <div class="log-text original-text" id="original-${log.id}">
                                ${this.formatText(log.originalText)}
                            </div>
                            ${log.originalText.length > 100 ? `<button class="expand-btn" onclick="window.logManager.toggleExpand('${log.id}')">展开全文</button>` : ''}
                        </div>
                        <div class="log-section">
                            <span class="log-label">🔗 分享链接</span>
                            <div class="log-text">
                                <a href="${log.shareLink}" class="log-link" target="_blank">${log.shareLink}</a>
                            </div>
                        </div>
                        ${log.directLink ? `
                        <div class="log-section">
                            <span class="log-label">📹 直链地址</span>
                            <div class="log-text">
                                <a href="${log.directLink}" class="log-link" target="_blank">${this.formatVideoUrl(log.directLink)}</a>
                            </div>
                        </div>
                        ` : ''}
                        ${log.downloadPath ? `
                        <div class="log-section">
                            <span class="log-label">💾 下载路径</span>
                            <div class="log-text">
                                <span style="color: #059669;">${this.formatText(log.downloadPath)}</span>
                            </div>
                        </div>
                        ` : ''}
                        ${log.error ? `
                        <div class="log-section">
                            <span class="log-label">❌ 错误信息</span>
                            <div class="log-text" style="color: #dc2626;">
                                ${this.formatText(log.error)}
                            </div>
                        </div>
                        ` : ''}
                        ${log.webhookData ? `
                        <div class="log-section">
                            <span class="log-label">📡 Webhook信息</span>
                            <div class="log-text">
                                <div style="margin-bottom: 5px;"><strong>名称:</strong> ${this.formatText(log.webhookData.webhookName)}</div>
                                <div style="margin-bottom: 5px;"><strong>状态:</strong> 
                                    <span style="color: ${log.webhookData.status === 'success' ? '#059669' : '#dc2626'};">
                                        ${log.webhookData.status === 'success' ? '✅ 成功' : '❌ 失败'}
                                    </span>
                                </div>
                                <div style="margin-bottom: 5px;"><strong>耗时:</strong> ${log.webhookData.duration}ms</div>
                                ${log.webhookData.attempt > 1 ? `<div style="margin-bottom: 5px;"><strong>尝试次数:</strong> ${log.webhookData.attempt}</div>` : ''}
                                ${log.webhookData.error ? `<div style="color: #dc2626;"><strong>错误:</strong> ${this.formatText(log.webhookData.error)}</div>` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        this.display.innerHTML = logsHtml;
        
        // 滚动到顶部显示最新日志
        this.display.scrollTop = 0;
    }
    
    updateStats() {
        if (!this.totalCount) return;
        
        const total = this.logs.length;
        const success = this.logs.filter(log => log.type === 'success').length;
        const error = this.logs.filter(log => log.type === 'error').length;
        const download = this.logs.filter(log => log.type === 'download').length;
        const webhook = this.logs.filter(log => log.type === 'webhook').length;
        
        this.totalCount.textContent = total;
        this.successCount.textContent = success;
        this.errorCount.textContent = error;
        if (this.downloadCount) {
            this.downloadCount.textContent = download;
        }
        
        // 更新Webhook统计（如果存在）
        const webhookCount = document.getElementById('log-webhook');
        if (webhookCount) {
            webhookCount.textContent = webhook;
        }
    }
    
    toggleExpand(logId) {
        const element = document.getElementById(`original-${logId}`);
        const btn = element.nextElementSibling;
        
        if (element.classList.contains('expanded')) {
            element.classList.remove('expanded');
            btn.textContent = '展开全文';
        } else {
            element.classList.add('expanded');
            btn.textContent = '收起';
        }
    }
    
    formatTime(timestamp) {
        return timestamp.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    formatText(text) {
        // HTML转义
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        return escaped;
    }
    
    formatVideoUrl(url) {
        // 简化视频URL显示
        if (url.length > 80) {
            const start = url.substring(0, 40);
            const end = url.substring(url.length - 30);
            return start + '...' + end;
        }
        return url;
    }
    
    clearLogs() {
        this.logs = [];
        this.updateDisplay();
        this.updateStats();
        console.log('🗑️ 日志已清空');
    }
}

// 设置管理系统
class SettingsManager {
    constructor() {
        this.settings = {
            autoDownload: false,
            downloadPath: '',
            namingRule: 'timestamp',
            monitorInterval: 500,
            maxLogs: 100
        };
        
        // 获取DOM元素
        this.autoDownloadToggle = document.getElementById('auto-download-toggle');
        this.downloadPathInput = document.getElementById('download-path');
        this.selectPathBtn = document.getElementById('select-path');
        this.namingRuleSelect = document.getElementById('naming-rule');
        this.monitorIntervalInput = document.getElementById('monitor-interval');
        this.maxLogsInput = document.getElementById('max-logs');
        this.saveBtn = document.getElementById('save-settings');
        this.resetBtn = document.getElementById('reset-settings');
        this.exportBtn = document.getElementById('export-settings');
        this.importBtn = document.getElementById('import-settings');
        this.currentStatus = document.getElementById('current-status');
        this.lastUpdated = document.getElementById('last-updated');
        
        // Webhook相关元素
        this.addWebhookBtn = document.getElementById('add-webhook');
        this.webhooksList = document.getElementById('webhooks-list');
        
        this.initEvents();
        // 不在构造函数中立即加载设置，而是在需要时才加载
    }
    
    initEvents() {
        // 选择路径按钮
        this.selectPathBtn?.addEventListener('click', () => {
            this.selectDownloadPath();
        });
        
        // 保存设置按钮
        this.saveBtn?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // 重置设置按钮
        this.resetBtn?.addEventListener('click', () => {
            this.resetSettings();
        });
        
        // 导出设置按钮
        this.exportBtn?.addEventListener('click', () => {
            this.exportSettings();
        });
        
        // 导入设置按钮
        this.importBtn?.addEventListener('click', () => {
            this.importSettings();
        });
        
        // 添加Webhook按钮
        this.addWebhookBtn?.addEventListener('click', () => {
            this.showWebhookDialog();
        });
        
        // 实时更新状态
        const inputs = [
            this.autoDownloadToggle,
            this.namingRuleSelect,
            this.monitorIntervalInput,
            this.maxLogsInput
        ];
        
        inputs.forEach(input => {
            input?.addEventListener('change', () => {
                this.updateStatus('已修改');
            });
        });
    }
    
    async selectDownloadPath() {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('show-open-dialog', {
                properties: ['openDirectory'],
                title: '选择视频保存目录'
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
                this.downloadPathInput.value = result.filePaths[0];
                this.updateStatus('已修改');
                console.log('📁 已选择保存目录:', result.filePaths[0]);
            }
        } catch (error) {
            console.error('❌ 选择目录失败:', error);
            alert('无法选择目录，请手动输入路径');
        }
    }
    
    async saveSettings() {
        // 收集设置数据
        this.settings = {
            autoDownload: this.autoDownloadToggle?.checked || false,
            downloadPath: this.downloadPathInput?.value || '',
            namingRule: this.namingRuleSelect?.value || 'timestamp',
            monitorInterval: parseInt(this.monitorIntervalInput?.value) || 500,
            maxLogs: parseInt(this.maxLogsInput?.value) || 100
        };
        
        // 保存到用户目录
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('save-settings', this.settings);
            
            if (result.success) {
                // 应用设置
                this.applySettings();
                
                // 更新状态
                this.updateStatus('已保存');
                this.updateLastUpdated();
                
                console.log('💾 设置已保存到:', result.path);
                console.log('📋 设置内容:', this.settings);
                alert(`设置保存成功！\n保存位置: ${result.path}`);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ 保存设置失败:', error);
            alert(`保存设置失败！\n错误信息: ${error.message}`);
        }
    }
    
    async loadSettings() {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('load-settings');
            
            if (result.success) {
                // 如果有保存的设置，则合并；否则使用默认设置
                if (result.settings) {
                    this.settings = { ...this.settings, ...result.settings };
                    console.log('📖 设置已从用户目录加载:', this.settings);
                } else {
                    console.log('📖 使用默认设置（未找到保存的设置文件）');
                }
            } else {
                console.error('❌ 加载设置失败:', result.error);
            }
            
            // 应用到界面
            if (this.autoDownloadToggle) {
                this.autoDownloadToggle.checked = this.settings.autoDownload;
            }
            if (this.downloadPathInput) {
                this.downloadPathInput.value = this.settings.downloadPath;
            }
            if (this.namingRuleSelect) {
                this.namingRuleSelect.value = this.settings.namingRule;
            }
            if (this.monitorIntervalInput) {
                this.monitorIntervalInput.value = this.settings.monitorInterval;
            }
            if (this.maxLogsInput) {
                this.maxLogsInput.value = this.settings.maxLogs;
            }
            
            // 应用设置
            this.applySettings();
            
            // 加载并显示webhook配置
            await this.loadWebhookDisplay();
            
            // 更新状态
            this.updateStatus('已加载');
            
        } catch (error) {
            console.error('❌ 加载设置失败:', error);
        }
    }
    
    applySettings() {
        // 应用监听间隔设置
        if (window.clipboardMonitor) {
            const oldInterval = window.clipboardMonitor.interval || 500;
            window.clipboardMonitor.interval = this.settings.monitorInterval;
            
            // 如果监听间隔改变且正在监听，重新启动监听器
            if (oldInterval !== this.settings.monitorInterval && window.clipboardMonitor.isMonitoring) {
                console.log(`🔄 监听间隔已更新: ${oldInterval}ms → ${this.settings.monitorInterval}ms`);
                window.clipboardMonitor.stopMonitoring();
                setTimeout(() => {
                    window.clipboardMonitor.startMonitoring();
                }, 100); // 稍微延迟重启
            }
        }
        
        // 应用最大日志数设置
        if (window.logManager) {
            window.logManager.maxLogs = this.settings.maxLogs;
        }
    }
    
    resetSettings() {
        if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
            this.settings = {
                autoDownload: false,
                downloadPath: '',
                namingRule: 'timestamp',
                monitorInterval: 500,
                maxLogs: 100
            };
            
            this.loadSettings();
            this.updateStatus('已重置');
            console.log('🔄 设置已重置');
        }
    }
    
    exportSettings() {
        try {
            const dataStr = JSON.stringify(this.settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'dydownload_settings.json';
            link.click();
            
            URL.revokeObjectURL(url);
            console.log('📤 设置已导出');
            
        } catch (error) {
            console.error('❌ 导出设置失败:', error);
            alert('导出设置失败！');
        }
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const settings = JSON.parse(e.target.result);
                    this.settings = { ...this.settings, ...settings };
                    this.loadSettings().catch(console.error);
                    this.updateStatus('已导入');
                    console.log('📥 设置已导入:', settings);
                    alert('设置导入成功！');
                    
                } catch (error) {
                    console.error('❌ 导入设置失败:', error);
                    alert('导入设置失败，文件格式错误！');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    updateStatus(status) {
        if (this.currentStatus) {
            this.currentStatus.textContent = status;
        }
    }
    
    updateLastUpdated() {
        if (this.lastUpdated) {
            this.lastUpdated.textContent = new Date().toLocaleString('zh-CN');
        }
    }
    
    // ========== Webhook管理方法 ==========
    
    async loadWebhookDisplay() {
        if (!window.webhookManager || !this.webhooksList) return;
        
        // 等待webhook管理器加载完成
        if (!window.webhookManager.isLoaded) {
            console.log('⏳ 等待Webhook配置加载...');
            // 简单的轮询等待
            let attempts = 0;
            while (!window.webhookManager.isLoaded && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
        
        const webhooks = window.webhookManager.webhooks;
        console.log('🔄 刷新Webhook显示，共', webhooks.length, '个配置');
        
        if (webhooks.length === 0) {
            this.webhooksList.innerHTML = '<p class="empty-state">暂无Webhook配置</p>';
            return;
        }
        
        const webhooksHtml = webhooks.map(webhook => this.createWebhookItemHtml(webhook)).join('');
        this.webhooksList.innerHTML = webhooksHtml;
        
        // 绑定事件
        this.bindWebhookEvents();
    }
    
    createWebhookItemHtml(webhook) {
        return `
            <div class="webhook-item ${webhook.enabled ? '' : 'disabled'}" data-id="${webhook.id}">
                <div class="webhook-header">
                    <div class="webhook-title-section">
                        <h4 class="webhook-title">${webhook.name}</h4>
                        <span class="webhook-type ${webhook.type}">${webhook.type.toUpperCase()}</span>
                    </div>
                    <div class="webhook-controls">
                        <div class="webhook-actions">
                            <button class="webhook-btn test" data-action="test">测试</button>
                            <button class="webhook-btn edit" data-action="edit">编辑</button>
                            <button class="webhook-btn delete" data-action="delete">删除</button>
                        </div>
                        <div class="webhook-toggle">
                            <label class="switch">
                                <input type="checkbox" ${webhook.enabled ? 'checked' : ''} data-action="toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="webhook-details">
                    <div class="webhook-detail">
                        <strong>触发:</strong> ${this.getTriggerText(webhook.trigger)}
                    </div>
                    <div class="webhook-detail">
                        <strong>重试:</strong> ${webhook.retry.enabled ? `最多${webhook.retry.maxAttempts}次` : '禁用'}
                    </div>
                    ${webhook.type === 'http' ? `
                    <div class="webhook-detail">
                        <strong>URL:</strong> ${webhook.config.url || '未配置'}
                    </div>
                    <div class="webhook-detail">
                        <strong>方法:</strong> ${webhook.config.method || 'POST'}
                    </div>
                    ` : ''}
                    ${webhook.type === 'command' ? `
                    <div class="webhook-detail">
                        <strong>命令:</strong> ${webhook.config.command || '未配置'}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    bindWebhookEvents() {
        const webhookItems = this.webhooksList.querySelectorAll('.webhook-item');
        
        webhookItems.forEach(item => {
            const webhookId = item.dataset.id;
            
            // 测试按钮
            const testBtn = item.querySelector('[data-action="test"]');
            testBtn?.addEventListener('click', () => this.testWebhook(webhookId));
            
            // 编辑按钮
            const editBtn = item.querySelector('[data-action="edit"]');
            editBtn?.addEventListener('click', () => this.editWebhook(webhookId));
            
            // 删除按钮
            const deleteBtn = item.querySelector('[data-action="delete"]');
            deleteBtn?.addEventListener('click', () => this.deleteWebhook(webhookId));
            
            // 开关切换
            const toggle = item.querySelector('[data-action="toggle"]');
            toggle?.addEventListener('change', (e) => this.toggleWebhook(webhookId, e.target.checked));
        });
    }
    
    getTriggerText(trigger) {
        const triggerMap = {
            'download_complete': '下载完成',
            'parse_success': '解析成功',
            'parse_error': '解析失败'
        };
        return triggerMap[trigger] || trigger;
    }
    
    showWebhookDialog(webhook = null) {
        // 创建简单的输入对话框
        this.createInputDialog(webhook);
    }
    
    createInputDialog(webhook = null) {
        // 移除已存在的对话框
        const existingDialog = document.getElementById('simple-webhook-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        const isEdit = !!webhook;
        const title = isEdit ? '编辑Webhook' : '添加Webhook';
        
        // 创建对话框
        const dialog = document.createElement('div');
        dialog.id = 'simple-webhook-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            overflow-y: auto;
        `;
        
        dialog.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                padding: 24px;
                width: 600px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                margin: 20px auto;
            ">
                <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">${title}</h3>
                
                <div class="form-row" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">名称</label>
                    <input type="text" id="webhook-name-input" placeholder="请输入Webhook名称" 
                           value="${webhook ? webhook.name || '' : ''}"
                           style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                </div>
                
                <div class="form-row" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">触发条件</label>
                    <select id="webhook-trigger-select" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                        <option value="download_complete" ${!webhook || webhook.trigger === 'download_complete' ? 'selected' : ''}>下载完成</option>
                        <option value="parse_success" ${webhook?.trigger === 'parse_success' ? 'selected' : ''}>解析成功</option>
                        <option value="parse_error" ${webhook?.trigger === 'parse_error' ? 'selected' : ''}>解析失败</option>
                    </select>
                </div>
                
                <div class="form-row" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">请求方式</label>
                    <select id="webhook-method-select" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                        <option value="POST" ${!webhook || webhook.config?.method === 'POST' ? 'selected' : ''}>POST</option>
                        <option value="GET" ${webhook?.config?.method === 'GET' ? 'selected' : ''}>GET</option>
                        <option value="PUT" ${webhook?.config?.method === 'PUT' ? 'selected' : ''}>PUT</option>
                        <option value="PATCH" ${webhook?.config?.method === 'PATCH' ? 'selected' : ''}>PATCH</option>
                        <option value="DELETE" ${webhook?.config?.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
                    </select>
                </div>
                
                <div class="form-row" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">URL</label>
                    <input type="text" id="webhook-url-input" placeholder="http://your-server.com/api/upload" 
                           value="${webhook?.config?.url || ''}"
                           style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                </div>
                
                <div class="form-row" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">请求头 (可选)</label>
                    <div id="headers-container" style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; min-height: 40px;">
                        ${this.renderHeaders(webhook?.config?.headers)}
                    </div>
                    <button type="button" id="add-header-btn" style="
                        margin-top: 8px;
                        padding: 4px 8px;
                        border: 1px solid #d1d5db;
                        background: #f9fafb;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">+ 添加请求头</button>
                </div>
                
                <div class="form-row" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">请求体类型</label>
                    <select id="webhook-body-type-select" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
                        <option value="multipart" ${!webhook || webhook.config?.body?.type === 'multipart' ? 'selected' : ''}>文件上传 (multipart/form-data)</option>
                        <option value="json" ${webhook?.config?.body?.type === 'json' ? 'selected' : ''}>JSON</option>
                        <option value="form" ${webhook?.config?.body?.type === 'form' ? 'selected' : ''}>表单 (application/x-www-form-urlencoded)</option>
                        <option value="raw" ${webhook?.config?.body?.type === 'raw' ? 'selected' : ''}>原始文本</option>
                    </select>
                </div>
                
                <div id="body-config-container" style="margin-bottom: 16px;">
                    ${this.renderBodyConfig(webhook?.config?.body)}
                </div>
                
                <div class="form-row" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">重试设置</label>
                    <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 12px;">
                        <label style="display: flex; align-items: center; margin-bottom: 8px;">
                            <input type="checkbox" id="retry-enabled" ${webhook?.retry?.enabled !== false ? 'checked' : ''} style="margin-right: 8px;">
                            启用重试
                        </label>
                        <div style="display: flex; gap: 12px; margin-top: 8px;">
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #6b7280;">最大重试次数</label>
                                <input type="number" id="retry-attempts" value="${webhook?.retry?.maxAttempts || 3}" min="1" max="10" 
                                       style="width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #6b7280;">重试延迟(ms)</label>
                                <input type="number" id="retry-delay" value="${webhook?.retry?.delay || 1000}" min="100" step="100" 
                                       style="width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box;">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-row" style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">可用变量</label>
                    <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 12px; line-height: 1.5;">
                        <code style="color: #059669;">{{filePath}}</code> - 文件完整路径<br>
                        <code style="color: #059669;">{{fileName}}</code> - 文件名<br>
                        <code style="color: #059669;">{{fileSize}}</code> - 文件大小(字节)<br>
                        <code style="color: #059669;">{{originalText}}</code> - 原始剪贴板内容<br>
                        <code style="color: #059669;">{{shareLink}}</code> - 分享链接<br>
                        <code style="color: #059669;">{{videoUrl}}</code> - 视频直链<br>
                        <code style="color: #059669;">{{timestamp}}</code> - 时间戳<br>
                        <code style="color: #059669;">{{dateTime}}</code> - 日期时间
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="webhook-test-btn" style="
                        padding: 8px 16px;
                        border: 1px solid #f59e0b;
                        background: #fef3c7;
                        color: #92400e;
                        border-radius: 6px;
                        cursor: pointer;
                    ">测试</button>
                    <button id="webhook-cancel-btn" style="
                        padding: 8px 16px;
                        border: 1px solid #d1d5db;
                        background: white;
                        border-radius: 6px;
                        cursor: pointer;
                        color: #374151;
                    ">取消</button>
                    <button id="webhook-save-btn" style="
                        padding: 8px 16px;
                        border: none;
                        background: #3b82f6;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                    ">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        this.bindDialogEvents(dialog, webhook);
        return dialog;
    }
    
    renderHeaders(headers) {
        if (!headers || Object.keys(headers).length === 0) {
            return '<div style="color: #9ca3af; font-style: italic;">暂无请求头</div>';
        }
        
        return Object.entries(headers).map(([key, value]) => `
            <div class="header-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <input type="text" value="${key}" placeholder="Header名称" 
                       style="flex: 1; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <input type="text" value="${value}" placeholder="Header值" 
                       style="flex: 2; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <button type="button" onclick="this.parentElement.remove()" style="
                    padding: 2px 6px; 
                    border: 1px solid #ef4444; 
                    background: #fef2f2; 
                    color: #dc2626; 
                    border-radius: 3px; 
                    cursor: pointer;
                    font-size: 12px;
                ">删除</button>
            </div>
        `).join('');
    }
    
    renderBodyConfig(bodyConfig) {
        const type = bodyConfig?.type || 'multipart';
        
        switch (type) {
            case 'multipart':
                return this.renderMultipartConfig(bodyConfig);
            case 'json':
                return this.renderJsonConfig(bodyConfig);
            case 'form':
                return this.renderFormConfig(bodyConfig);
            case 'raw':
                return this.renderRawConfig(bodyConfig);
            default:
                return this.renderMultipartConfig(bodyConfig);
        }
    }
    
    renderMultipartConfig(bodyConfig) {
        const fields = bodyConfig?.fields || [
            { name: 'files', type: 'file', value: '{{filePath}}' },
            { name: 'path', type: 'text', value: '/轻速2.0' }
        ];
        
        return `
            <div id="multipart-config">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">字段配置</label>
                <div id="fields-container" style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; min-height: 60px;">
                    ${fields.map(field => this.renderFieldConfig(field)).join('')}
                </div>
                <button type="button" id="add-field-btn" style="
                    margin-top: 8px;
                    padding: 4px 8px;
                    border: 1px solid #d1d5db;
                    background: #f9fafb;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">+ 添加字段</button>
            </div>
        `;
    }
    
    renderFieldConfig(field) {
        return `
            <div class="field-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <input type="text" value="${field.name || ''}" placeholder="字段名" 
                       style="flex: 1; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <select style="flex: 1; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                    <option value="text" ${field.type === 'text' ? 'selected' : ''}>文本</option>
                    <option value="file" ${field.type === 'file' ? 'selected' : ''}>文件</option>
                </select>
                <input type="text" value="${field.value || ''}" placeholder="值/变量" 
                       style="flex: 2; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <button type="button" onclick="this.parentElement.remove()" style="
                    padding: 2px 6px; 
                    border: 1px solid #ef4444; 
                    background: #fef2f2; 
                    color: #dc2626; 
                    border-radius: 3px; 
                    cursor: pointer;
                    font-size: 12px;
                ">删除</button>
            </div>
        `;
    }
    
    renderJsonConfig(bodyConfig) {
        const data = bodyConfig?.data ? JSON.stringify(bodyConfig.data, null, 2) : '{\n  "message": "{{originalText}}",\n  "filePath": "{{filePath}}"\n}';
        
        return `
            <div id="json-config">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">JSON数据</label>
                <textarea id="json-data" style="
                    width: 100%; 
                    height: 120px; 
                    padding: 8px; 
                    border: 1px solid #d1d5db; 
                    border-radius: 6px; 
                    font-family: 'Monaco', 'Consolas', monospace; 
                    font-size: 12px;
                    box-sizing: border-box;
                " placeholder="请输入JSON数据">${data}</textarea>
            </div>
        `;
    }
    
    renderFormConfig(bodyConfig) {
        const fields = bodyConfig?.fields || [
            { name: 'message', value: '{{originalText}}' },
            { name: 'filePath', value: '{{filePath}}' }
        ];
        
        return `
            <div id="form-config">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">表单字段</label>
                <div id="form-fields-container" style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; min-height: 60px;">
                    ${fields.map(field => this.renderFormFieldConfig(field)).join('')}
                </div>
                <button type="button" id="add-form-field-btn" style="
                    margin-top: 8px;
                    padding: 4px 8px;
                    border: 1px solid #d1d5db;
                    background: #f9fafb;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">+ 添加字段</button>
            </div>
        `;
    }
    
    renderFormFieldConfig(field) {
        return `
            <div class="form-field-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <input type="text" value="${field.name || ''}" placeholder="字段名" 
                       style="flex: 1; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <input type="text" value="${field.value || ''}" placeholder="值/变量" 
                       style="flex: 2; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <button type="button" onclick="this.parentElement.remove()" style="
                    padding: 2px 6px; 
                    border: 1px solid #ef4444; 
                    background: #fef2f2; 
                    color: #dc2626; 
                    border-radius: 3px; 
                    cursor: pointer;
                    font-size: 12px;
                ">删除</button>
            </div>
        `;
    }
    
    renderRawConfig(bodyConfig) {
        const data = bodyConfig?.data || '{{originalText}}';
        
        return `
            <div id="raw-config">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">原始数据</label>
                <textarea id="raw-data" style="
                    width: 100%; 
                    height: 80px; 
                    padding: 8px; 
                    border: 1px solid #d1d5db; 
                    border-radius: 6px; 
                    font-family: 'Monaco', 'Consolas', monospace; 
                    font-size: 12px;
                    box-sizing: border-box;
                " placeholder="请输入原始数据">${data}</textarea>
            </div>
        `;
    }
    
    bindDialogEvents(dialog, webhook) {
        // 基本按钮事件
        document.getElementById('webhook-cancel-btn').onclick = () => {
            dialog.remove();
        };
        
        document.getElementById('webhook-save-btn').onclick = () => {
            this.saveAdvancedWebhook(webhook, dialog);
        };
        
        document.getElementById('webhook-test-btn').onclick = () => {
            this.testWebhookFromDialog(dialog);
        };
        
        // 请求体类型切换
        document.getElementById('webhook-body-type-select').onchange = (e) => {
            const container = document.getElementById('body-config-container');
            container.innerHTML = this.renderBodyConfig({ type: e.target.value });
            this.bindBodyConfigEvents();
        };
        
        // 添加请求头
        document.getElementById('add-header-btn').onclick = () => {
            const container = document.getElementById('headers-container');
            const headerItem = document.createElement('div');
            headerItem.className = 'header-item';
            headerItem.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
            headerItem.innerHTML = `
                <input type="text" placeholder="Header名称" 
                       style="flex: 1; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <input type="text" placeholder="Header值" 
                       style="flex: 2; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px;">
                <button type="button" onclick="this.parentElement.remove()" style="
                    padding: 2px 6px; 
                    border: 1px solid #ef4444; 
                    background: #fef2f2; 
                    color: #dc2626; 
                    border-radius: 3px; 
                    cursor: pointer;
                    font-size: 12px;
                ">删除</button>
            `;
            container.appendChild(headerItem);
        };
        
        // 点击背景关闭
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        };
        
        // 绑定body配置事件
        this.bindBodyConfigEvents();
        
        // 聚焦到名称输入框
        setTimeout(() => {
            document.getElementById('webhook-name-input').focus();
        }, 100);
    }
    
    bindBodyConfigEvents() {
        // 添加multipart字段
        const addFieldBtn = document.getElementById('add-field-btn');
        if (addFieldBtn) {
            addFieldBtn.onclick = () => {
                const container = document.getElementById('fields-container');
                const fieldItem = document.createElement('div');
                fieldItem.className = 'field-item';
                fieldItem.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
                fieldItem.innerHTML = this.renderFieldConfig({ name: '', type: 'text', value: '' }).replace('<div class="field-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">', '').replace('</div>', '');
                container.appendChild(fieldItem);
            };
        }
        
        // 添加form字段
        const addFormFieldBtn = document.getElementById('add-form-field-btn');
        if (addFormFieldBtn) {
            addFormFieldBtn.onclick = () => {
                const container = document.getElementById('form-fields-container');
                const fieldItem = document.createElement('div');
                fieldItem.className = 'form-field-item';
                fieldItem.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
                fieldItem.innerHTML = this.renderFormFieldConfig({ name: '', value: '' }).replace('<div class="form-field-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">', '').replace('</div>', '');
                container.appendChild(fieldItem);
            };
        }
    }

    saveAdvancedWebhook(webhook, dialog) {
        try {
            const name = document.getElementById('webhook-name-input').value.trim();
            const url = document.getElementById('webhook-url-input').value.trim();
            const trigger = document.getElementById('webhook-trigger-select').value;
            const method = document.getElementById('webhook-method-select').value;
            const bodyType = document.getElementById('webhook-body-type-select').value;
            
            if (!name) {
                alert('请输入Webhook名称');
                return;
            }
            
            if (!url) {
                alert('请输入URL');
                return;
            }
            
            // 收集headers
            const headers = {};
            const headerItems = document.querySelectorAll('#headers-container .header-item');
            headerItems.forEach(item => {
                const inputs = item.querySelectorAll('input');
                if (inputs.length === 2 && inputs[0].value.trim() && inputs[1].value.trim()) {
                    headers[inputs[0].value.trim()] = inputs[1].value.trim();
                }
            });
            
            // 收集body配置
            let bodyConfig = null;
            switch (bodyType) {
                case 'multipart':
                    bodyConfig = this.collectMultipartConfig();
                    break;
                case 'json':
                    bodyConfig = this.collectJsonConfig();
                    break;
                case 'form':
                    bodyConfig = this.collectFormConfig();
                    break;
                case 'raw':
                    bodyConfig = this.collectRawConfig();
                    break;
            }
            
            // 收集重试配置
            const retryEnabled = document.getElementById('retry-enabled').checked;
            const maxAttempts = parseInt(document.getElementById('retry-attempts').value) || 3;
            const delay = parseInt(document.getElementById('retry-delay').value) || 1000;
            
            const webhookConfig = {
                name: name,
                type: 'http',
                trigger: trigger,
                config: {
                    url: url,
                    method: method,
                    headers: Object.keys(headers).length > 0 ? headers : undefined,
                    body: bodyConfig
                },
                retry: {
                    enabled: retryEnabled,
                    maxAttempts: maxAttempts,
                    delay: delay
                },
                enabled: true
            };
            
            // 保存或更新webhook
            if (webhook && webhook.id) {
                window.webhookManager.updateWebhook(webhook.id, webhookConfig);
            } else {
                window.webhookManager.addWebhook(webhookConfig);
            }
            
            // 保存到文件并刷新显示
            window.webhookManager.saveWebhooks().then(() => {
                this.loadWebhookDisplay();
                dialog.remove();
                this.showSuccessMessage('✅ Webhook配置已保存！');
            }).catch(error => {
                alert('保存失败: ' + error.message);
            });
        } catch (error) {
            console.error('保存Webhook配置失败:', error);
            alert('保存失败: ' + error.message);
        }
    }
    
    collectMultipartConfig() {
        const fields = [];
        const fieldItems = document.querySelectorAll('#fields-container .field-item');
        fieldItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            const select = item.querySelector('select');
            if (inputs.length >= 2 && select && inputs[0].value.trim()) {
                fields.push({
                    name: inputs[0].value.trim(),
                    type: select.value,
                    value: inputs[1].value.trim()
                });
            }
        });
        
        return {
            type: 'multipart',
            fields: fields
        };
    }
    
    collectJsonConfig() {
        const jsonData = document.getElementById('json-data').value.trim();
        try {
            const parsed = JSON.parse(jsonData);
            return {
                type: 'json',
                data: parsed
            };
        } catch (error) {
            throw new Error('JSON格式错误: ' + error.message);
        }
    }
    
    collectFormConfig() {
        const fields = [];
        const fieldItems = document.querySelectorAll('#form-fields-container .form-field-item');
        fieldItems.forEach(item => {
            const inputs = item.querySelectorAll('input');
            if (inputs.length >= 2 && inputs[0].value.trim()) {
                fields.push({
                    name: inputs[0].value.trim(),
                    value: inputs[1].value.trim()
                });
            }
        });
        
        return {
            type: 'form',
            fields: fields
        };
    }
    
    collectRawConfig() {
        const rawData = document.getElementById('raw-data').value.trim();
        return {
            type: 'raw',
            data: rawData
        };
    }
    
    async testWebhookFromDialog(dialog) {
        try {
            // 收集当前配置
            const name = document.getElementById('webhook-name-input').value.trim() || '测试Webhook';
            const url = document.getElementById('webhook-url-input').value.trim();
            const trigger = document.getElementById('webhook-trigger-select').value;
            const method = document.getElementById('webhook-method-select').value;
            const bodyType = document.getElementById('webhook-body-type-select').value;
            
            if (!url) {
                alert('请先输入URL');
                return;
            }
            
            // 收集headers
            const headers = {};
            const headerItems = document.querySelectorAll('#headers-container .header-item');
            headerItems.forEach(item => {
                const inputs = item.querySelectorAll('input');
                if (inputs.length === 2 && inputs[0].value.trim() && inputs[1].value.trim()) {
                    headers[inputs[0].value.trim()] = inputs[1].value.trim();
                }
            });
            
            // 收集body配置
            let bodyConfig = null;
            try {
                switch (bodyType) {
                    case 'multipart':
                        bodyConfig = this.collectMultipartConfig();
                        break;
                    case 'json':
                        bodyConfig = this.collectJsonConfig();
                        break;
                    case 'form':
                        bodyConfig = this.collectFormConfig();
                        break;
                    case 'raw':
                        bodyConfig = this.collectRawConfig();
                        break;
                }
            } catch (error) {
                alert('配置错误: ' + error.message);
                return;
            }
            
            // 创建测试webhook配置
            const testWebhook = {
                name: name,
                type: 'http',
                trigger: trigger,
                config: {
                    url: url,
                    method: method,
                    headers: Object.keys(headers).length > 0 ? headers : undefined,
                    body: bodyConfig
                },
                retry: {
                    enabled: false,
                    maxAttempts: 1,
                    delay: 1000
                }
            };
            
            // 显示测试中状态
            const testBtn = document.getElementById('webhook-test-btn');
            const originalText = testBtn.textContent;
            testBtn.textContent = '测试中...';
            testBtn.disabled = true;
            
            try {
                const result = await window.webhookManager.testWebhook(testWebhook);
                if (result.success) {
                    this.showSuccessMessage('✅ Webhook测试成功！');
                } else {
                    alert('❌ Webhook测试失败：' + result.error);
                }
            } finally {
                testBtn.textContent = originalText;
                testBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('测试Webhook失败:', error);
            alert('测试失败: ' + error.message);
        }
    }
    
    showSuccessMessage(message) {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            font-size: 14px;
        `;
        successMsg.textContent = message;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    
    // 临时简化 - 后续可以完善UI
    
    async testWebhook(webhookId) {
        const webhook = window.webhookManager.webhooks.find(w => w.id === webhookId);
        if (!webhook) return;
        
        try {
            const result = await window.webhookManager.testWebhook(webhook);
            if (result.success) {
                alert('✅ Webhook测试成功！');
            } else {
                alert('❌ Webhook测试失败：' + result.error);
            }
        } catch (error) {
            alert('❌ Webhook测试出错：' + error.message);
        }
    }
    
    editWebhook(webhookId) {
        const webhook = window.webhookManager.webhooks.find(w => w.id === webhookId);
        if (webhook) {
            this.showWebhookDialog(webhook);
        }
    }
    
    async deleteWebhook(webhookId) {
        const webhook = window.webhookManager.webhooks.find(w => w.id === webhookId);
        if (!webhook) return;
        
        if (confirm(`确定要删除Webhook "${webhook.name}" 吗？`)) {
            window.webhookManager.removeWebhook(webhookId);
            await window.webhookManager.saveWebhooks();
            await this.loadWebhookDisplay();
            console.log('🗑️ Webhook已删除:', webhook.name);
        }
    }
    
    async toggleWebhook(webhookId, enabled) {
        window.webhookManager.updateWebhook(webhookId, { enabled });
        await window.webhookManager.saveWebhooks();
        await this.loadWebhookDisplay();
        console.log(`🔄 Webhook状态已更新: ${enabled ? '启用' : '禁用'}`);
    }
}

// 视频下载管理系统
class VideoDownloader {
    constructor() {
        this.downloading = new Set(); // 正在下载的视频
        this.downloadCount = 0;
    }
    
    async downloadVideo(videoUrl, originalText, shareLink) {
        // 检查设置
        if (!window.settingsManager?.settings.autoDownload) {
            console.log('📥 自动下载已禁用');
            return false;
        }
        
        const downloadPath = window.settingsManager.settings.downloadPath;
        if (!downloadPath) {
            console.log('❌ 未设置下载目录');
            return false;
        }
        
        // 防止重复下载
        if (this.downloading.has(videoUrl)) {
            console.log('⏳ 该视频正在下载中');
            return false;
        }
        
        this.downloading.add(videoUrl);
        this.downloadStartTime = Date.now(); // 记录下载开始时间
        console.log('📥 开始下载视频:', videoUrl);
        
        try {
            const path = require('path');
            const fs = require('fs');
            
            // 生成文件名
            const fileName = this.generateFileName(originalText, shareLink);
            const filePath = path.join(downloadPath, fileName);
            
            // 检查目录是否存在，不存在则创建
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // 下载视频
            const response = await fetch(videoUrl);
            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }
            
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            
            // 保存文件
            fs.writeFileSync(filePath, uint8Array);
            
            this.downloadCount++;
            
            // 记录下载日志
            if (window.logManager) {
                window.logManager.addLog(
                    'download',
                    originalText,
                    shareLink,
                    videoUrl,
                    null,
                    filePath
                );
            }
            
            // 执行下载完成webhooks
            if (window.webhookManager) {
                const webhookContext = {
                    filePath,
                    fileName: require('path').basename(filePath),
                    fileSize: fs.statSync(filePath).size,
                    originalText,
                    shareLink,
                    videoUrl,
                    timestamp: Date.now(),
                    dateTime: new Date().toISOString(),
                    downloadDuration: Date.now() - this.downloadStartTime
                };
                
                // 异步执行webhooks，不阻塞主流程
                window.webhookManager.executeWebhooks('download_complete', webhookContext)
                    .catch(error => console.error('❌ Webhook执行失败:', error));
            }
            
            console.log('✅ 视频下载完成:', filePath);
            return filePath;
            
        } catch (error) {
            console.error('❌ 视频下载失败:', error);
            
            // 记录错误日志
            if (window.logManager) {
                window.logManager.addLog(
                    'error',
                    originalText,
                    shareLink,
                    videoUrl,
                    `下载失败: ${error.message}`
                );
            }
            
            return false;
        } finally {
            this.downloading.delete(videoUrl);
        }
    }
    
    generateFileName(originalText, shareLink) {
        const timestamp = Date.now();
        const settings = window.settingsManager?.settings;
        const rule = settings?.namingRule || 'timestamp';
        
        switch (rule) {
            case 'timestamp':
                return `${timestamp}_douyin_video.mp4`;
                
            case 'title':
                // 尝试从原文中提取标题
                const title = this.extractTitle(originalText);
                return `${title}_${timestamp}.mp4`;
                
            case 'hash':
                // 使用简单的哈希
                const hash = this.simpleHash(shareLink);
                return `${hash}.mp4`;
                
            case 'sequential':
                this.downloadCount++;
                return `video_${this.downloadCount.toString().padStart(4, '0')}_${timestamp}.mp4`;
                
            case 'identifier':
                // 从抖音链接中提取视频标识符
                const identifier = this.extractVideoIdentifier(shareLink);
                return `${identifier}.mp4`;
                
            default:
                return `${timestamp}_douyin_video.mp4`;
        }
    }
    
    extractTitle(text) {
        // 简单的标题提取逻辑
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            let title = lines[0].trim();
            // 移除特殊字符
            title = title.replace(/[\\/:*?"<>|]/g, '_');
            // 限制长度
            if (title.length > 50) {
                title = title.substring(0, 50);
            }
            return title || 'untitled';
        }
        return 'untitled';
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16);
    }
    
    extractVideoIdentifier(shareLink) {
        try {
            // 从抖音链接中提取视频标识符
            // 支持格式: https://v.douyin.com/dd80aeXR4M8/ 或 https://v.douyin.com/dd80aeXR4M8
            const match = shareLink.match(/https:\/\/v\.douyin\.com\/([A-Za-z0-9\-_]+)\/?/);
            if (match && match[1]) {
                return match[1];
            }
            
            // 如果提取失败，返回时间戳作为备选
            console.warn('⚠️ 无法从链接中提取视频标识符:', shareLink);
            return `video_${Date.now()}`;
        } catch (error) {
            console.error('❌ 提取视频标识符失败:', error);
            return `video_${Date.now()}`;
        }
    }
}

// Webhook管理系统
class WebhookManager {
    constructor() {
        this.webhooks = [];
        this.executing = new Set(); // 正在执行的webhook
        this.isLoaded = false;
        this.loadWebhooks().then(() => {
            this.isLoaded = true;
            console.log('📡 WebhookManager初始化完成');
        }).catch(error => {
            console.error('❌ WebhookManager初始化失败:', error);
            this.isLoaded = true; // 即使失败也设置为已加载，避免无限等待
        });
    }
    
    // 加载webhook配置
    async loadWebhooks() {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('load-webhooks');
            
            if (result.success && result.webhooks && Array.isArray(result.webhooks)) {
                this.webhooks = result.webhooks;
                console.log('📡 Webhook配置已加载:', this.webhooks.length, '个', this.webhooks);
            } else {
                this.webhooks = [];
                console.log('📡 未找到已保存的Webhook配置，使用空配置');
            }
        } catch (error) {
            console.error('❌ 加载Webhook配置失败:', error);
            this.webhooks = [];
        }
    }
    
    // 保存webhook配置
    async saveWebhooks() {
        try {
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('save-webhooks', this.webhooks);
            
            if (result.success) {
                console.log('💾 Webhook配置已保存');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ 保存Webhook配置失败:', error);
            return false;
        }
    }
    
    // 添加webhook
    addWebhook(webhookConfig) {
        const webhook = {
            id: this.generateId(),
            name: webhookConfig.name || '未命名Hook',
            enabled: webhookConfig.enabled !== false,
            type: webhookConfig.type || 'http',
            trigger: webhookConfig.trigger || 'download_complete',
            config: webhookConfig.config || {},
            retry: {
                enabled: webhookConfig.retry?.enabled || false,
                maxAttempts: webhookConfig.retry?.maxAttempts || 3,
                delay: webhookConfig.retry?.delay || 1000
            },
            createdAt: Date.now()
        };
        
        this.webhooks.push(webhook);
        return webhook;
    }
    
    // 更新webhook
    updateWebhook(id, updates) {
        const index = this.webhooks.findIndex(w => w.id === id);
        if (index !== -1) {
            this.webhooks[index] = { ...this.webhooks[index], ...updates };
            return this.webhooks[index];
        }
        return null;
    }
    
    // 删除webhook
    removeWebhook(id) {
        const index = this.webhooks.findIndex(w => w.id === id);
        if (index !== -1) {
            return this.webhooks.splice(index, 1)[0];
        }
        return null;
    }
    
    // 执行webhooks
    async executeWebhooks(trigger, context = {}) {
        const activeWebhooks = this.webhooks.filter(w => w.enabled && w.trigger === trigger);
        
        if (activeWebhooks.length === 0) {
            console.log(`📡 没有启用的${trigger}类型webhook`);
            return;
        }
        
        console.log(`📡 执行${activeWebhooks.length}个${trigger}类型webhook`);
        
        // 并行执行所有匹配的webhooks
        const promises = activeWebhooks.map(webhook => this.executeWebhook(webhook, context));
        await Promise.allSettled(promises);
    }
    
    // 执行单个webhook
    async executeWebhook(webhook, context) {
        const executionId = `${webhook.id}-${Date.now()}`;
        
        if (this.executing.has(webhook.id)) {
            console.log(`⏳ Webhook ${webhook.name} 正在执行中，跳过`);
            return;
        }
        
        this.executing.add(webhook.id);
        
        const startTime = Date.now();
        let attempt = 0;
        let lastError = null;
        
        try {
            while (attempt < (webhook.retry.enabled ? webhook.retry.maxAttempts : 1)) {
                attempt++;
                
                try {
                    console.log(`📡 执行Webhook: ${webhook.name} (第${attempt}次尝试)`);
                    
                    const result = await this.performWebhookAction(webhook, context);
                    const duration = Date.now() - startTime;
                    
                    // 记录成功日志
                    this.logWebhookExecution({
                        webhookId: webhook.id,
                        webhookName: webhook.name,
                        trigger: webhook.trigger,
                        status: 'success',
                        duration,
                        attempt,
                        context,
                        result
                    });
                    
                    console.log(`✅ Webhook ${webhook.name} 执行成功 (${duration}ms)`);
                    return result;
                    
                } catch (error) {
                    lastError = error;
                    console.error(`❌ Webhook ${webhook.name} 第${attempt}次执行失败:`, error.message);
                    
                    if (attempt < (webhook.retry.enabled ? webhook.retry.maxAttempts : 1)) {
                        await this.sleep(webhook.retry.delay || 1000);
                    }
                }
            }
            
            // 所有重试都失败了
            const duration = Date.now() - startTime;
            this.logWebhookExecution({
                webhookId: webhook.id,
                webhookName: webhook.name,
                trigger: webhook.trigger,
                status: 'error',
                duration,
                attempt,
                context,
                error: lastError?.message || '未知错误'
            });
            
        } finally {
            this.executing.delete(webhook.id);
        }
    }
    
    // 执行具体的webhook动作
    async performWebhookAction(webhook, context) {
        switch (webhook.type) {
            case 'http':
                return await this.executeHttpWebhook(webhook, context);
            case 'command':
                return await this.executeCommandWebhook(webhook, context);
            default:
                throw new Error(`不支持的webhook类型: ${webhook.type}`);
        }
    }
    
    // 执行HTTP webhook
    async executeHttpWebhook(webhook, context) {
        try {
            // 通过IPC调用主进程执行HTTP请求
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('execute-http-webhook', webhook.config, context);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return { status: result.status, data: result.data };
        } catch (error) {
            throw new Error(`HTTP Webhook执行失败: ${error.message}`);
        }
    }
    
    // 执行命令行webhook
    async executeCommandWebhook(webhook, context) {
        try {
            // 通过IPC调用主进程执行命令
            const { ipcRenderer } = require('electron');
            const result = await ipcRenderer.invoke('execute-command-webhook', webhook.config, context);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return { code: result.code, stdout: result.stdout, stderr: result.stderr };
        } catch (error) {
            throw new Error(`命令Webhook执行失败: ${error.message}`);
        }
    }
    
    // 变量替换
    replaceVariables(template, context) {
        if (typeof template !== 'string') return template;
        
        return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            return context[varName] !== undefined ? context[varName] : match;
        });
    }
    
    // 对象中的变量替换
    replaceVariablesInObject(obj, context) {
        if (typeof obj === 'string') {
            return this.replaceVariables(obj, context);
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.replaceVariablesInObject(item, context));
        } else if (obj && typeof obj === 'object') {
            const result = {};
            Object.keys(obj).forEach(key => {
                result[key] = this.replaceVariablesInObject(obj[key], context);
            });
            return result;
        }
        return obj;
    }
    
    // 记录webhook执行日志
    logWebhookExecution(logData) {
        if (window.logManager) {
            window.logManager.addLog(
                'webhook',
                `Webhook: ${logData.webhookName}`,
                logData.trigger,
                null,
                logData.error,
                null,
                logData
            );
        }
        
        console.log('📡 Webhook执行日志:', logData);
    }
    
    // 测试webhook
    async testWebhook(webhook) {
        const testContext = {
            filePath: '/test/path/video.mp4',
            fileName: 'video.mp4',
            originalText: '测试视频内容',
            shareLink: 'https://v.douyin.com/test',
            timestamp: Date.now(),
            dateTime: new Date().toISOString()
        };
        
        try {
            await this.executeWebhook(webhook, testContext);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // 工具方法
    generateId() {
        return 'webhook-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化剪贴板监听
async function initClipboardMonitor() {
    window.clipboardMonitor = new ClipboardMonitor();
    window.logManager = new LogManager();
    window.videoDownloader = new VideoDownloader();
    window.webhookManager = new WebhookManager();
    
    // 等待webhookManager完全初始化
    let attempts = 0;
    while (!window.webhookManager.isLoaded && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    console.log('🔄 WebhookManager加载完成，开始初始化SettingsManager');
    
    window.settingsManager = new SettingsManager();
    
    // 加载设置（仅在启动时加载一次）
    await window.settingsManager.loadSettings();
    window.settingsManager.isInitialized = true;
}

// 导出路由实例供其他模块使用
window.router = PageRouter; 