/**
 * Shared notification validation helpers.
 */

/**
 * Validates if a Discord Webhook URL has a correct domain structure.
 */
export function isValidDiscordWebhook(url: string): boolean {
  return url.startsWith("https://discord.com/") || url.startsWith("https://discordapp.com/");
}

/**
 * Validates if a Telegram Chat ID is a valid numeric string.
 */
export function isValidTelegramChatId(id: string): boolean {
  return /^-?\d+$/.test(id);
}
