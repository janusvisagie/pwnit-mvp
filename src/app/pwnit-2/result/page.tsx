import Pwnit2Result from "./ui";

export const dynamic = "force-dynamic";

export default function Pwnit2ResultPage({ searchParams }: { searchParams?: { item?: string } }) {
  const slug = searchParams?.item === "staple" ? "staple" : "hero";
  return <Pwnit2Result slug={slug} />;
}
