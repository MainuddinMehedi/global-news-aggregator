export async function deliverDiscord(notification, webhookUrl) {
  if (!webhookUrl) throw new Error("Discord webhook URL is missing");

  // Construct message based on priority and format
  let color = 3447003; // Normal/Low (Blue)
  if (notification.priority === 'HIGH') color = 15158332; // Orange
  if (notification.priority === 'CRITICAL') color = 15105570; // Red

  const payload = {
    embeds: [
      {
        title: notification.title,
        description: notification.message,
        color,
        timestamp: new Date().toISOString(),
        footer: {
          text: `Geopolitical News Aggregator • Priority: ${notification.priority}`,
        },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord API responded with status: ${response.status}`);
  }
}
