export async function sendLoginCodeEmail(params: { to: string; code: string }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.AUTH_EMAIL_FROM || process.env.EMAIL_FROM || "PwnIt <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000";
  const subject = "Your PwnIt sign-in code";
  const code = params.code;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">Your PwnIt sign-in code</h2>
      <p style="margin: 0 0 12px;">Use this one-time code to sign in:</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 12px 0 20px;">${code}</div>
      <p style="margin: 0 0 8px;">The code expires in 10 minutes.</p>
      <p style="margin: 0; color: #475569;">PwnIt • ${siteUrl}</p>
    </div>
  `;

  const text = `Your PwnIt sign-in code is ${code}. It expires in 10 minutes.`;

  if (!resendApiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing RESEND_API_KEY in production.");
    }

    return { devCode: code };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email send failed: ${detail || response.statusText}`);
  }

  if (process.env.NODE_ENV !== "production") {
    return { devCode: code };
  }

  return { devCode: null };
}
