import Link from "next/link";

export default function SubscribePage() {
  return (
    <main style={{ maxWidth: 760 }}>
      <h1 style={{ marginTop: 0 }}>Subscribe</h1>
      <p style={{ color: "#555" }}>
        Placeholder: this is where your subscription flow will go.
      </p>
      <Link href="/" style={{ fontSize: 13, color: "#111" }}>← Back home</Link>
    </main>
  );
}
