/**
 * Donate Detector v2.0
 * Detects VIP/Staff players with bot notifications
 */

// ============================================
// DETECTION SETTINGS
// ============================================
const ENABLED = true; // Enable detection
const CHECK_CHAT_PREFIX = true; // Check prefixes
const CHECK_COMMANDS = true; // Check commands
const SAVE_TO_FILE = true; // Save to file
const LOG_FILE = "donators.txt"; // Log file

// Prefixes to detect (comma-separated)
const DONATE_PREFIXES = "VIP,Premium,Gold,Diamond,Elite,Sponsor,MVP,Pro,Legend,King"; // Donators
const STAFF_PREFIXES = "Admin,Mod,Helper,Staff,Owner,Manager,Dev,Builder"; // Staff

// Commands that indicate donations
const DONATE_COMMANDS = "/fly,/god,/speed,/feed,/heal,/kit vip,/kit premium,/nick,/glow";
// ============================================

let integrations = null;
try { integrations = require('./integrations-helper'); } catch (e) { }
let fs = null;
try { fs = require('fs'); } catch (e) { }

const donatePrefixList = DONATE_PREFIXES.split(',').map(p => p.trim().toLowerCase());
const staffPrefixList = STAFF_PREFIXES.split(',').map(p => p.trim().toLowerCase());
const donateCommandList = DONATE_COMMANDS.split(',').map(c => c.trim().toLowerCase());

const detectedPlayers = new Map();

function saveDonator(player, type, evidence) {
    if (!SAVE_TO_FILE || !fs) return;
    try {
        const line = `[${new Date().toISOString()}] ${player.name} | ${player.ip} | ${type} | ${evidence}\n`;
        fs.appendFileSync(LOG_FILE, line);
    } catch (e) { }
}

async function alertDetection(player, type, evidence) {
    const isStaff = type === "STAFF";
    const icon = isStaff ? "👑" : "💎";
    const title = isStaff ? "STAFF DETECTED" : "DONATOR DETECTED";

    console.log("");
    console.log("╔════════════════════════════════════════╗");
    console.log(`║     ${icon} ${title.padEnd(27)}║`);
    console.log("╠════════════════════════════════════════╣");
    console.log("║ Player: " + player.name.padEnd(30) + "║");
    console.log("║ IP: " + player.ip.padEnd(34) + "║");
    console.log("║ Type: " + type.padEnd(32) + "║");
    console.log("║ Evidence: " + evidence.substring(0, 28).padEnd(28) + "║");
    console.log("╚════════════════════════════════════════╝");

    saveDonator(player, type, evidence);

    // Notify bots
    if (integrations) {
        const notifType = isStaff ? 'staffDetected' : 'donatorDetected';
        const msg = `${icon} <b>${title}!</b>\n\n👤 Player: <b>${player.name}</b>\n📍 IP: <code>${player.ip}</code>\n🏷️ Type: ${type}\n🔍 Evidence: ${evidence}`;

        integrations.notify(msg, 'donate_detector', notifType, {
            title: `${icon} ${title}!`,
            color: isStaff ? 0xffd700 : 0x00bfff,
            fields: [
                { name: 'Player', value: player.name, inline: true },
                { name: 'Type', value: type, inline: true },
                { name: 'Evidence', value: evidence, inline: false }
            ]
        });
    }
}

function checkPrefix(text, player) {
    const lowerText = text.toLowerCase();

    for (const prefix of staffPrefixList) {
        if (lowerText.includes("[" + prefix) || lowerText.includes(prefix + "]")) {
            if (!detectedPlayers.has(player.name)) {
                detectedPlayers.set(player.name, "STAFF");
                alertDetection(player, "STAFF", "Prefix: " + prefix);
            }
            return;
        }
    }

    for (const prefix of donatePrefixList) {
        if (lowerText.includes("[" + prefix) || lowerText.includes(prefix + "]")) {
            if (!detectedPlayers.has(player.name)) {
                detectedPlayers.set(player.name, "DONATOR");
                alertDetection(player, "DONATOR", "Prefix: " + prefix);
            }
            return;
        }
    }
}

function checkCommand(command, player) {
    const lowerCmd = command.toLowerCase();
    for (const donateCmd of donateCommandList) {
        if (lowerCmd.startsWith(donateCmd)) {
            if (!detectedPlayers.has(player.name)) {
                detectedPlayers.set(player.name, "DONATOR");
                alertDetection(player, "DONATOR", "Command: " + donateCmd);
            }
            return;
        }
    }
}

playerJoin(player => {
    if (!ENABLED) return;

    if (CHECK_CHAT_PREFIX) {
        player.on("server_message", event => {
            if (event.text.includes(player.name)) {
                checkPrefix(event.text, player);
            }
        });
    }

    if (CHECK_COMMANDS) {
        player.on("player_message", event => {
            if (event.text.startsWith("/")) {
                checkCommand(event.text, player);
            }
        });
    }
});

command("donators", "Show detected donators/staff", () => {
    if (detectedPlayers.size === 0) {
        console.log("No donators/staff detected");
        return;
    }
    console.log("\n=== Detected Players (" + detectedPlayers.size + ") ===");
    detectedPlayers.forEach((type, name) => {
        console.log((type === "STAFF" ? "👑" : "💎") + " " + name + " - " + type);
    });
});

console.log("✅ Donate Detector v2.0 loaded!");
console.log("   Prefixes: " + (CHECK_CHAT_PREFIX ? "Yes" : "No"));
console.log("   Commands: " + (CHECK_COMMANDS ? "Yes" : "No"));
