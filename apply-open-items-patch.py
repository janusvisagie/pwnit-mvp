from pathlib import Path
import re, sys

root = Path('/mnt/data/patchwork')  # placeholder unused


def read(path):
    return Path(path).read_text(encoding='utf-8')

def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def replace_literal(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected text for {label}')
    return text.replace(old, new, 1)


def patch_itemcard(base):
    p = base/'src/components/ItemCard.tsx'
    t = read(p)
    t = t.replace('imgClassName="h-36 w-full object-contain bg-white p-1.5 sm:h-40 lg:h-[21.5vh]"',
                  'imgClassName="h-36 w-full object-contain bg-white p-0 sm:h-40 lg:h-[21.5vh]"')
    write(p,t)


def ensure_timer_helpers(t, component_name):
    if 'function formatCountdown(ms: number)' not in t:
        t = t.replace('type RunStats = {', 'function formatCountdown(ms: number) {\n  const total = Math.max(0, Math.ceil(ms / 1000));\n  const mins = Math.floor(total / 60);\n  const secs = total % 60;\n  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;\n}\n\ntype RunStats = {', 1)
    if 'const [nowMs, setNowMs] = useState(Date.now());' not in t:
        t = t.replace('const [pending, setPending] = useState(false);', 'const [pending, setPending] = useState(false);\n  const [nowMs, setNowMs] = useState(Date.now());')
    # injected effect before timeout effect
    marker = 'useEffect(() => {\n    if (phase !== "RUNNING" || pending || remainingMs > 0) return;'
    if marker in t and 'const timer = window.setInterval' not in t:
        timer_fx = 'useEffect(() => {\n    if (phase !== "RUNNING") return;\n    setNowMs(Date.now());\n    const timer = window.setInterval(() => setNowMs(Date.now()), 250);\n    return () => window.clearInterval(timer);\n  }, [phase]);\n\n  '
        t = t.replace(marker, timer_fx + marker, 1)
    t = re.sub(r'const elapsedMs = phase === "RUNNING" && startedAtRef\.current\s*\? Math\.max\(0, Date\.now\(\) - startedAtRef\.current\)\s*:\s*0;',
               'const elapsedMs = phase === "RUNNING" && startedAtRef.current\n    ? Math.max(0, nowMs - startedAtRef.current)\n    : 0;', t)
    t = t.replace('startedAtRef.current = Date.now();', 'startedAtRef.current = Date.now();\n    setNowMs(Date.now());')
    t = t.replace('{Math.ceil(remainingMs / 1000)}s', '{formatCountdown(remainingMs)}')
    return t


def patch_progressive(base):
    p = base/'src/games/progressive-mosaic/ProgressiveMosaicGame.tsx'
    t = read(p)
    t = ensure_timer_helpers(t, 'ProgressiveMosaicGame')
    t = t.replace('Each level begins with the first reveal already visible. Reveal more only when needed, then choose the best answer option.',
                  'A hidden target image begins heavily obscured. Each reveal makes it clearer. Guess any time — fewer reveals and a faster finish score higher.')
    t = t.replace('setMessage("The first reveal is already shown.\nPick early if you can.");',
                  'setMessage("The first reveal is already shown. The target starts heavily obscured — guess at any time or sharpen it further.");')
    t = t.replace('setMessage("The first reveal is already shown.\nGuess whenever you’re ready, or reveal more detail at a scoring cost.");',
                  'setMessage("The first reveal is already shown. The target starts heavily obscured — guess at any time or sharpen it further.");')
    t = t.replace('All reveals shown.\nMake your choice.', 'All reveals shown. Make your choice.')
    t = t.replace('More of the target is now visible.', 'The target image is now clearer.')
    t = t.replace('Reveal more', 'Sharpen image')
    t = t.replace('Answer choices', 'Choose the matching prize')
    t = t.replace('Higher level, fewer reveals, faster finish', 'Higher level • fewer reveals • faster finish')
    t = t.replace('className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"',
                  'className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow disabled:opacity-50"')
    t = t.replace('<div className="flex items-center gap-3">', '<div className="flex items-center gap-3">', 1)
    # make reveal tiles less plain
    t = t.replace('className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"', 'className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"')
    t = t.replace('className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"', 'className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"')
    write(p,t)


def patch_clue(base):
    p = base/'src/games/clue-ladder/ClueLadderGame.tsx'
    t = read(p)
    t = ensure_timer_helpers(t, 'ClueLadderGame')
    t = t.replace('Each level begins with the first clue already visible. Reveal more clues only when needed, then choose the correct answer tile.',
                  'Each level begins with the first clue already visible. Build confidence from the clue ladder, then choose the correct prize tile before time runs out.')
    t = t.replace('The first clue is already visible. Reveal more only if you need it, then choose the best answer tile.',
                  'The first clue is already visible. Read it, then choose the matching prize tile — or reveal more only if you need it.')
    t = t.replace('Answer choices', 'Which prize fits these clues?')
    t = t.replace('Reveal clue', 'Reveal another clue')
    t = t.replace('className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:opacity-50"',
                  'className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow disabled:opacity-50"')
    write(p,t)


def patch_spot(base):
    p = base/'src/games/spot-the-missing/SpotTheMissingGame.tsx'
    t = read(p)
    t = ensure_timer_helpers(t, 'SpotTheMissingGame')
    t = t.replace('Visible now', 'Choices')
    t = t.replace('{(publicChallenge.remaining ?? []).join(" • ")}', '{(publicChallenge.remaining ?? []).join(" • ")}')
    t = t.replace('Shown row', 'Remember this row')
    # if objective sentence exists
    t = t.replace('Spot the Missing', 'Spot the Missing')
    write(p,t)


def patch_rapid(base):
    p = base/'src/games/rapid-math-relay/RapidMathRelayGame.tsx'
    t = read(p)
    t = ensure_timer_helpers(t, 'RapidMathRelayGame')
    write(p,t)


def patch_helper(base):
    # try current GitHub helper first, then fallback older helper
    for rel in ['src/lib/competitiveRuns.ts','src/lib/nextHiddenStateGames.ts']:
        p = base/rel
        if not p.exists():
            continue
        t = read(p)
        t = t.replace('slice(0, 3)', 'slice(0, 5)')
        # progressive mosaic first reveals should not be identical to the answer tile/icon
        replacements = {
            'reveals: ["⛽", "🛣️ + ⛽"': 'reveals: ["Road stripes in fuel colours", "A pump-nozzle shape begins to appear"',
            'reveals: ["🛒", "🛒 + 🥛"': 'reveals: ["Shelf colours and basket shapes", "A trolley outline starts to appear"',
            'reveals: ["📦", "📦 + 🚚"': 'reveals: ["Cardboard tones and shipping marks", "A delivery-box outline starts to appear"',
            'reveals: ["🎧", "🎧 + 🎵"': 'reveals: ["Curved audio shapes and dark padding", "An earcup silhouette starts to appear"',
            'reveals: ["🎮", "🎮 + 🕹️"': 'reveals: ["Bright gaming colours and split controls", "A handheld-console outline starts to appear"',
            'reveals: ["📷", "📷 + 🌊"': 'reveals: ["Lens-ring shapes and action-camera edges", "A compact camera outline starts to appear"',
            'reveals: ["⭐", "⭐ + 🎟️"': 'reveals: ["Reward colours and score-strip shapes", "A bonus token outline starts to appear"',
            'reveals: ["🏆", "🏆 + 🥇"': 'reveals: ["Metallic podium colours and cup handles", "A trophy outline starts to appear"',
        }
        for old,new in replacements.items():
            t = t.replace(old,new)
        write(p,t)
        break


def main():
    base = Path.cwd()
    patch_itemcard(base)
    patch_progressive(base)
    patch_clue(base)
    patch_spot(base)
    patch_rapid(base)
    patch_helper(base)
    print('Patched current repo files for image fit, countdowns, timeout ticking, richer answer tiles, and clearer progressive/clue game wording.')

if __name__ == '__main__':
    main()
