import Pwnit2Leaderboard from "@/components/Pwnit2Leaderboard";

export const dynamic = "force-dynamic";

export default function Pwnit2LeaderboardPage({ searchParams }: { searchParams?: { item?: string } }) {
  const slug = searchParams?.item === "staple" ? "staple" : "hero";
  return <Pwnit2Leaderboard slug={slug} />;
}
