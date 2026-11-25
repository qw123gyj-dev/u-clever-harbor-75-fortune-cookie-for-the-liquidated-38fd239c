// Fortune Cookie for the Liquidated Trader — deterministic entry picker.
//
// The brief asks for one fortune cookie line, at most 20 words, for a
// crypto trader who has just been liquidated, read at 3am with an empty
// wallet and a stubborn sense of humour. An AI judge compares fortunes
// pairwise and weighs them, most important first:
//   1. It reads as a fortune cookie message for a crypto trader who was
//      just liquidated, with the cookie voice and the trading loss both
//      in it; a line with no loss and no trader in it loses to any
//      fortune cookie message about a liquidated crypto trader.
//   2. It makes a liquidated crypto trader laugh rather than cry: the
//      joke lands on the loss and on the trader, rueful and warm, never
//      cruel and never smug.
//   3. It is one line, at most 20 words of plain text, and it reads whole
//      in a single breath the way a real fortune does.
//   4. The joke is fresh: a turn, a double meaning or a surprising last
//      word, not the obvious liquidation pun anyone would reach for.
//   5. It keeps the fortune voice: small, oracular, slightly formal
//      phrasing that the punchline then breaks.
//
// This program scores a set of hand-written candidate one-liners against
// those five criteria, in that order (weights 5, 4, 3, 2, 1), writes the
// winner to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt),
// reads it back and verifies it against every gate before exiting.
//
// Scoring design, criterion by criterion:
//
//   Criterion 1 is built from three ingredients, because the brief makes
//   it a conjunction: the cookie voice (an oracular opening or a cookie
//   frame), the loss itself (a word that says money is gone), and the
//   trader (a word that says who lost it). A line missing any one of the
//   three is docked on exactly that ingredient, so a pretty fortune with
//   no trader in it and a trading joke with no cookie voice in it both
//   fall short for the same transparent reason. No candidate carries a
//   pre-assigned score; every point comes from these word lists.
//
//   Criterion 2 starts every line at a neutral 0.55 and then credits
//   warm, rueful markers — still, again, tomorrow, dawn, a comeback, the
//   wisdom found in the wreckage, the cookie left behind — up to three
//   of them, while any cruel or smug marker (idiot, fool, deserved,
//   told you so) costs 0.40 each. The trader is laughing with the
//   cookie, not being lectured or pitied by it, so warmth is rewarded
//   and mockery is punished hard.
//
//   Criterion 3 is the single-breath test: 12 to 18 words scores full
//   marks, 19 to 20 words (still inside the brief's limit) scores 0.90,
//   and anything shorter or longer slides down from there. A fortune
//   that needs a second breath is not a fortune.
//
//   Criterion 4 is the freshness test, and it is deliberately strict
//   about where the joke lands: a strong twist inside the last six words
//   scores 1.00, a strong twist only somewhere in the final clause
//   scores 0.80, a medium twist in the last six words 0.70, a medium
//   twist in the final clause 0.55, and no twist at all 0.40. On top of
//   that, the shopworn liquidation puns anyone would reach for — buy the
//   dip, to the moon, rekt, hodl, margin call, diamond hands, paper
//   hands, wen lambo — cost 0.35 each, because the brief explicitly asks
//   for a turn nobody else thought of, not the first pun off the shelf.
//   The dock was raised from 0.25 in the revision round: a line leaning
//   on a shelf pun should feel it, even when the rest of the line is
//   strong, and a twist parked anywhere but the last six words is a
//   setup that arrives late, so it scores less than it used to.
//
//   Criterion 5 is the voice test in two halves: the first half of the
//   line must sound like a fortune (you will, the stars, fortune favors,
//   beware, luck is, the cookie says, a wise trader), and the final
//   clause must break that formality with something small and concrete
//   (noodles, bus fare, a sofa, rent, a masterclass, an apology that
//   never comes). A fortune that stays oracular all the way through has
//   no punchline; a joke that never sounds like a fortune has no setup.
//
// Ties break the way the judge walks the brief: criterion by criterion,
// in the brief's own order, then by shorter text, then lexicographically.
// The whole program is deterministic: the same candidates always produce
// the same winner.
//
// Node 24, standard library only, no network, fully deterministic.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Eighteen one-liners, each hand-written for this brief and no other.
// Every one is a single line of plain text, at most 20 words, with the
// cookie voice, a liquidated trader, and a loss in it somewhere. The
// jokes turn on different things on purpose — the cookie itself, the
// stars, the moon, a candle, a dip, bus fare, wisdom, a sofa, luck, a
// haiku, an appetite, a masterclass, an unapologetic chart, dawn, a
// wage paid in noodles, a wallet left empty but a cookie still warm, a
// broke-but-wiser second try, and a trader who comes back smiling — so
// the scorer has a real spread to choose from instead of eighteen
// variations on the same pun.

