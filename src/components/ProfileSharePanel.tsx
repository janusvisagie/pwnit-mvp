"use client";

import { useMemo, useState } from "react";

type Props = {
  headline: string;
  body: string;
  shareUrl: string;
  challengeUrl?: string | null;
};

function enc(value: string) {
  return encodeURIComponent(value);
}

export default function ProfileSharePanel({ headline, body, shareUrl, challengeUrl }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const shareText = useMemo(() => {
    return [headline, body, shareUrl].filter(Boolean).join(" ");
  }, [headline, body, shareUrl]);

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: headline, text: body, url: shareUrl });
        return;
      }
    } catch {
      // fall through to copy
    }

    await copyText(shareText, "Share text copied");
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("Copy failed on this browser");
      window.setTimeout(() => setCopied(null), 2000);
    }
  }

  const targets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(shareText)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}&quote=${enc(headline)}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${enc(body)}&url=${enc(shareUrl)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(body)}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${enc(headline)}&body=${enc(shareText)}`,
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Share your progress</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Celebrate your score. Challenge a friend.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Share natively to any installed app, or use the quick links below. TikTok and Instagram do not offer a simple web share link, so use
            <span className="font-semibold"> Share anywhere </span>
            or copy the caption for those platforms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Share anywhere
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Suggested caption</p>
        <p className="mt-2 leading-6">{shareText}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {targets.map((target) => (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            {target.label}
          </a>
        ))}
        <button
          type="button"
          onClick={() => void copyText(shareText, "Caption copied")}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
        >
          Copy for TikTok / Instagram
        </button>
        {challengeUrl ? (
          <button
            type="button"
            onClick={() => void copyText(challengeUrl, "Challenge link copied")}
            className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
          >
            Challenge a friend
          </button>
        ) : null}
      </div>

      {copied ? <p className="mt-3 text-sm font-medium text-emerald-700">{copied}</p> : null}
    </section>
  );
}
