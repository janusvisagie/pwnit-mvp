export const dynamic = "force-dynamic";

import SubscribeClient from "./SubscribeClient";

export const metadata = { title: "Subscribe · PwnIt" };

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <SubscribeClient />
    </main>
  );
}