const CANDIDATES: string[] = [
  // The cookie as the one asset that cannot be liquidated: the word
  // "liquidated" does double duty, and the cookie outlasts the trade.
  "You will lose your fortune tonight, but keep the cookie: it is the only asset that never gets liquidated.",
  // The stars and the heart disagree, and both lose to dinner: the
  // punchline is small, domestic, and exactly what a 3am trader eats.
  "Your stars say sell; your heart said leverage. Tonight, both agree: dinner is instant noodles.",
  // The moon arrives, but in the wallet, not on the chart — and an empty
  // wallet turns out to be weightless, which is almost a comfort.
  "The moon you chased has landed in your wallet, which is now empty, weightless, and finally at peace.",
  // Old-testament phrasing for a green candle: giveth, taketh, and then
  // the rent goes too, because the market does not stop at the portfolio.
  "Beware the green candle: it giveth, it taketh, and tonight it took your rent as well.",
  // Bright future, empty present: tomorrow's dip-buying money does not
  // exist yet, which is the whole joke and the whole problem.
  "Your future is bright, trader: tomorrow you will buy the dip with money you do not have yet.",
  // Fortune favors the bold, but tonight the bold are down to bus fare:
  // the proverb survives, the trader's budget does not.
  "Fortune favors the bold, so tonight fortune favors whoever still has bus fare home.",
  // The classic consolation — you gained wisdom — collapses on the last
  // two words, because wisdom is not accepted as margin collateral.
  "You came for riches and found wisdom instead; wisdom, unfortunately, does not cover margin.",
  // An oracular comeback is promised, then the search for the capital
  // starts under the furniture, where all lost things go.
  "The stars foretell a great comeback: first, check under the sofa for your trading capital.",
  // Luck walks out with the leverage and leaves the cookie, which is
  // the smallest possible consolation and therefore the funniest one.
  "Luck is a fickle friend; it left with your leverage, but it left the cookie behind.",
  // The portfolio, compressed into a haiku: five coins, seven losses,
  // and a wallet that has gone very quiet.
  "Your portfolio is now a haiku: five coins, seven losses, and one very quiet wallet.",
  // Do not mourn the liquidation, says the cookie — the market took the
  // money, but it could not take the appetite for noodles.
  "Do not mourn the liquidation; the market took your money, not your appetite for noodles.",
  // The loss as education: the trader has now learned so much from being
  // liquidated that they could teach the subject to others.
  "A wise trader learns from loss: you have now learned enough to teach a masterclass.",
  // The comeback is promised by the chart itself, which has never once
  // apologized for anything — the oracle is unreliable and knows it.
  "You will rise again, trader: the chart says so, and the chart has never once apologized.",
  // Luck changes at dawn, which is hours away; until then the only sound
  // advice is to hold the noodles and drop the positions.
  "The cookie says your luck changes at dawn; until then, hold your noodles, not your positions.",
  // The loss as a wage: tomorrow itself is bought with the loss, and
  // the pay arrives as noodles — the trader is hired back by the joke.
  "You will trade again, trader: tonight your loss buys tomorrow, paid in noodles.",
  // The dip kept its promise in reverse: the moon never came, the
  // wallet is empty, and the only thing still warm is the cookie.
  "Beware the dip, trader: it promised the moon and left your wallet empty, cookie still warm.",
  // Luck ran out at 3am, but the cookie does not close the book: broke
  // is a state, wiser is the direction, and tomorrow gets a second try.
  "Your luck ran out at 3am, trader; the cookie says try again tomorrow, broke but wiser.",
  // Dawn as a personnel change: the trader who lost everything is
  // replaced by an older, poorer one who is, against all odds, smiling.
  "The cookie says dawn brings a new trader: older, poorer, and still smiling.",
];

