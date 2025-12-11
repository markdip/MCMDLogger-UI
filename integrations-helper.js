/**
 * MCmdLogger Integrations Helper
 * Shared module for sending notifications to Discord/Telegram
 * 
 * Scripts can require this to send messages to configured bots
 */

const fs = require('fs');
const path = require('path');

class IntegrationsHelper {
    constructor() {
        this.config = null;
        this.scriptSettings = {};
        this.loadConfig();
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            if (fs.existsSync(configPath)) {
                this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }

            const settingsPath = path.join(__dirname, 'script-settings.json');
            if (fs.existsSync(settingsPath)) {
                this.scriptSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            }
        } catch (e) {
            console.log('[Integrations] Error loading config:', e.message);
        }
    }

    getScriptSettings(scriptName) {
        return this.scriptSettings[scriptName] || {
            telegram: { enabled: false, notifications: {} },
            discord: { enabled: false, notifications: {} }
        };
    }

    // Check if notification type is enabled for the script
    isEnabled(scriptName, platform, notificationType) {
        const settings = this.getScriptSettings(scriptName);
        if (!settings[platform] || !settings[platform].enabled) return false;
        if (!settings[platform].notifications) return true;
        return settings[platform].notifications[notificationType] !== false;
    }

    // Send to Telegram
    async sendTelegram(message, scriptName = null, notificationType = null) {
        if (!this.config?.integrations?.telegram?.enabled) return false;
        if (!this.config.integrations.telegram.token || !this.config.integrations.telegram.chatId) return false;

        // Check script-specific settings
        if (scriptName && notificationType && !this.isEnabled(scriptName, 'telegram', notificationType)) {
            return false;
        }

        const token = this.config.integrations.telegram.token;
        const chatId = this.config.integrations.telegram.chatId;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        try {
            const https = require('https');
            const data = JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            });

            return new Promise((resolve) => {
                const req = https.request(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                }, (res) => {
                    resolve(res.statusCode === 200);
                });
                req.on('error', () => resolve(false));
                req.write(data);
                req.end();
            });
        } catch (e) {
            return false;
        }
    }

    // Send to Discord Webhook
    async sendDiscord(message, scriptName = null, notificationType = null, options = {}) {
        if (!this.config?.integrations?.discord?.enabled) return false;
        if (!this.config.integrations.discord.webhookUrl) return false;

        // Check script-specific settings
        if (scriptName && notificationType && !this.isEnabled(scriptName, 'discord', notificationType)) {
            return false;
        }

        const webhookUrl = this.config.integrations.discord.webhookUrl;

        try {
            const https = require('https');
            const url = new URL(webhookUrl);

            const embed = {
                title: options.title || 'MCmdLogger Alert',
                description: message,
                color: options.color || 0x8b5cf6,
                timestamp: new Date().toISOString(),
                footer: { text: options.footer || 'MCmdLogger' }
            };

            if (options.fields) {
                embed.fields = options.fields;
            }

            const data = JSON.stringify({ embeds: [embed] });

            return new Promise((resolve) => {
                const req = https.request({
                    hostname: url.hostname,
                    path: url.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data)
                    }
                }, (res) => {
                    resolve(res.statusCode === 204 || res.statusCode === 200);
                });
                req.on('error', () => resolve(false));
                req.write(data);
                req.end();
            });
        } catch (e) {
            return false;
        }
    }

    // Send to both platforms
    async notify(message, scriptName, notificationType, discordOptions = {}) {
        const results = {
            telegram: false,
            discord: false
        };

        results.telegram = await this.sendTelegram(message, scriptName, notificationType);
        results.discord = await this.sendDiscord(message, scriptName, notificationType, discordOptions);

        return results;
    }
}

// Singleton instance
const helper = new IntegrationsHelper();

module.exports = helper;
