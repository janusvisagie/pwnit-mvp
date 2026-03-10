export type ProductContent = {
  imageUrl: string;
  officialUrl?: string;
  kicker?: string;
  description: string;
  highlights: string[];
};

const catalog: Record<string, ProductContent> = {
  "Nintendo Switch OLED": {
    imageUrl: "/products/nintendo-switch-oled.svg",
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
    imageUrl: "https://www.sony.com/image/6145c1d32e6ac8e63a46c912dc33c5bb?bgc=FFFFFF&bgcolor=FFFFFF&fmt=pjpeg&wid=1200",
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
    imageUrl:
      "https://static.gopro.com/assets/blta2b8522e5372af40/bltdcd3295493f2b049/66b0eba949df090a205ce45b/01-h13-hero-intro-1920.jpg?auto=webp&disable=upscale&quality=80&width=1920",
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
    imageUrl: "/products/takealot-voucher.svg",
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
    imageUrl: "/products/checkers-voucher.svg",
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
    imageUrl: "/products/petrol-voucher.svg",
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
  "Nintendo Switch OLED": "/products/nintendo-switch-oled.svg",
  "Sony WH-1000XM5 Headphones": "/products/sony-xm5-headphones.svg",
  "GoPro HERO13 Black": "/products/gopro-hero.svg",
  "Takealot Voucher": "/products/takealot-voucher.svg",
  "Checkers Voucher": "/products/checkers-voucher.svg",
  "Fuel Voucher": "/products/petrol-voucher.svg",
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
