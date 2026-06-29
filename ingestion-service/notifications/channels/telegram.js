export async function deliverTelegram(notification, chatId, botToken) {
  if (!chatId || !botToken) throw new Error("Telegram config is missing");

  // Format message for Telegram HTML mode
  let prefix = 'ℹ️';
  if (notification.priority === 'HIGH') prefix = '⚠️';
  if (notification.priority === 'CRITICAL') prefix = '🚨';

  const text = `${prefix} <b>${notification.title}</b>\n\n${notification.message}\n\n<i>Priority: ${notification.priority}</i>`;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Telegram API Error: ${response.status} - ${errorBody}`);
  }
}
