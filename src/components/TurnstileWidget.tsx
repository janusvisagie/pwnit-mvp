
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, any>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

function ensureTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pwnit-turnstile="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Turnstile.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.pwnitTurnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Turnstile."));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

type Props = {
  siteKey?: string;
  theme?: "light" | "dark" | "auto";
  className?: string;
  action?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (message: string) => void;
};

export default function TurnstileWidget({
  siteKey,
  theme = "light",
  className,
  action,
  onVerify,
  onExpire,
  onError,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host || !siteKey) return;

    ensureTurnstileScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        hostRef.current.innerHTML = "";
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          theme,
          action,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onExpire?.(),
          "error-callback": () => onError?.("Human check could not complete. Please try again."),
        });
      })
      .catch((error: any) => {
        if (!cancelled) {
          onError?.(error?.message || "Could not load human verification.");
        }
      });

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // ignore cleanup errors
        }
      }
      widgetIdRef.current = null;
    };
  }, [action, onError, onExpire, onVerify, siteKey, theme]);

  if (!siteKey) return null;

  return <div ref={hostRef} className={className} />;
}
