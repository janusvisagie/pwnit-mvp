import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * This script:
 * - finds the first 9 Item rows (createdAt ASC)
 * - assigns them a set of 9 different product images (and optional metadata)
 *
 * Adjust these paths to match the SVGs you actually created in /public/products
 * (URLs must start with /products/...)
 */
const ASSIGNMENTS = [
  { imageUrl: "/products/smeg-kettle.svg", shortDesc: "Premium retro-style electric kettle", productUrl: "https://www.smeg.com/" },
  { imageUrl: "/products/toaster.svg", shortDesc: "Stainless steel 2-slice toaster", productUrl: "https://www.takealot.com/" },
  { imageUrl: "/products/airfryer.svg", shortDesc: "Crispy cooking with less oil", productUrl: "https://www.takealot.com/" },
  { imageUrl: "/products/checkers-voucher.svg", shortDesc: "Checkers grocery voucher", productUrl: "https://www.checkers.co.za/" },
  { imageUrl: "/products/woolworths-voucher.svg", shortDesc: "Woolworths food & fashion voucher", productUrl: "https://www.woolworths.co.za/" },
  { imageUrl: "/products/makro-voucher.svg", shortDesc: "Makro voucher for big buys", productUrl: "https://www.makro.co.za/" },
  { imageUrl: "/products/ps-voucher.svg", shortDesc: "PlayStation store voucher", productUrl: "https://www.playstation.com/" },
  { imageUrl: "/products/petrol-voucher.svg", shortDesc: "Fuel voucher", productUrl: "https://www.shell.co.za/" },
  { imageUrl: "/products/tv-voucher.svg", shortDesc: "Smart TV voucher", productUrl: "https://www.takealot.com/" },
];

async function main() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    take: 9,
    select: { id: true, title: true, tier: true },
  });

  if (items.length === 0) {
    console.log("No items found.");
    return;
  }

  console.log(`Found ${items.length} items. Updating...`);

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const a = ASSIGNMENTS[i % ASSIGNMENTS.length];

    await prisma.item.update({
      where: { id: it.id },
      data: {
        imageUrl: a.imageUrl,
        shortDesc: a.shortDesc ?? null,
        productUrl: a.productUrl ?? null,
      },
    });

    console.log(`✔ Updated #${i + 1}: "${it.title}" (tier ${it.tier}) -> ${a.imageUrl}`);
  }

  console.log("Done ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
