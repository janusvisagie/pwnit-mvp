
# PwnIt replacement game set v2

These six games are designed around four rules:

- the real challenge is not shown before the attempt starts
- the answer is not derivable from the opening screen
- every competitive run is bound to a one-time server attempt
- bot signals and telemetry can force review instead of auto-confirmation

---

## 1. Codebreaker Plus

**Game key:** `codebreaker-plus`

**What the player sees before Start:** only instructions

**Start payload from server**
- `attemptId`
- `challengeId`
- `digitPool`
- `codeLength`
- `maxGuesses`
- `allowRepeats`
- `issuedAt`
- `expiresAt`

**Hidden server state**
- `solution`
- `seed`

**Player actions**
- submit guess rows
- each row gets feedback: exact, misplaced

**Scoring**
- base score: `30000`
- time penalty: `elapsedMs`
- guess penalty: `4000 * (guessesUsed - 1)`
- minimum score: `1000`

**Server-verification fields**
- `guessLog[]`
- `guessCount`
- `clientElapsedMs`
- `serverElapsedMs`
- per-guess timestamps
- final solved / locked out status

**Server checks**
- guess count within limit
- each guess shape valid
- feedback implied by hidden solution is correct
- solve state consistent with the logged guesses
- elapsed time not superhuman

---

## 2. Hidden Pair Memory

**Game key:** `hidden-pair-memory`

**What the player sees before Start:** facedown cards only

**Start payload from server**
- `attemptId`
- `challengeId`
- `rows`
- `cols`
- `pairCount`
- `issuedAt`
- `expiresAt`

**Hidden server state**
- shuffled deck layout
- seed

**Player actions**
- flip card A
- flip card B
- continue until all pairs are solved

**Scoring**
- base score: `28000`
- time penalty: `elapsedMs`
- mismatch penalty: `1500 * mismatchCount`
- minimum score: `1000`

**Server-verification fields**
- `flipLog[]` with card indexes and timestamps
- `matchesFound`
- `mismatchCount`
- `clientElapsedMs`
- `serverElapsedMs`

**Server checks**
- each flip references a real card
- pair resolution matches hidden deck
- solved order is consistent
- no impossible flip cadence

---

## 3. Progressive Mosaic

**Game key:** `progressive-mosaic`

**What the player sees before Start:** blank frame only

**Start payload from server**
- `attemptId`
- `challengeId`
- `imageSet`
- `revealSchedule`
- `options[]`
- `issuedAt`
- `expiresAt`

**Hidden server state**
- correct image / answer id
- reveal order
- seed

**Player actions**
- request next reveal
- submit answer at any time

**Scoring**
- base score: `26000`
- time penalty: `elapsedMs`
- reveal penalty: `2200 * revealsUsed`
- wrong answer: `0`

**Server-verification fields**
- `revealCount`
- `revealLog[]`
- `answerId`
- `clientElapsedMs`
- `serverElapsedMs`

**Server checks**
- reveal count is sequential
- answer was one of the offered options
- correct answer matches hidden image id
- no answer before reveal state became available

---

## 4. Clue Ladder

**Game key:** `clue-ladder`

**What the player sees before Start:** title and instructions only

**Start payload from server**
- `attemptId`
- `challengeId`
- `category`
- `maxClues`
- `issuedAt`
- `expiresAt`

**Hidden server state**
- answer
- clue order
- seed

**Player actions**
- request next clue
- submit answer

**Scoring**
- base score: `25000`
- time penalty: `elapsedMs`
- clue penalty: `2500 * cluesUsed`
- wrong answer: `0`

**Server-verification fields**
- `clueCount`
- `clueLog[]`
- `answerText`
- `normalizedAnswer`
- `clientElapsedMs`
- `serverElapsedMs`

**Server checks**
- clue requests are sequential
- answer matches the accepted answer set
- no impossible clue cadence

---

## 5. Safe Path Fog

**Game key:** `safe-path-fog`

**What the player sees before Start:** starting tile only

**Start payload from server**
- `attemptId`
- `challengeId`
- `gridSize`
- `startCell`
- `goalCell`
- `localHintMask`
- `issuedAt`
- `expiresAt`

**Hidden server state**
- full map
- safe route
- hidden blockers
- seed

**Player actions**
- move up / down / left / right
- uncover nearby fog
- reach goal

**Scoring**
- base score: `27000`
- time penalty: `elapsedMs`
- wrong-step penalty: `1200 * wrongMoves`
- optimal-route bonus: `+2000`
- minimum score: `1000`

**Server-verification fields**
- `moveLog[]`
- `wrongMoves`
- `reachedGoal`
- `clientElapsedMs`
- `serverElapsedMs`

**Server checks**
- each move is adjacent
- fog reveal order is consistent
- route matches hidden map
- no teleporting or skipped states

---

## 6. Signal Hunt

**Game key:** `signal-hunt`

**What the player sees before Start:** instructions only

**Start payload from server**
- `attemptId`
- `challengeId`
- `streamSpeed`
- `targetRule`
- `issuedAt`
- `expiresAt`

**Hidden server state**
- timed event stream
- trigger point
- seed

**Player actions**
- watch stream
- press stop when the hidden target condition is first satisfied

**Scoring**
- base score: `24000`
- reaction penalty: absolute distance from true trigger in ms
- false-stop penalty: `0`

**Server-verification fields**
- `stopAtMs`
- `targetAtMs`
- `eventCountSeen`
- `clientElapsedMs`
- `serverElapsedMs`

**Server checks**
- trigger point is derived from the hidden stream
- stop action occurred after start and before expiry
- reaction delta is computed on the server

---

## Review and anti-bot rules for all six

Every competitive attempt should also capture:

- `turnstilePassed`
- `recaptchaScore` if configured
- `cloudflareBotScore` if forwarded
- `interactionScore`
- `recentStarts`
- `recentFinishes`
- `ipHash`
- `bucketKey`
- `reviewRequired`
- `reviewReasons[]`

An attempt should be routed to review when any of these are true:

- bot score is below the configured threshold
- reCAPTCHA score is below the configured threshold
- interaction score is below the configured threshold
- the run is faster than the game’s minimum plausible human time
- burst play patterns are detected
- the podium candidate’s telemetry looks superhuman or too consistent
