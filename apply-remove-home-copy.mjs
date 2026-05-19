import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const pagePath = path.join(repoRoot, "src", "app", "page.tsx");

const markerTitle = "Pick. Play. PwnIt.";
const markerHeading = "Prizes build through play and verified subscriber growth.";
const markerBody =
  "Each item activates from registered player activity plus visible verified subscriber contribution. Free daily credits stay at 30, unlimited practice remains open, and premium items can still use that full daily free balance for one registered attempt.";

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function includesAll(text) {
  return text.includes(markerTitle) && text.includes(markerHeading) && text.includes(markerBody);
}

function trimSurroundingWhitespace(source, start, end) {
  let safeStart = start;
  let safeEnd = end;

  // Remove one preceding blank line / indentation where possible.
  while (safeStart > 0 && /[ \t]/.test(source[safeStart - 1])) safeStart -= 1;
  if (safeStart > 0 && source[safeStart - 1] === "\n") {
    const prevLineStart = source.lastIndexOf("\n", safeStart - 2) + 1;
    const prevLine = source.slice(prevLineStart, safeStart - 1);
    if (/^\s*$/.test(prevLine)) safeStart = prevLineStart;
  }

  // Remove one following blank line / indentation where possible.
  while (safeEnd < source.length && /[ \t]/.test(source[safeEnd])) safeEnd += 1;
  if (safeEnd < source.length && source[safeEnd] === "\n") {
    const nextLineEnd = source.indexOf("\n", safeEnd + 1);
    const nextLine = source.slice(safeEnd + 1, nextLineEnd === -1 ? source.length : nextLineEnd);
    if (/^\s*$/.test(nextLine)) safeEnd = nextLineEnd === -1 ? source.length : nextLineEnd + 1;
  }

  return { safeStart, safeEnd };
}

function findMatchingTagEnd(source, start, tagName) {
  const tokenRe = new RegExp(`<\\/?${tagName}(?=[\\s>/])[^>]*>`, "gi");
  tokenRe.lastIndex = start;

  let depth = 0;
  let match;
  while ((match = tokenRe.exec(source))) {
    const token = match[0];
    const isClosing = token.startsWith(`</`);
    const isSelfClosing = /\/\s*>$/.test(token);

    if (isClosing) {
      depth -= 1;
      if (depth === 0) return tokenRe.lastIndex;
    } else if (!isSelfClosing) {
      depth += 1;
    }
  }

  return -1;
}

function removeContainingJsxBlock(source) {
  const markerIndex = source.indexOf(markerTitle);
  if (markerIndex === -1) return null;

  const candidateTags = ["section", "div", "header", "article", "aside"];
  const candidates = [];

  for (const tagName of candidateTags) {
    const re = new RegExp(`<${tagName}(?=[\\s>])`, "gi");
    let match;
    while ((match = re.exec(source))) {
      if (match.index < markerIndex) {
        candidates.push({ tagName, start: match.index });
      }
    }
  }

  candidates.sort((a, b) => b.start - a.start);

  for (const candidate of candidates) {
    const end = findMatchingTagEnd(source, candidate.start, candidate.tagName);
    if (end === -1 || end < markerIndex) continue;

    const block = source.slice(candidate.start, end);
    if (!includesAll(block)) continue;

    const { safeStart, safeEnd } = trimSurroundingWhitespace(source, candidate.start, end);
    return source.slice(0, safeStart) + source.slice(safeEnd);
  }

  return null;
}

function removeSimpleJsxNodes(source) {
  const escapedBody = markerBody.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedHeading = markerHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedTitle = markerTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    // Common JSX structure: paragraph/title + heading + paragraph/body.
    new RegExp(
      `\\n?\\s*<p[^>]*>\\s*${escapedTitle}\\s*</p>\\s*<h[1-6][^>]*>\\s*${escapedHeading}\\s*</h[1-6]>\\s*<p[^>]*>\\s*${escapedBody}\\s*</p>\\s*`,
      "s",
    ),
    // If the first line is a span/div instead of a paragraph.
    new RegExp(
      `\\n?\\s*<[^>/]+[^>]*>\\s*${escapedTitle}\\s*</[^>]+>\\s*<h[1-6][^>]*>\\s*${escapedHeading}\\s*</h[1-6]>\\s*<p[^>]*>\\s*${escapedBody}\\s*</p>\\s*`,
      "s",
    ),
    // Plain-text fallback.
    new RegExp(
      `\\n?\\s*${escapedTitle}\\s*\\n\\s*${escapedHeading}\\s*\\n\\s*${escapedBody}\\s*\\n?`,
      "s",
    ),
  ];

  for (const pattern of patterns) {
    if (pattern.test(source)) return source.replace(pattern, "\n");
  }

  return null;
}

if (!fs.existsSync(pagePath)) {
  fail(`Could not find ${path.relative(repoRoot, pagePath)}. Run this from the repository root.`);
}

const before = fs.readFileSync(pagePath, "utf8");

if (!before.includes(markerTitle) && !before.includes(markerHeading) && !before.includes(markerBody)) {
  console.log("✅ Homepage intro copy is already absent. No changes needed.");
  process.exit(0);
}

let after = removeContainingJsxBlock(before);
if (after === null) after = removeSimpleJsxNodes(before);

if (after === null || after === before) {
  fail(
    "Found the homepage copy, but could not safely identify the surrounding block to remove. Please share src/app/page.tsx so I can provide an exact replacement.",
  );
}

if (after.includes(markerTitle) || after.includes(markerHeading) || after.includes(markerBody)) {
  fail("The patch did not remove all requested homepage wording, so the file was left unchanged.");
}

fs.writeFileSync(pagePath, after, "utf8");
console.log("✅ Removed the requested homepage wording/block from src/app/page.tsx");
