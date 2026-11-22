[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Rhcuan69/best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Rhcuan69/best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Court

A duel of element cards. You are the Ember Warden; across the table sits Nix,
the Tidecaller. Both wardens start at 30 life. Mana grows one crystal a turn,
and each turn you draw a card and play as many as you can afford — attacks,
heals, shields, and card draw — until one of you reaches 0 life.

The twist is the **Elemental Edge**: Flame beats Leaf, Leaf beats Tide, Tide
beats Flame. Play an attack whose element beats the foe's last attack element
and it lands for +2 damage. Stone is neutral and simply hits hard. Watch what
Nix plays, hold the card that answers it, and strike when the edge is yours.

## How to play

- **Click a card** (or press **1–7**) to play it.
- **E** or the **End Turn** button passes to Nix, who plays one card at a time
  so you can watch the plan unfold.
- **P** pauses, **M** mutes the sounds, **R** starts a new duel after one ends.
- Keyboard and mouse both work; the game runs entirely offline from static
  files — open `game/index.html` in a desktop browser.

## The cards

Ten card types in four elements, three copies each (a 30-card deck):

| Element | Cards |
| --- | --- |
| Flame | Ember Spark (1 mana, 3 dmg), Flame Lash (2, 5 dmg), Wildfire (4, 8 dmg) |
| Tide | Tide Slap (1, 3 dmg), Riptide (3, 6 dmg + draw a card) |
| Leaf | Thorn Whip (2, 5 dmg), Grove Mend (2, restore 6 life) |
| Stone | Stone Fist (3, 7 dmg), Bastion (2, gain 6 shield), Quarry Draw (1, draw 2) |

## Layout

- `game/` — the playable game: `index.html` plus ES modules under `src/`
  (`config.js` card catalog, `state.js` rules + AI, `render.js` canvas
  drawing, `input.js` mouse/keyboard, `audio.js` synthesised sounds,
  `shots.js` staged screenshot scenes, `main.js` boot + loop).
- `screenshots/` — real renders of the game in a browser (title, mid-duel
  table, victory, defeat).
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny static server for play-testing (`node serve.ts`).

Screenshots are staged through `?shot=title|play|win|loss&seed=N`, which drives
the real rules forward with the same AI policy the live game uses — every
frame is a real render of the game's own code.

## License

MIT — see [LICENSE](LICENSE).
