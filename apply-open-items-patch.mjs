import fs from 'fs';
import path from 'path';

const cwd = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(cwd, rel), 'utf8');
}
function write(rel, text) {
  fs.writeFileSync(path.join(cwd, rel), text, 'utf8');
}

function patchItemCard() {
  const rel = 'src/components/ItemCard.tsx';
  let t = read(rel);
  t = t.replace(
    'imgClassName="h-36 w-full object-contain bg-white p-1.5 sm:h-40 lg:h-[21.5vh]"',
    'imgClassName="h-36 w-full object-contain bg-white p-0 sm:h-40 lg:h-[21.5vh]"'
  );
  write(rel, t);
}

function ensureTimerHelpers(t) {
  if (!t.includes('function formatCountdown(ms: number)')) {
    t = t.replace(
      'type RunStats = {',
      'function formatCountdown(ms: number) {\n' +
      '  const total = Math.max(0, Math.ceil(ms / 1000));\n' +
      '  const mins = Math.floor(total / 60);\n' +
      '  const secs = total % 60;\n' +
      '  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;\n' +
      '}\n\n' +
      'type RunStats = {'
    );
  }
  if (!t.includes('const [nowMs, setNowMs] = useState(Date.now());')) {
    t = t.replace(
      'const [pending, setPending] = useState(false);',
      'const [pending, setPending] = useState(false);\n  const [nowMs, setNowMs] = useState(Date.now());'
    );
  }
  const marker = 'useEffect(() => {\n    if (phase !== "RUNNING" || pending || remainingMs > 0) return;';
  if (t.includes(marker) && !t.includes('const timer = window.setInterval(() => setNowMs(Date.now()), 250);')) {
    const timerFx =
      'useEffect(() => {\n' +
      '    if (phase !== "RUNNING") return;\n' +
      '    setNowMs(Date.now());\n' +
      '    const timer = window.setInterval(() => setNowMs(Date.now()), 250);\n' +
      '    return () => window.clearInterval(timer);\n' +
      '  }, [phase]);\n\n  ';
    t = t.replace(marker, timerFx + marker);
  }
  t = t.replace(
    /const elapsedMs = phase === "RUNNING" && startedAtRef\.current\s*\? Math\.max\(0, Date\.now\(\) - startedAtRef\.current\)\s*:\s*0;/,
    'const elapsedMs = phase === "RUNNING" && startedAtRef.current\n    ? Math.max(0, nowMs - startedAtRef.current)\n    : 0;'
  );
  t = t.replace('startedAtRef.current = Date.now();', 'startedAtRef.current = Date.now();\n    setNowMs(Date.now());');
  t = t.replace('{Math.ceil(remainingMs / 1000)}s', '{formatCountdown(remainingMs)}');
  return t;
}

function patchFile(rel, fn) {
  let t = read(rel);
  t = fn(t);
  write(rel, t);
}

function patchProgressive() {
  patchFile('src/games/progressive-mosaic/ProgressiveMosaicGame.tsx', (t) => {
    t = ensureTimerHelpers(t);
    t = t.replace(
      'Each level begins with the first reveal already visible. Reveal more only when needed, then choose the best answer option.',
      'A hidden target image begins heavily obscured. Each reveal makes it clearer. Guess any time — fewer reveals and a faster finish score higher.'
    );
    t = t.replace(
      'setMessage("The first reveal is already shown.\nPick early if you can.");',
      'setMessage("The first reveal is already shown. The target starts heavily obscured — guess at any time or sharpen it further.");'
    );
    t = t.replace(
      'setMessage("The first reveal is already shown.\nGuess whenever you’re ready, or reveal more detail at a scoring cost.");',
      'setMessage("The first reveal is already shown. The target starts heavily obscured — guess at any time or sharpen it further.");'
    );
    t = t.replace('All reveals shown.\nMake your choice.', 'All reveals shown. Make your choice.');
    t = t.replace('More of the target is now visible.', 'The target image is now clearer.');
    t = t.replace('Reveal more', 'Sharpen image');
    t = t.replace('Answer choices', 'Choose the matching prize');
    t = t.replace('Higher level, fewer reveals, faster finish', 'Higher level • fewer reveals • faster finish');
    t = t.replace(
      'className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"',
      'className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow disabled:opacity-50"'
    );
    return t;
  });
}

