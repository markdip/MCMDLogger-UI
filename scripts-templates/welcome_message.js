/**
 * Welcome Message
 * Sends customizable welcome messages to players
 * 
 * CONFIGURATION:
 * - Customize message text and colors
 * - Set delay before sending
 * - Enable/disable features
 */

// ============================================
// CONFIGURATION
// ============================================
const ENABLED = true; // Enable welcome message
const MESSAGE_TEXT = "Welcome to the server!"; // Message text
const MESSAGE_COLOR = "§6"; // Color code (§6=gold, §a=green, §c=red, §b=aqua, §e=yellow, §f=white)
const DELAY_MS = 2000; // Delay before sending (milliseconds)
const SHOW_PLAYER_NAME = true; // Include player name in message
const PREFIX = "[Server]"; // Message prefix
const PREFIX_COLOR = "§7"; // Prefix color
// ============================================

// Minecraft Color Codes:
// §0=black, §1=dark_blue, §2=dark_green, §3=dark_aqua
// §4=dark_red, §5=purple, §6=gold, §7=gray, §8=dark_gray
// §9=blue, §a=green, §b=aqua, §c=red, §d=pink, §e=yellow, §f=white
// §l=bold, §o=italic, §n=underline, §m=strikethrough, §r=reset

function formatMessage(player) {
    let msg = "";

    if (PREFIX && PREFIX.trim()) {
        msg += PREFIX_COLOR + PREFIX + " §r";
    }

    if (SHOW_PLAYER_NAME) {
        msg += MESSAGE_COLOR + MESSAGE_TEXT.replace("{player}", player.name);
    } else {
        msg += MESSAGE_COLOR + MESSAGE_TEXT;
    }

    return msg;
}

playerJoin(player => {
    if (!ENABLED) return;

    setTimeout(() => {
        const message = formatMessage(player);
        player.send(message);
        console.log("[Welcome] Sent to " + player.name + ": " + message);
    }, DELAY_MS);
});

console.log("✅ Welcome Message loaded!");
console.log("   Message: " + MESSAGE_COLOR + MESSAGE_TEXT);
console.log("   Delay: " + DELAY_MS + "ms");
