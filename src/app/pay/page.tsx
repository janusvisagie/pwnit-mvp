import PayClient from "./PayClient";

export const dynamic = "force-dynamic";

type PayPageProps = {
  searchParams?: {
    itemId?: string;
    mode?: string;
  };
};

export default function PayPage({ searchParams }: PayPageProps) {
  const itemId = typeof searchParams?.itemId === "string" ? searchParams.itemId : "";
  const mode = typeof searchParams?.mode === "string" ? searchParams.mode : "mix";

  return <PayClient itemId={itemId} mode={mode} />;
}