function patchClue() {
  patchFile('src/games/clue-ladder/ClueLadderGame.tsx', (t) => {
    t = ensureTimerHelpers(t);
    t = t.replace(
      'Each level begins with the first clue already visible. Reveal more clues only when needed, then choose the correct answer tile.',
      'Each level begins with the first clue already visible. Build confidence from the clue ladder, then choose the correct prize tile before time runs out.'
    );
    t = t.replace(
      'The first clue is already visible. Reveal more only if you need it, then choose the best answer tile.',
      'The first clue is already visible. Read it, then choose the matching prize tile — or reveal more only if you need it.'
    );
    t = t.replace('Answer choices', 'Which prize fits these clues?');
    t = t.replace('Reveal clue', 'Reveal another clue');
    t = t.replace(
      'className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"',
      'className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow disabled:opacity-50"'
    );
    return t;
  });
}

function patchSpot() {
  patchFile('src/games/spot-the-missing/SpotTheMissingGame.tsx', (t) => {
    t = ensureTimerHelpers(t);
    t = t.replace('Visible now', 'Choices');
    t = t.replace('Shown row', 'Remember this row');
    return t;
  });
}

function patchRapid() {
  patchFile('src/games/rapid-math-relay/RapidMathRelayGame.tsx', (t) => ensureTimerHelpers(t));
}

function patchHelper() {
  const candidates = ['src/lib/competitiveRuns.ts', 'src/lib/nextHiddenStateGames.ts'];
  for (const rel of candidates) {
    const full = path.join(cwd, rel);
    if (!fs.existsSync(full)) continue;
    let t = read(rel);
    t = t.replace(/slice\(0, 3\)/g, 'slice(0, 5)');
    const replacements = new Map([
      ['reveals: ["⛽", "🛣️ + ⛽"', 'reveals: ["Road stripes in fuel colours", "A pump-nozzle shape begins to appear"'],
      ['reveals: ["🛒", "🛒 + 🥛"', 'reveals: ["Shelf colours and basket shapes", "A trolley outline starts to appear"'],
      ['reveals: ["📦", "📦 + 🚚"', 'reveals: ["Cardboard tones and shipping marks", "A delivery-box outline starts to appear"'],
      ['reveals: ["🎧", "🎧 + 🎵"', 'reveals: ["Curved audio shapes and dark padding", "An earcup silhouette starts to appear"'],
      ['reveals: ["🎮", "🎮 + 🕹️"', 'reveals: ["Bright gaming colours and split controls", "A handheld-console outline starts to appear"'],
      ['reveals: ["📷", "📷 + 🌊"', 'reveals: ["Lens-ring shapes and action-camera edges", "A compact camera outline starts to appear"'],
      ['reveals: ["⭐", "⭐ + 🎟️"', 'reveals: ["Reward colours and score-strip shapes", "A bonus token outline starts to appear"'],
      ['reveals: ["🏆", "🏆 + 🥇"', 'reveals: ["Metallic podium colours and cup handles", "A trophy outline starts to appear"']
    ]);
    for (const [oldVal, newVal] of replacements.entries()) {
      t = t.replace(oldVal, newVal);
    }
    write(rel, t);
    break;
  }
}

try {
  patchItemCard();
  patchProgressive();
  patchClue();
  patchSpot();
  patchRapid();
  patchHelper();
  console.log('Patched current repo files for image fit, countdowns, timeout ticking, richer answer tiles, and clearer progressive/clue game wording.');
} catch (err) {
  console.error(err?.message || err);
  process.exit(1);
}
