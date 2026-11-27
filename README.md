# Gobble Getaway — The Great Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/hanafixampret/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/hanafixampret/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is coming. The farmer has the oven hot and the carving knife
sharp — and Tom the turkey is not going to be dinner. Run 900 metres from
the farmyard, through the barn, across the kitchen, to the freedom gate.

## How it plays

- **Run, jump, slide, hide.** Space / ↑ jumps (twice for a double jump),
  ↓ slides under low danger, H ducks into a haystack while the farmer
  searches it. Click the canvas to jump; buttons work with the mouse.
- **The farmer never stops.** He chases from behind and gains ground every
  time you stumble. The gap meter at the bottom of the screen is your real
  health bar — when it hits zero, you are caught.
- **Three stages, harder as you go.** Farmyard fences and rolling pumpkins,
  barn puddles and falling carving knives, kitchen ovens with timed flame
  jets — and a final sprint when the farmer smells dinner.
- **Score:** distance, corn (+50), pumpkin pie (+150), and a +500 bonus for
  escaping. Three lives; a hit costs a life and lets the farmer close in.

## Screens

Title screen, a run in play with a HUD (score, distance, lives, corn,
stage, farmer gap), and end screens for caught or escaped — both with a
restart button. Sound is synthesized live with WebAudio (gobbles, dings,
alarms, fanfares); M mutes.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot mode for the maker's shots: `?shot=start|play|caught|escaped`
with an optional `&seed=N` and `&stage=0|1|2` for the play shot.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the kit's `vendor/makefun-game.ts`. No build
step, no network requests, no files outside `game/` — the game is plain
static files that run offline in desktop Chrome.
