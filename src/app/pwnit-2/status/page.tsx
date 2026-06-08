import Pwnit2Status from "@/components/Pwnit2Status";

export const dynamic = "force-dynamic";

export default function Pwnit2StatusPage({ searchParams }: { searchParams?: { item?: string } }) {
  const slug = searchParams?.item === "staple" ? "staple" : "hero";
  return <Pwnit2Status slug={slug} />;
}
