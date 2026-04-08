import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'src', 'app', 'play', '[itemId]', '_components', 'GameHost.tsx');

if (!fs.existsSync(target)) {
  console.error(`Could not find ${target}`);
  process.exit(1);
}

let text = fs.readFileSync(target, 'utf8');
let changed = false;

const replacements = [
  {
    name: 'Props.gameKey widening',
    from: 'type Props = {\n  itemId: string;\n  gameKey: GameKey;\n  playCost: number;\n  credits: number;\n};',
    to: 'type Props = {\n  itemId: string;\n  gameKey: string | null | undefined;\n  playCost: number;\n  credits: number;\n};',
  },
  {
    name: 'supportsVerifiedMode null-safe',
    from: '  const supportsVerifiedMode = VERIFIED_GAME_KEYS.has(gameKey);',
    to: '  const supportsVerifiedMode = typeof gameKey === "string" && VERIFIED_GAME_KEYS.has(gameKey);',
  },
  {
    name: 'resolved game key from session challenge',
    from: '  const entry = GAME_REGISTRY[gameKey] ?? GAME_REGISTRY["quick-stop"];\n  const Game = useMemo(() => entry.Component, [entry.Component]);',
    to: `  const sessionGameKey = typeof session?.challenge?.game === "string" ? session.challenge.game : null;\n\n  const resolvedGameKey = useMemo<GameKey>(() => {\n    if (sessionGameKey && sessionGameKey in GAME_REGISTRY) {\n      return sessionGameKey as GameKey;\n    }\n\n    if (typeof gameKey === "string" && gameKey in GAME_REGISTRY) {\n      return gameKey as GameKey;\n    }\n\n    return "quick-stop";\n  }, [gameKey, sessionGameKey]);\n\n  const entry = GAME_REGISTRY[resolvedGameKey] ?? GAME_REGISTRY["quick-stop"];\n  const Game = useMemo(() => entry.Component, [entry.Component]);`,
  },
];

for (const rep of replacements) {
  if (text.includes(rep.from)) {
    text = text.replace(rep.from, rep.to);
    changed = true;
  } else {
    console.warn(`Did not find expected block for: ${rep.name}`);
  }
}

const debugPatterns = [
  /\n\s*<div className="text-xs text-red-600">debug gameKey: \{gameKey\}<\/div>/g,
  /\n\s*<div className="text-xs text-red-600">debug gameKey: \{resolvedGameKey\}<\/div>/g,
];

for (const pattern of debugPatterns) {
  if (pattern.test(text)) {
    text = text.replace(pattern, '');
    changed = true;
  }
}

if (!changed) {
  console.error('No changes were applied. Please confirm GameHost.tsx matches the expected recent patch structure.');
  process.exit(2);
}

fs.writeFileSync(target, text, 'utf8');
console.log(`Updated ${target}`);
console.log('GameHost will now prefer session.challenge.game when the server issues a verified challenge.');
