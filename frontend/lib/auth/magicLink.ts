import LRUCache from "lru-cache";

// Max 5 requests per 15 minutes per email
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

// LRU Cache prevents memory leaks by evicting old entries
const emailRateLimit = new LRUCache<
  string,
  { count: number; timestamp: number }
>({
  max: 500, // Maximum number of unique emails to track at once
  ttl: RATE_LIMIT_WINDOW_MS, // Automatically remove entries after 15 minutes
});

export async function sendVerificationRequest(params: any) {
  const { identifier, url, provider } = params;

  // Rate Limiting Logic
  const now = Date.now();
  const userLimit = emailRateLimit.get(identifier);

  if (userLimit) {
    if (now - userLimit.timestamp < RATE_LIMIT_WINDOW_MS) {
      if (userLimit.count >= RATE_LIMIT_MAX) {
        console.warn(`Rate limit exceeded for email: ${identifier}`);
        // Return silently to provide a generic success message to the frontend,
        // avoiding email enumeration attacks
        return;
      }
      userLimit.count += 1;
      emailRateLimit.set(identifier, userLimit); // Update TTL and count
    } else {
      // Reset window (though TTL should have evicted it, just in case)
      emailRateLimit.set(identifier, { count: 1, timestamp: now });
    }
  } else {
    emailRateLimit.set(identifier, { count: 1, timestamp: now });
  }

  // Send the email using Nodemailer
  const { host } = new URL(url);
  const transport = (await import("nodemailer")).createTransport(
    provider.server,
  );

  const result = (await transport.sendMail({
    to: identifier,
    from: provider.from,
    subject: `Sign in to ${host}`,
    text: `Sign in to ${host}\n${url}\n\n`,
    html: `
      <body style="background: #f9f9f9; padding: 20px; font-family: sans-serif;">
        <div style="background: white; border-radius: 10px; padding: 20px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Sign in to ${host}</h2>
          <p style="color: #555;">Click the button below to sign in securely. The link is valid for 24 hours.</p>
          <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Sign in</a>
        </div>
      </body>
    `,
  })) as any;

  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email (${failed.join(", ")}) could not be sent`);
  }
}
