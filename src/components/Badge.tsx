export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:999, border:"1px solid #ddd", fontSize:12 }}>
      {children}
    </span>
  );
}
