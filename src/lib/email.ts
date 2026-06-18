// Transactional email sender.
//
// Default provider: Resend, called over its REST API (no SDK dependency).
// To use a different provider (Postmark, SES, SMTP, ...), swap the body of
// sendViaProvider() — nothing else in the app needs to change.
//
// If RESEND_API_KEY is not set, this logs the message to the server console
// instead of sending, so the full flow is testable locally without a provider.

type SendArgs = { to: string; subject: string; text: string; html?: string };

async function sendViaProvider({ to, subject, text, html }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "PwnIt <onboarding@resend.dev>";

  if (!apiKey) {
    // Dev / not-yet-configured fallback.
    console.log(`[email:dev] to=${to} | ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, ...(html ? { html } : {}) }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const subject = "Verify your PwnIt email";
  const text =
    `Your PwnIt verification code is: ${code}\n\n` +
    `It expires in 15 minutes. If you didn't request this, you can ignore this email.`;
  await sendViaProvider({ to, subject, text });
}

// Retained so any lingering import does not break the build. The OTP login
// feature was removed; this is intentionally inert.
export async function sendLoginCodeEmail(): Promise<never> {
  throw new Error("Email code sign-in is disabled. Use email + password auth instead.");
}
