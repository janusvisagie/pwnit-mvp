import Pwnit2Game from "@/components/Pwnit2Game";

export const dynamic = "force-dynamic";

export default function Pwnit2PlayPage({ searchParams }: { searchParams?: { item?: string } }) {
  const slug = searchParams?.item === "staple" ? "staple" : "hero";
  return <Pwnit2Game slug={slug} />;
}