// ------------------------------------------------------- scorer lexicons
// All lexicons are plain word and phrase lists checked against the
// candidate text itself; no candidate carries a pre-assigned score.

const WEIGHTS = [5, 4, 3, 2, 1]; // brief order: criterion 1 matters most.

// Criterion 1, ingredient one: the cookie voice. Oracular openings, the
// cookie frame, the stars, fortune itself. Any one of these marks the
// line as a fortune rather than a tweet about trading.
const FORTUNE_MARKERS = [
  "you will",
  "your stars",
  "the stars",
  "fortune favors",
  "beware",
  "your future",
  "luck is",
  "the cookie",
  "a wise trader",
  "you came for",
  "the moon",
  "do not mourn",
  "you will rise",
  "your portfolio is",
];

// Criterion 1, ingredient two: the loss. Words that say money is gone,
// a position is closed against the trader's will, or the wallet is
// empty. "Bus fare" earns its place here: a trader down to bus fare has
// lost everything above it.
const LOSS_WORDS = [
  "lose",
  "lost",
  "loss",
  "losses",
  "liquidated",
  "liquidation",
  "leverage",
  "margin",
  "empty",
  "rent",
  "money",
  "capital",
  "bus fare",
  "do not have",
  "took your",
  "broke",
  "poorer",
];

// Criterion 1, ingredient three: the trader. Words that say who lost
// it — the person, the position, the market they were playing in.
const TRADER_WORDS = [
  "trader",
  "trading",
  "trade",
  "leverage",
  "margin",
  "position",
  "positions",
  "portfolio",
  "chart",
  "candle",
  "dip",
  "moon",
  "coins",
  "wallet",
  "market",
  "asset",
  "capital",
];

// Criterion 2: warm, rueful markers. Each one says the trader survives
// the loss — still here, still eating, still learning, still coming
// back — which is what makes the joke land as comfort instead of a jab.
const WARM_WORDS = [
  "still",
  "again",
  "rise",
  "tomorrow",
  "dawn",
  "bright",
  "comeback",
  "peace",
  "at peace",
  "wisdom",
  "learn",
  "learned",
  "learns",
  "behind",
  "keep",
  "not your appetite",
  "bus fare home",
  "masterclass",
  "apologized",
  "quiet wallet",
  "sofa",
  "noodles",
  "cookie",
  "wiser",
  "smiling",
];

// Criterion 2: cruel and smug markers. Any one of these turns the
// cookie into a heckler, and the brief is explicit: the joke is never
// cruel and never smug. Each costs 0.40, which is enough to sink a line
// that otherwise scores well.
const CRUEL_WORDS = [
  "idiot",
  "fool",
  "foolish",
  "deserved",
  "stupid",
  "loser",
  "clown",
  "rekt",
  "told you",
  "should have known",
  "your fault",
  "ha ha",
  "serves you",
];
const SMUG_WORDS = [
  "told you so",
  "knew it",
  "obviously",
  "as predicted",
  "i warned you",
];

// Criterion 4: the obvious liquidation puns anyone would reach for.
// The brief asks for a turn nobody else thought of, so leaning on one
// of these costs 0.25 each, even when the rest of the line is strong.
const STALE_PUNS = [
  "buy the dip",
  "to the moon",
  "rekt",
  "hodl",
  "margin call",
  "wen moon",
  "diamond hands",
  "ngmi",
  "have fun staying poor",
  "paper hands",
  "wen lambo",
];

// Criterion 4: strong twists — a turn, a double meaning, or a surprising
// last word. Each of these is a specific, concrete ending that no other
// candidate shares: the cookie that cannot be liquidated, the bus fare,
// the margin that wisdom cannot cover, the sofa, the masterclass, the
// chart that never apologizes.
const STRONG_TWISTS = [
  "never gets liquidated",
  "instant noodles",
  "finally at peace",
  "took your rent",
  "do not have yet",
  "bus fare home",
  "does not cover margin",
  "under the sofa",
  "left the cookie behind",
  "very quiet wallet",
  "appetite for noodles",
  "teach a masterclass",
  "never once apologized",
  "not your positions",
  "weightless",
  "paid in noodles",
  "still warm",
  "broke but wiser",
  "still smiling",
];

