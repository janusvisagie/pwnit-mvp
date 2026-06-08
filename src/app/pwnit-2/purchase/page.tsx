import Pwnit2Purchase from "./ui";

export const dynamic = "force-dynamic";

export default function Pwnit2PurchasePage({ searchParams }: { searchParams?: { item?: string } }) {
  const slug = searchParams?.item === "staple" ? "staple" : "hero";
  return <Pwnit2Purchase slug={slug} />;
}
