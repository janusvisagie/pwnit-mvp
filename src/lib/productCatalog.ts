export type ProductContent = {
  imageUrl: string;
  officialUrl?: string;
  kicker?: string;
  description: string;
  highlights: string[];
};

const catalog: Record<string, ProductContent> = {
  "Nintendo Switch OLED": {
    imageUrl: "/images/nintendo-switch.webp",
    officialUrl: "https://www.nintendo.com/us/gaming-systems/switch/oled-model/",
    kicker: "Official product highlights",
    description:
      "Play on the TV, on the go, or in tabletop mode with the Nintendo Switch – OLED Model. It keeps the familiar Switch versatility, while upgrading the handheld and tabletop experience.",
    highlights: [
      "Vibrant 7-inch OLED display with vivid colours and high contrast",
      "Wide adjustable stand for more flexible tabletop play",
      "Dock includes a wired LAN port for more stable online play in TV mode",
      "64 GB internal storage plus enhanced onboard audio in handheld and tabletop modes",
    ],
  },
  "Sony WH-1000XM5 Headphones": {
    imageUrl: "/images/sony-headphones.webp",
    officialUrl: "https://www.sony.com/za/electronics/headband-headphones/wh-1000xm5",
    kicker: "Official product highlights",
    description:
      "Sony’s WH-1000XM5 are premium wireless noise-cancelling headphones built for immersive listening, clear calls, and everyday comfort.",
    highlights: [
      "Advanced noise cancelling driven by 2 processors and 8 microphones",
      "Exceptional sound quality with Hi-Res audio support and DSEE Extreme",
      "Clear call performance designed to isolate your voice more effectively",
      "Comfort-focused over-ear design with touch controls and Bluetooth wireless listening",
    ],
  },
  "GoPro HERO13 Black": {
    imageUrl: "/images/gopro-hero13.webp",
    officialUrl: "https://gopro.com/en/us/shop/cameras/learn/hero13black/CHDHX-131-master.html",
    kicker: "Official product highlights",
    description:
      "HERO13 Black is GoPro’s flagship action camera for creators who want rugged capture, flexible lens options, and longer runtimes for extended shoots.",
    highlights: [
      "Works with HB-Series lenses and filters for specialty shooting setups",
      "Automatically detects compatible lenses or filters and adjusts settings",
      "New 1900mAh Enduro battery design for improved efficiency and longer runtimes",
      "Up to 2.5 hours of continuous recording according to GoPro’s official product page",
    ],
  },
  "Takealot Voucher": {
    imageUrl: "/images/takealot-voucher.webp",
    kicker: "Voucher details",
    description:
      "A digital shopping voucher aimed at broad, everyday online spend. It is a flexible prize for users who want practical value instead of a single fixed product.",
    highlights: [
      "Strong all-round prize for electronics, home, books, toys and daily essentials",
      "Simple value proposition: one voucher, many product choices",
      "Ideal for players who like the option to buy later using their earned discount",
      "Exact redemption terms depend on the final voucher issued",
    ],
  },
  "Checkers Voucher": {
    imageUrl: "/images/checkers-voucher.webp",
    kicker: "Voucher details",
    description:
      "A practical grocery-focused prize with obvious household value. It works well as a lower-friction item because users immediately understand what the win can be used for.",
    highlights: [
      "Everyday utility prize with broad household appeal",
      "Good fit for pantry, groceries and household shopping",
      "Lower ticket item designed to activate faster and convert early participation",
      "Exact redemption terms depend on the final voucher issued",
    ],
  },
  "Fuel Voucher": {
    imageUrl: "/images/fuel-voucher.webp",
    kicker: "Voucher details",
    description:
      "A fuel-focused utility prize that feels instantly valuable. It keeps the marketplace grounded with a practical option next to the bigger aspirational prizes.",
    highlights: [
      "Straightforward day-to-day value for drivers",
      "Good utility-led alternative to retail and tech prizes",
      "Helpful lower-tier prize for keeping the marketplace active and approachable",
      "Exact redemption terms depend on the final voucher issued",
    ],
  },
};

const reliableFallbacks: Record<string, string> = {
  "Nintendo Switch OLED": "/images/nintendo-switch.webp",
  "Sony WH-1000XM5 Headphones": "/images/sony-headphones.webp",
  "GoPro HERO13 Black": "/images/gopro-hero13.webp",
  "Takealot Voucher": "/images/takealot-voucher.webp",
  "Checkers Voucher": "/images/checkers-voucher.webp",
  "Fuel Voucher": "/images/fuel-voucher.webp",
};

export function getProductContent(title: string, fallbackImageUrl?: string | null): ProductContent | null {
  const hit = catalog[title];
  const reliable = reliableFallbacks[title] ?? fallbackImageUrl ?? null;

  if (!hit) {
    if (!reliable) return null;
    return {
      imageUrl: reliable,
      description: "Prize details coming soon.",
      highlights: ["More information will be added soon."],
    };
  }

  return {
    ...hit,
    imageUrl: hit.imageUrl || reliable || hit.imageUrl,
  };
}

export function getFallbackProductImage(title: string, fallbackImageUrl?: string | null) {
  return reliableFallbacks[title] ?? fallbackImageUrl ?? null;
}