// Criterion 4: medium twists — a real turn, but a smaller one: the loss
// named plainly, the wallet gone quiet, the money gone, the luck gone.
const MEDIUM_TWISTS = [
  "liquidated",
  "liquidation",
  "empty",
  "noodles",
  "sofa",
  "rent",
  "masterclass",
  "apologized",
  "wallet",
  "leverage",
  "margin",
];

// Criterion 5: the formal, oracular half of the fortune voice. The
// first half of the line must sound like something a cookie would say
// with a straight face — a prediction, a warning, a proverb.
const FORMAL_MARKERS = [
  "you will",
  "your stars",
  "the stars",
  "fortune favors",
  "beware",
  "your future",
  "luck is",
  "the cookie says",
  "a wise trader",
  "do not mourn",
  "you came for",
  "the moon",
  "your portfolio is",
];

// Criterion 5: the break. The final clause must drop the formality for
// something small, concrete and undignified — noodles, bus fare, a
// sofa, rent, a class to teach, an apology that never arrives. Without
// the break there is a proverb but no punchline.
const BREAK_MARKERS = [
  "instant noodles",
  "noodles",
  "bus fare",
  "sofa",
  "rent",
  "masterclass",
  "apologized",
  "quiet wallet",
  "cover margin",
  "cookie behind",
  "at peace",
  "weightless",
  "liquidated",
  "do not have yet",
  "not your positions",
  "still warm",
  "broke but wiser",
  "still smiling",
];

// Words that do no work inside a twenty-word fortune. A fortune has no
// room for throat-clearing, so fillers are counted in the breath test
// even though none of the candidates leans on them heavily.
const FILLERS = [
  "please",
  "very",
  "just",
  "really",
  "simply",
  "actually",
  "kindly",
  "remember",
  "basically",
  "literally",
];

// ------------------------------------------------------------------ helpers

function lower(text: string): string {
  return text.toLowerCase();
}

function containsAny(text: string, words: string[]): boolean {
  const hay = lower(text);
  return words.some((w) => hay.includes(w));
}

