export type ProductContent = {
  imageUrl: string;
  officialUrl?: string;
  kicker?: string;
  description: string;
  highlights: string[];
};

const catalog: Record<string, ProductContent> = {
  "Nintendo Switch OLED": {
    imageUrl:
      "https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/ncom/en_US/switch/videos/heg001-07060600/posters/oled-model",
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
    imageUrl:
      "https://www.sony.com/image/6145c1d32e6ac8e63a46c912dc33c5bb?bgc=FFFFFF&bgcolor=FFFFFF&fmt=pjpeg&wid=1200",
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
    description:
      "A Takealot voucher gives the winner flexible spending power across a wide range of online shopping categories.",
    highlights: [
      "Great for broad everyday appeal",
      "Easy to understand and easy to redeem",
      "Strong conversion item for players who want practical value",
    ],
  },
  "Checkers Voucher": {
    imageUrl: "/products/checkers-voucher.svg",
    description:
      "A Checkers voucher keeps the prize practical and relevant, making it attractive to players who want real household value.",
    highlights: [
      "Useful for groceries and everyday essentials",
      "Simple value proposition for a wide audience",
      "Good low-friction prize in the item mix",
    ],
  },
  "Fuel Voucher": {
    imageUrl: "/products/petrol-voucher.svg",
    description:
      "A fuel voucher is a practical utility prize that feels instantly valuable and easy to redeem.",
    highlights: [
      "Everyday real-world value",
      "Strong conversion item for broad participation",
      "Complements the premium tech prizes in the mix",
    ],
  },
  "Petrol Voucher": {
    imageUrl: "/products/petrol-voucher.svg",
    description:
      "A petrol voucher is a strong utility prize that feels immediately valuable and easy to use.",
    highlights: [
      "Everyday practical value",
      "Clear and instantly understandable benefit",
      "Good complement to tech and lifestyle prizes",
    ],
  },
};

export function getProductContent(title: string, fallbackImageUrl?: string | null): ProductContent | null {
  const hit = catalog[title];
  if (!hit) {
    if (!fallbackImageUrl) return null;
    return {
      imageUrl: fallbackImageUrl,
      description: "Prize details coming soon.",
      highlights: ["More information will be added soon."],
    };
  }
  return hit;
}
