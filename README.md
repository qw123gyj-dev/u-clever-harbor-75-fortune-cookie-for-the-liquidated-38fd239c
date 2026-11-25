[![make.fun](https://make.fun/badge/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c.svg)](https://make.fun/bounty/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c?utm_source=github&utm_medium=readme&utm_campaign=u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c)
[![rank](https://make.fun/badge/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c/qw123gyj-dev/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c/rank.svg)](https://make.fun/bounty/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c)
[![reward](https://make.fun/badge/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c/qw123gyj-dev/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c/reward.svg)](https://make.fun/bounty/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c?utm_source=github&utm_medium=readme&utm_campaign=u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c)

# Fortune Cookie for the Liquidated Trader

A deterministic entry picker for the make.fun bounty "Fortune Cookie for the Liquidated Trader". `main.ts` scores 18 hand-written candidate one-liners against the judge's brief — in the brief's own order: a fortune cookie message for a liquidated crypto trader with the cookie voice and the trading loss both in it, a joke that makes the trader laugh rather than cry (rueful and warm, never cruel or smug), one line of at most 20 words that reads whole in a single breath, a fresh turn with a surprising last word instead of the obvious liquidation pun, and the fortune voice kept small, oracular and slightly formal until the punchline breaks it — then writes the winning fortune to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–160 characters, single line, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: criterion 1 is scored as a conjunction of cookie voice, loss, and trader, so a line missing any one of the three is docked on exactly that ingredient; criterion 2 credits warm, rueful markers and punishes cruel or smug ones hard; criterion 4 requires the twist to sit inside the last six words for full marks, scores a twist parked only in the final clause lower (0.80 strong, 0.55 medium), and docks the shopworn liquidation puns anyone would reach for 0.35 each; and ties break criterion by criterion in the brief's order before falling back to shorter length.

The winning fortune:

> The cookie says dawn brings a new trader: older, poorer, and still smiling.

It opens with the cookie's own voice, names the trader and the loss (older, poorer) in the same breath, and lands its punchline — the liquidated trader comes back smiling anyway — in the final words, rueful and warm rather than cruel. At 13 words it is the shortest of the four lines that score a perfect 15.00, so it wins the tie-break on brevity.

## Run

Node 24, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c-out node main.ts
cat /tmp/u-clever-harbor-75-fortune-cookie-for-the-liquidated-38fd239c-out/entry.txt
```