function countDistinct(text: string, words: string[]): number {
  const hay = lower(text);
  return words.filter((w) => hay.includes(w)).length;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Words, split on whitespace, ignoring nothing: a fortune is plain text,
// so a plain split is the honest count the judge will make.
function wordList(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

function wordCount(text: string): number {
  return wordList(text).length;
}

// Code points, not UTF-16 units: the gate counts characters, and an
// emoji or a curly quote must not be miscounted either way.
function charCount(text: string): number {
  return [...text].length;
}

// The final clause is everything after the last strong break in the
// line — a full stop, a semicolon, or a colon. That is where the
// punchline has to live: a fortune's surprise belongs at the end, not
// buried in the middle.
function finalClause(text: string): string {
  const breaks = [". ", "; ", ": "];
  let idx = -1;
  for (const b of breaks) {
    const i = text.lastIndexOf(b);
    if (i > idx) idx = i;
  }
  return idx === -1 ? text : text.slice(idx + 2);
}

// The first clause, for the voice test: the fortune's setup lives here,
// and it is the setup that has to sound oracular.
function firstClause(text: string): string {
  const breaks = [". ", "; ", ": ", ", "];
  let idx = text.length;
  for (const b of breaks) {
    const i = text.indexOf(b);
    if (i !== -1 && i < idx) idx = i;
  }
  return text.slice(0, idx);
}

// The last few words of the text, joined: the surprise must land here,
// not merely somewhere in the final clause.
function lastWords(text: string, n: number): string {
  const words = wordList(lower(text));
  return words.slice(-n).join(" ");
}

// The most predictable liquidation gag in the set is the pun everyone
// reaches for first; a line built on one has to work harder to be
// fresh (criterion 4).
function stalePunCount(text: string): number {
  return countDistinct(text, STALE_PUNS);
}

// ------------------------------------------------------------- per-criterion

// Criterion 1: cookie voice + loss + trader, in that conjunction. Each
// ingredient is worth its share, and a line missing one is docked on
// exactly that ingredient rather than failing outright — the brief says
// a line with no loss and no trader loses to any fortune about a
// liquidated trader, so the loss and trader ingredients carry real
// weight, and the cookie voice is the frame that makes it a fortune.
function scoreCriterion1(text: string): number {
  const fortune = containsAny(text, FORTUNE_MARKERS) ? 0.4 : 0.15;
  const loss = containsAny(text, LOSS_WORDS) ? 0.3 : 0.05;
  const trader = containsAny(text, TRADER_WORDS) ? 0.3 : 0.05;
  return clamp01(fortune + loss + trader);
}

// Criterion 2: rueful and warm, never cruel and never smug. Every line
// starts neutral at 0.55; warm markers lift it, up to three of them,
// and cruel or smug markers drag it down hard, because a cookie that
// mocks a trader who has just lost everything is not funny, it is just
// mean.
function scoreCriterion2(text: string): number {
  const warm = Math.min(3, countDistinct(text, WARM_WORDS));
  const cruel = countDistinct(text, CRUEL_WORDS);
  const smug = countDistinct(text, SMUG_WORDS);
  return clamp01(0.55 + 0.15 * warm - 0.4 * cruel - 0.4 * smug);
}

// Criterion 3: one line, at most 20 words, readable in a single breath.
// Twelve to eighteen words is the sweet spot for a fortune: long enough
// for a setup and a turn, short enough to read whole. Nineteen or twenty
// words still pass the brief but cost a little, and anything outside
// the band slides down from there.
function scoreCriterion3(text: string): number {
  const words = wordCount(text);
  if (words >= 12 && words <= 18) return 1.0;
  if (words === 19 || words === 20) return 0.9;
  if (words >= 10 && words <= 11) return 0.85;
  if (words === 21 || words === 22) return 0.6;
  if (words > 22) return 0.3;
  if (words >= 7 && words <= 9) return 0.7;
  return 0.4;
}

// Criterion 4: the joke is fresh. A strong twist inside the last six
// words is the best possible landing; a strong twist only somewhere in
// the final clause is nearly as good but no longer almost full marks —
// a punchline parked before the last six words arrives late, so it
// scores 0.80; a medium twist is a real turn but a smaller one, 0.70 in
// the last six words and 0.55 in the clause. Then the stale-pun dock:
// the obvious liquidation pun anyone would reach for costs 0.35 each,
// raised from 0.25, because the brief explicitly asks for a turn nobody
// else thought of.
function scoreCriterion4(text: string): number {
  const tail = lastWords(text, 6);
  const clause = lower(finalClause(text));
  let score: number;
  if (STRONG_TWISTS.some((w) => tail.includes(w))) score = 1.0;
  else if (STRONG_TWISTS.some((w) => clause.includes(w))) score = 0.8;
  else if (MEDIUM_TWISTS.some((w) => tail.includes(w))) score = 0.7;
  else if (MEDIUM_TWISTS.some((w) => clause.includes(w))) score = 0.55;
  else score = 0.4;
  score -= 0.35 * stalePunCount(text);
  return clamp01(score);
}

// Criterion 5: the fortune voice in two halves. The first half must
// sound oracular and slightly formal; the final clause must break that
// formality with something small and concrete. A line that stays formal
// all the way through has a setup and no punchline; a line that never
// sounds like a fortune has a punchline and no setup.
function scoreCriterion5(text: string): number {
  const setup = firstClause(text);
  const clause = finalClause(text);
  const formal = containsAny(setup, FORMAL_MARKERS) ? 0.5 : 0.25;
  const broken = containsAny(clause, BREAK_MARKERS) ? 0.5 : 0.15;
  // A line whose whole body is formal still earns the formal half; the
  // break is what it is missing, and the score says so plainly.
  const wholeFormal = containsAny(text, FORMAL_MARKERS) ? 0.5 : formal;
  return clamp01(Math.max(formal, wholeFormal) + broken);
}

const CRITERION_SCORERS = [
  scoreCriterion1,
  scoreCriterion2,
  scoreCriterion3,
  scoreCriterion4,
  scoreCriterion5,
];

interface Scored {
  text: string;
  criteria: number[];
  total: number;
}

function scoreCandidate(text: string): Scored {
  const criteria = CRITERION_SCORERS.map((fn) => fn(text));
  const total = criteria.reduce((sum, c, i) => sum + WEIGHTS[i] * c, 0);
  return { text, criteria, total };
}

// --------------------------------------------------------------------- gate
// The sealed gate, exactly as the brief states it: /output/entry.txt must
// be UTF-8 text of 1 to 160 characters, not only white space. The judge
// adds its own limit of at most 20 words; that is scored under criterion
// 3 rather than gated out, because the brief's gate is the character
// gate and the word limit is a judging matter — but every candidate here
// is inside 20 words anyway, so the distinction costs nothing.

function gateProblems(text: string): string[] {
  const problems: string[] = [];
  const chars = charCount(text);
  if (chars < 1 || chars > 160) {
    problems.push(`length ${chars} outside 1..160 characters`);
  }
  if (text.trim().length === 0) problems.push("only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    problems.push("not a single line");
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    problems.push("not valid UTF-8 round-trip");
  }
  return problems;
}

// A second, stricter check used only for reporting: the judge's own
// word limit, and the filler count that says whether any word is wasted.
function judgeNotes(text: string): string[] {
  const notes: string[] = [];
  const words = wordCount(text);
  if (words > 20) notes.push(`${words} words exceeds the 20-word judge limit`);
  const filler = wordList(text).filter((w) =>
    FILLERS.includes(lower(w).replace(/[^a-z]/g, "")),
  ).length;
  if (filler > 0) notes.push(`${filler} filler word(s)`);
  return notes;
}

// --------------------------------------------------------------------- main

function main(): void {
  // 1. Keep only gate-valid candidates.
  const valid = CANDIDATES.filter((c) => {
    const problems = gateProblems(c);
    if (problems.length > 0) {
      console.error(`excluded candidate (${problems.join("; ")}): ${c}`);
      return false;
    }
    return true;
  });
  if (valid.length === 0) {
    console.error("no gate-valid candidate");
    process.exit(1);
  }

  // 2. Score every candidate, deterministically. Ties break the way the
  // judge walks the brief: criterion by criterion, in the brief's order,
  // then by shorter text, then lexicographically.
  const scored = valid.map(scoreCandidate);
  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    for (let i = 0; i < a.criteria.length; i++) {
      if (b.criteria[i] !== a.criteria[i]) return b.criteria[i] - a.criteria[i];
    }
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });

  for (const s of scored) {
    const notes = judgeNotes(s.text);
    console.log(
      `${s.total.toFixed(2)}  [${s.criteria.map((c) => c.toFixed(2)).join(" ")}]  (${charCount(s.text)} chars, ${wordCount(s.text)} words)${notes.length > 0 ? "  {" + notes.join("; ") + "}" : ""}  ${s.text}`,
    );
  }

  const winner = scored[0];
  console.log(`\nwinner (${charCount(winner.text)} chars, ${wordCount(winner.text)} words): ${winner.text}`);

  // 3. Write the winner, with no trailing newline: the file holds exactly
  //    the one-line fortune, nothing else.
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, winner.text, "utf8");

  // 4. Read it back and verify byte-for-byte against every gate.
  const back = readFileSync(outPath, "utf8");
  const backBytes = readFileSync(outPath);
  if (back !== winner.text) {
    console.error("read-back text differs from winner");
    process.exit(1);
  }
  if (!backBytes.equals(Buffer.from(winner.text, "utf8"))) {
    console.error("read-back bytes differ from winner");
    process.exit(1);
  }
  const problems = gateProblems(back);
  if (problems.length > 0) {
    console.error(`gate failed on written file: ${problems.join("; ")}`);
    process.exit(1);
  }
  const notes = judgeNotes(back);
  if (notes.length > 0) {
    console.error(`judge notes on written file: ${notes.join("; ")}`);
    process.exit(1);
  }

  console.log(`wrote and verified ${outPath} (${backBytes.length} bytes)`);
}

main();
