export function makeAutoAlias(seed: string) {
  // deterministic-ish, but not easily guessable: use seed + timestamp-ish
  // Keep it simple for MVP.
  const animals = ["Panda", "Falcon", "Otter", "Tiger", "Koala", "Dolphin", "Eagle", "Wolf", "Fox", "Rhino"];
  const adjectives = ["Swift", "Bold", "Keen", "Chill", "Lucky", "Sharp", "Brave", "Neat", "Calm", "Rapid"];

  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  const adj = adjectives[h % adjectives.length];
  const animal = animals[(h >>> 8) % animals.length];
  const num = (h % 900) + 100; // 100..999

  return `${adj}${animal}${num}`;
}

export function normalizeAlias(input: string) {
  const s = String(input ?? "").trim();

  // Allow letters, numbers, space, underscore, dash. 3..20 chars.
  const cleaned = s.replace(/[^\w\- ]+/g, "").replace(/\s+/g, " ").trim();

  if (cleaned.length < 3) return null;
  if (cleaned.length > 20) return cleaned.slice(0, 20);
  return cleaned;
}
