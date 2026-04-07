
export function isTurnstileEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

type TurnstileValidationResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  action?: string | null;
  hostname?: string | null;
};

export async function validateTurnstileToken({
  token,
  remoteIp,
}: {
  token?: string | null;
  remoteIp?: string | null;
}): Promise<TurnstileValidationResult> {
  if (!isTurnstileEnabled()) {
    return { ok: true, skipped: true };
  }

  const secret = String(process.env.TURNSTILE_SECRET_KEY || "").trim();
  const responseToken = String(token || "").trim();
  if (!secret || !responseToken) {
    return { ok: false, error: "missing_turnstile_token" };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", responseToken);
  if (remoteIp) form.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  const data: any = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const codes = Array.isArray(data?.["error-codes"]) ? data["error-codes"].join(",") : "turnstile_verification_failed";
    return { ok: false, error: codes };
  }

  return {
    ok: true,
    action: data?.action ?? null,
    hostname: data?.hostname ?? null,
  };
}
