export default function SvgTest() {
  return (
    <main style={{ padding: 24 }}>
      <h1>SVG test</h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/products/smeg-kettle.svg"
        alt="Smeg kettle"
        style={{ width: 600, border: "1px solid #ddd", borderRadius: 16 }}
      />

      <p style={{ marginTop: 12, color: "#555" }}>
        If you see the designed banner image above, your SVG is working.
      </p>
    </main>
  );
}
