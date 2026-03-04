export function Progress({ value, max }: { value: number; max: number }) {
  const v = Number.isFinite(value) ? value : 0;
  const m = Math.max(1, Number.isFinite(max) ? max : 1);
  const pct = Math.max(0, Math.min(100, Math.round((v / m) * 100)));

  return (
    <div
      style={{
        height: 10,
        background: "#e5e7eb",
        borderRadius: 999,
        overflow: "hidden",
      }}
      aria-label="Activation progress"
      aria-valuenow={v}
      aria-valuemax={m}
      role="progressbar"
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "#111",
          borderRadius: 999,
        }}
      />
    </div>
  );
}
