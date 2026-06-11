// Draft legal content for PwnIt 2, rendered by LegalDoc. These are STARTING-POINT drafts
// for review by a qualified South African attorney — not legal advice, not yet binding.
// Items in [square brackets] must be completed/confirmed before launch.

export type LegalSection = { heading: string; paras?: string[]; bullets?: string[] };
export type LegalDocData = {
  slug: "terms" | "refund" | "privacy";
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_UPDATED = "[effective date]";

export const legalTerms: LegalDocData = {
  slug: "terms",
  title: "Customer Terms & Conditions",
  updated: LEGAL_UPDATED,
  intro:
    "These Terms govern your use of the PwnIt platform operated by [PwnIt (Pty) Ltd], registration number [•••], of [registered address] (“PwnIt”, “we”, “us”). By creating an account, playing a game, or buying a voucher, you agree to these Terms. If you do not agree, do not use PwnIt.",
  sections: [
    {
      heading: "1. About PwnIt",
      bullets: [
        "PwnIt lets you pick a prize (a voucher), play a quick skill game, and compete on a leaderboard. When a campaign’s countdown ends, the single highest verified score wins that voucher. Everyone else keeps a discount they earned while playing and may, if they choose, buy the same voucher at its value less that discount.",
        "PwnIt is a game of skill. The result of every play is determined by your performance in the game, not by chance, and no payment increases the likelihood of a random outcome. [Counsel to confirm classification under South African law.]",
      ],
    },
    {
      heading: "2. Eligibility",
      bullets: [
        "You must be at least 18 years old and resident in [South Africa].",
        "You may hold one account, and the information you give us must be accurate and kept up to date.",
        "Employees of PwnIt and [related parties] [may not] participate in campaigns. [Confirm.]",
      ],
    },
    {
      heading: "3. Your account",
      bullets: [
        "You are responsible for activity under your account and for keeping your login details secure.",
        "Tell us promptly at [support email] if you suspect unauthorised use.",
        "We may suspend or close accounts that breach these Terms.",
      ],
    },
    {
      heading: "4. Credits, free plays and discount",
      bullets: [
        "You get one free competitive play each day. Additional plays cost [R5] each, and you can practise for free as much as you like (practice runs do not count and earn no discount).",
        "Inside the app, value is shown as credits, where 1 credit = R1. Each R1 you spend on a paid play builds R1 of discount on that campaign’s voucher.",
        "Credits, free plays and earned discount are not money, are not transferable, and — except where the law requires — have no cash redemption value. Free daily plays do not roll over.",
      ],
    },
    {
      heading: "5. How campaigns work and how winning is decided",
      bullets: [
        "A campaign moves through funding, an activation point, a live countdown, and a closing window. Funding comes from plays; once the activation target is met the countdown starts and the leaderboard goes live.",
        "When the countdown ends, the leaderboard is frozen and the single highest verified score wins the voucher outright. There is no random draw. Equal scores are separated by [completion time].",
        "As a runner-up reward, 2nd and 3rd place receive an additional discount equal to a percentage of their own paid spend ([10%] and [5%] respectively), applied if they buy the voucher.",
        "Before any prize is awarded we may review the leading run(s) for fair-play compliance. Our decision on the result is final, subject to your rights at law.",
        "If a campaign does not reach its activation target within its funding window, it does not run and amounts spent on it are refunded as set out in the Refund Policy.",
      ],
    },
    {
      heading: "6. The voucher",
      bullets: [
        "The voucher’s value is fixed for the campaign and shown in the app; the amount you can redeem is always displayed before you buy.",
        "The voucher may be redeemed for [goods/services / at supplier(s) •••] and is valid for [validity period] from issue. We do not shorten validity to cause forfeiture; any expiry exists only to [cap liability / comply with applicable rules] and will meet the minimum periods required by law.",
        "The voucher is not exchangeable for cash unless the law requires it, and we are not responsible for lost or shared voucher codes once issued.",
      ],
    },
    {
      heading: "7. Buying a voucher after a campaign",
      bullets: [
        "If you do not win, you may buy the campaign voucher during the buy window at its value less the discount you earned. The price is shown before you confirm. You are never required to buy.",
        "Payments are processed by [payment provider]. During beta, a purchase may be a test transaction in which no real payment is taken; we will make clear when this is the case.",
      ],
    },
    {
      heading: "8. Fair play and anti-cheat",
      bullets: [
        "Scores are validated on our servers. You may not use bots, scripts, automation, multiple accounts, or any exploit to obtain or inflate a score.",
        "We may void scores, withhold prizes, and suspend accounts where we reasonably believe these rules have been broken.",
      ],
    },
    {
      heading: "9. Acceptable use & intellectual property",
      bullets: [
        "Do not interfere with the platform, attempt to access it unlawfully, reverse engineer it, or use it for any unlawful purpose.",
        "The PwnIt name, brand, software and content are owned by us or our licensors. We grant you a personal, non-transferable, revocable licence to use the platform under these Terms.",
      ],
    },
    {
      heading: "10. Disclaimers and liability",
      bullets: [
        "Nothing in these Terms limits your rights under the Consumer Protection Act 68 of 2008 or any liability that cannot lawfully be excluded.",
        "Subject to that, the platform is provided “as is”, and to the extent permitted by law our total liability arising from your use is limited to [•••]. We are not liable for indirect or consequential loss to the extent the law allows.",
      ],
    },
    {
      heading: "11. Changes, governing law and contact",
      bullets: [
        "We may update these Terms and will post the updated version with a new effective date; material changes will be notified [in-app / by email].",
        "These Terms are governed by the laws of South Africa. [Dispute resolution: courts of [•••] / arbitration / consumer ADR]. Your rights to approach a consumer body or regulator are unaffected.",
        "Contact: [PwnIt (Pty) Ltd], [address] · [hello@pwnit.co.za] · WhatsApp [+27 •• ••• ••••].",
      ],
    },
  ],
};

export const legalRefund: LegalDocData = {
  slug: "refund",
  title: "Refund Policy",
  updated: LEGAL_UPDATED,
  intro:
    "This policy explains when and how refunds apply to credits, campaign plays and voucher purchases. It forms part of, and should be read with, the Customer Terms.",
  sections: [
    {
      heading: "1. Credits and paid plays",
      bullets: [
        "Purchased credits are generally non-refundable once bought, except (a) where the law requires a refund, or (b) where there has been a duplicate charge or a failure of the service on our side.",
        "Free daily plays and practice have no cash value and are not refundable.",
      ],
    },
    {
      heading: "2. Campaigns that do not activate",
      bullets: [
        "If a campaign does not reach its activation target within its funding window, it does not run. Credits you spent playing that specific campaign are refunded to your account as credits [or to your original payment method where required]. [Confirm mechanism and timing.]",
      ],
    },
    {
      heading: "3. Voucher purchases",
      bullets: [
        "During beta, a voucher purchase may be a test transaction in which no real payment is taken; there is nothing to refund.",
        "For real purchases, if a voucher is faulty or cannot be redeemed as described, we will [replace it or refund it] in line with the Consumer Protection Act. Change-of-mind returns are subject to [•••] and any applicable cooling-off rights.",
      ],
    },
    {
      heading: "4. Your statutory rights",
      bullets: [
        "This policy does not limit your rights under the Consumer Protection Act 68 of 2008 or other applicable law.",
      ],
    },
    {
      heading: "5. How to request a refund",
      bullets: [
        "Email [support email] within [•••] days, with your account email and the relevant campaign or transaction. We aim to respond within [•••] and to process approved refunds within [•••].",
        "Please contact us before raising a chargeback so we can resolve the issue directly.",
      ],
    },
  ],
};

export const legalPrivacy: LegalDocData = {
  slug: "privacy",
  title: "Privacy Notice (POPIA)",
  updated: LEGAL_UPDATED,
  intro:
    "This notice explains how [PwnIt (Pty) Ltd] (“we”), as responsible party, collects and uses personal information under the Protection of Personal Information Act 4 of 2013 (“POPIA”). Our Information Officer is [name], contactable at [email].",
  sections: [
    {
      heading: "1. Information we collect",
      bullets: [
        "Account information: name, email address, chosen alias, and login details.",
        "Gameplay information: your scores, attempts, timing data and leaderboard position.",
        "Device and usage information: IP address, device and browser details, and cookies or similar technologies.",
        "Purchase information: handled by our payment provider [•••]; we do not store full card details.",
        "Communications: messages you send us (for example by email or WhatsApp).",
      ],
    },
    {
      heading: "2. Why we use it, and our lawful basis",
      bullets: [
        "To provide the platform, run campaigns, maintain the leaderboard and issue vouchers — to perform our contract with you.",
        "To detect and prevent cheating, fraud and abuse, and to keep the platform secure — our legitimate interests.",
        "To comply with legal obligations (for example tax and record-keeping).",
        "To send you marketing — only with your consent, which you can withdraw at any time.",
      ],
    },
    {
      heading: "3. Who we share it with",
      bullets: [
        "Service providers (operators) who process information on our behalf, such as hosting and analytics, under appropriate agreements.",
        "Our payment provider, for purchases and subscriptions.",
        "Prize/voucher suppliers, only as needed to fulfil a voucher. [Confirm.]",
        "Authorities or third parties where required by law or to protect our rights. We do not sell your personal information.",
      ],
    },
    {
      heading: "4. Cross-border transfers, security and retention",
      bullets: [
        "[If any provider processes information outside South Africa, we put appropriate safeguards in place as required by POPIA. List providers/locations.]",
        "We take reasonable technical and organisational measures to protect personal information.",
        "We keep personal information only as long as needed for the purposes above or as the law requires, then delete or de-identify it. [State retention periods.]",
      ],
    },
    {
      heading: "5. Your rights",
      bullets: [
        "Under POPIA you may request access to, or correction or deletion of, your personal information, object to certain processing, and withdraw consent. To exercise these rights, contact [email].",
        "You may also lodge a complaint with the Information Regulator (South Africa) [contact details].",
      ],
    },
    {
      heading: "6. Cookies, children, changes and contact",
      bullets: [
        "We use cookies or similar technologies to operate the platform and understand usage. [Link to a cookie notice / settings, if used.]",
        "PwnIt is not directed to people under 18 and we do not knowingly collect their information.",
        "We may update this notice and will post the updated version with a new effective date.",
        "Contact: [PwnIt (Pty) Ltd], [address] · [privacy@pwnit.co.za].",
      ],
    },
  ],
};

export const legalDocs = { terms: legalTerms, refund: legalRefund, privacy: legalPrivacy };
