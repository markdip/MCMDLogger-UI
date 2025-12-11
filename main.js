const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const IntegrationManager = require('./integrations');

let mainWindow;
let mcmdProcess = null;
let integrations = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        frame: false,
        transparent: false,
        backgroundColor: '#0a0a0f',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    mainWindow.loadFile('index.html');

    // Initialize integrations
    integrations = new IntegrationManager();
    setupIntegrationHandlers();

    // Open DevTools in development
    // mainWindow.webContents.openDevTools();
}

// Setup integration event handlers
function setupIntegrationHandlers() {
    // Handle remote commands from Discord/Telegram
    integrations.on('remoteCommand', async (data) => {
        if (mcmdProcess && mcmdProcess.stdin.writable) {
            mcmdProcess.stdin.write(data.command + '\n');

            // Collect output for a short time and send back
            let output = '';
            const collector = (chunk) => {
                output += chunk.toString();
            };

            mcmdProcess.stdout.on('data', collector);

            setTimeout(async () => {
                mcmdProcess.stdout.removeListener('data', collector);
                const response = output.trim() || 'Command executed (no output)';

                if (data.platform === 'discord') {
                    await data.message.reply('```\n' + response.substring(0, 1900) + '\n```');
                } else if (data.platform === 'telegram') {
                    await integrations.telegram.sendMessage(data.chatId, response.substring(0, 4000));
                }
            }, 1000);
        } else {
            const msg = '❌ MCmdLogger is not running';
            if (data.platform === 'discord') {
                await data.message.reply(msg);
            } else if (data.platform === 'telegram') {
                await integrations.telegram.sendMessage(data.chatId, msg);
            }
        }
    });

    // Handle status requests
    integrations.on('statusRequest', async (data) => {
        const status = mcmdProcess ? '🟢 Running' : '🔴 Stopped';
        const msg = `MCmdLogger Status: ${status}`;

        if (data.platform === 'discord') {
            await data.message.reply(msg);
        } else if (data.platform === 'telegram') {
            await integrations.telegram.sendMessage(data.chatId, msg);
        }
    });

    // Handle players list requests
    integrations.on('playersRequest', async (data) => {
        if (mcmdProcess && mcmdProcess.stdin.writable) {
            mcmdProcess.stdin.write('list\n');

            let output = '';
            const collector = (chunk) => {
                output += chunk.toString();
            };

            mcmdProcess.stdout.on('data', collector);

            setTimeout(async () => {
                mcmdProcess.stdout.removeListener('data', collector);
                const response = output.trim() || 'No players connected';

                if (data.platform === 'discord') {
                    await data.message.reply('```\n' + response + '\n```');
                } else if (data.platform === 'telegram') {
                    await integrations.telegram.sendMessage(data.chatId, response);
                }
            }, 500);
        } else {
            const msg = '❌ MCmdLogger is not running';
            if (data.platform === 'discord') {
                await data.message.reply(msg);
            } else if (data.platform === 'telegram') {
                await integrations.telegram.sendMessage(data.chatId, msg);
            }
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // Notify about shutdown via integrations
    if (integrations) {
        integrations.notify('processStatus', { status: 'shutting down' });
        integrations.disconnect();
    }

    if (mcmdProcess) {
        mcmdProcess.kill();
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

// Window controls
ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    if (mcmdProcess) {
        mcmdProcess.kill();
    }
    mainWindow.close();
});

// Start MCmdLogger process
ipcMain.on('start-mcmd', (event, { port, targetServer }) => {
    const exePath = path.join(__dirname, 'mcmdlogger-neo.exe');

    try {
        // Start the process hidden (no window)
        mcmdProcess = spawn(exePath, [], {
            windowsHide: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Send initial configuration
        setTimeout(() => {
            // Send port
            mcmdProcess.stdin.write(port + '\n');
            // Send target server
            setTimeout(() => {
                mcmdProcess.stdin.write(targetServer + '\n');
            }, 500);
        }, 500);

        // Handle stdout
        mcmdProcess.stdout.on('data', (data) => {
            const output = data.toString();
            event.sender.send('mcmd-output', { type: 'stdout', data: output });

            // Check for player events and notify
            if (output.includes('connected')) {
                const match = output.match(/(\w+) connected/);
                if (match && integrations) {
                    integrations.notify('playerJoin', { name: match[1], ip: 'unknown' });
                }
            }
            if (output.includes('disconnected')) {
                const match = output.match(/(\w+) disconnected/);
                if (match && integrations) {
                    integrations.notify('playerLeave', { name: match[1] });
                }
            }
        });

        // Handle stderr
        mcmdProcess.stderr.on('data', (data) => {
            const output = data.toString();
            event.sender.send('mcmd-output', { type: 'stderr', data: output });

            // Notify about errors
            if (integrations) {
                integrations.notify('serverErrors', { error: output });
            }
        });

        // Handle process close
        mcmdProcess.on('close', (code) => {
            event.sender.send('mcmd-closed', code);

            // Notify about unexpected crashes
            if (code !== 0 && integrations) {
                integrations.notify('processStatus', {
                    status: `crashed with exit code ${code}`
                });
            }

            mcmdProcess = null;
        });

        // Handle process error
        mcmdProcess.on('error', (err) => {
            event.sender.send('mcmd-error', err.message);

            if (integrations) {
                integrations.notify('serverErrors', { error: err.message });
            }

            mcmdProcess = null;
        });

        event.sender.send('mcmd-started');

        // Notify about start
        if (integrations) {
            integrations.notify('processStatus', { status: 'started' });
        }
    } catch (error) {
        event.sender.send('mcmd-error', error.message);
    }
});

// Send command to MCmdLogger
ipcMain.on('send-command', (event, command) => {
    if (mcmdProcess && mcmdProcess.stdin.writable) {
        mcmdProcess.stdin.write(command + '\n');
    }
});

// Stop MCmdLogger process
ipcMain.on('stop-mcmd', (event) => {
    if (mcmdProcess) {
        mcmdProcess.kill();
        mcmdProcess = null;
        event.sender.send('mcmd-stopped');

        if (integrations) {
            integrations.notify('processStatus', { status: 'stopped' });
        }
    }
});

// Check if process is running
ipcMain.on('check-status', (event) => {
    event.sender.send('mcmd-status', { running: mcmdProcess !== null });
});

// ===================================
// Integration IPC Handlers
// ===================================

// Get integration config
ipcMain.handle('get-integration-config', () => {
    return integrations ? integrations.config : null;
});

// Save integration config
ipcMain.handle('save-integration-config', (event, config) => {
    if (integrations) {
        integrations.config = config;
        return integrations.saveConfig();
    }
    return false;
});

// Test Discord connection
ipcMain.handle('test-discord', async (event, token) => {
    if (integrations) {
        return await integrations.testDiscord(token);
    }
    return { success: false, error: 'Integrations not initialized' };
});

// Test Telegram connection
ipcMain.handle('test-telegram', async (event, token) => {
    if (integrations) {
        return await integrations.testTelegram(token);
    }
    return { success: false, error: 'Integrations not initialized' };
});

// Test Discord webhook
ipcMain.handle('test-webhook', async (event, webhookUrl) => {
    if (integrations) {
        return await integrations.testWebhook(webhookUrl);
    }
    return { success: false, error: 'Integrations not initialized' };
});

// Connect Discord bot
ipcMain.handle('connect-discord', async (event, token, channelId) => {
    if (integrations) {
        return await integrations.initDiscord(token, channelId);
    }
    return { success: false, error: 'Integrations not initialized' };
});

// Connect Telegram bot
ipcMain.handle('connect-telegram', async (event, token, chatId) => {
    if (integrations) {
        return await integrations.initTelegram(token, chatId);
    }
    return { success: false, error: 'Integrations not initialized' };
});

// Send test notification
ipcMain.handle('send-test-notification', async (event) => {
    if (integrations) {
        return await integrations.notify('customEvents', {
            message: 'Test notification from MCmdLogger GUI'
        });
    }
    return [];
});

// ===================================
// Script Store IPC Handlers
// ===================================

// Install script from local templates
ipcMain.handle('install-script', async (event, scriptId, filename) => {
    const scriptsDir = path.join(__dirname, 'scripts');
    const templatesDir = path.join(__dirname, 'scripts-templates');

    // Ensure scripts directory exists
    if (!fs.existsSync(scriptsDir)) {
        fs.mkdirSync(scriptsDir);
    }

    const sourcePath = path.join(templatesDir, filename);
    const destPath = path.join(scriptsDir, filename);

    try {
        // Check if template exists
        if (!fs.existsSync(sourcePath)) {
            return { success: false, error: `Template not found: ${filename}` };
        }

        // Copy file from templates to scripts folder
        fs.copyFileSync(sourcePath, destPath);
        return { success: true, path: destPath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Get installed scripts
ipcMain.handle('get-installed-scripts', () => {
    const scriptsDir = path.join(__dirname, 'scripts');

    if (!fs.existsSync(scriptsDir)) {
        return [];
    }

    return fs.readdirSync(scriptsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => ({
            name: file,
            path: path.join(scriptsDir, file)
        }));
});

// Delete script
ipcMain.handle('delete-script', (event, filename) => {
    const filePath = path.join(__dirname, 'scripts', filename);

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return { success: true };
        }
        return { success: false, error: 'File not found' };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Load script catalog
ipcMain.handle('get-script-catalog', () => {
    try {
        const catalogPath = path.join(__dirname, 'scripts-catalog.json');
        if (fs.existsSync(catalogPath)) {
            return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        }
    } catch (err) {
        console.error('Error loading script catalog:', err);
    }
    return { scripts: [], categories: [] };
});

// Read script content for editor
ipcMain.handle('read-script', (event, filename) => {
    try {
        const filePath = path.join(__dirname, 'scripts', filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return { success: true, content: content };
        }
        return { success: false, error: 'File not found' };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Save script content from editor
ipcMain.handle('save-script', (event, filename, content) => {
    try {
        const filePath = path.join(__dirname, 'scripts', filename);
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Get script integration settings
ipcMain.handle('get-script-settings', () => {
    try {
        const settingsPath = path.join(__dirname, 'script-settings.json');
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (err) {
        console.error('Error loading script settings:', err);
    }
    return {};
});

// Save script integration settings
ipcMain.handle('save-script-settings', (event, settings) => {
    try {
        const settingsPath = path.join(__dirname, 'script-settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});
