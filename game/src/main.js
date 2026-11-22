// Ember Court: boot and the one loop. The game moves between four screens —
// title, play, paused and over — and the AI takes its turn one card at a time
// so the player can watch Nix think.
//
// ?seed=N fixes the deal. ?shot=title|play|win|loss (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  AI,
  PHASE_OVER,
  PHASE_PLAY,
  PHASE_TITLE,
  createGame,
  endTurn,
  playCard,
  playPlannedCard,
  planTurn,
  startGame,
  YOU,
} from './state.js';
import {
  ACTION_CONFIRM,
  ACTION_END_TURN,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_PLAY_CARD,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import {
  damageSound,
  healSound,
  isMuted,
  loseSound,
  playCardSound,
  toggleMute,
  turnSound,
  winSound,
} from './audio.js';

const AI_CARD_DELAY = 0.75;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const state = createGame(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, state);
  // A staged frame is a still: clear the transient damage numbers, which
  // would otherwise sit mid-flight over the life bars.
  state.floaters.length = 0;
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, { selected: -1, muted: false, best: scene.best });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, {
    screen: () => screen,
    handSize: () => state.you.hand.length,
    onAction,
  });
  let screen = SCREEN_TITLE;
  let best = readBest();
  let selected = -1;
  let aiClock = 0;
  let last = performance.now();

  function setStatus(text) {
    status.textContent = text;
  }

  function onGameOver() {
    screen = SCREEN_OVER;
    if (state.stats.damageDealt > best) {
      best = state.stats.damageDealt;
      saveBest(best);
    }
    if (state.winner === YOU) winSound();
    else loseSound();
    setStatus(state.winner === YOU ? 'Victory! You won the duel.' : 'Defeat. Nix won the duel.');
  }

  function onAction(action, index) {
    if (action === ACTION_MUTE) {
      toggleMute();
      return;
    }
    if (action === ACTION_CONFIRM && screen === SCREEN_TITLE) {
      startGame(state);
      screen = SCREEN_PLAY;
      turnSound();
      setStatus('Your turn. Play a card or end the turn.');
      return;
    }
    if (action === ACTION_RESTART && screen === SCREEN_OVER) {
      startGame(state);
      screen = SCREEN_PLAY;
      selected = -1;
      setStatus('A new duel begins. Your turn.');
      return;
    }
    if (action === ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
      return;
    }
    if (screen !== SCREEN_PLAY || state.phase !== PHASE_PLAY) return;
    if (action === ACTION_END_TURN) {
      if (state.active !== YOU) return;
      selected = -1;
      endTurn(state);
      state.aiPlan = planTurn(state, AI, 'best');
      aiClock = 0;
      turnSound();
      setStatus("Nix's turn.");
      return;
    }
    if (action === ACTION_PLAY_CARD) {
      if (state.active !== YOU || index === undefined) return;
      const card = state.you.hand[index];
      if (!card) return;
      if (card.cost > state.you.mana) {
        setStatus(`${card.name} costs ${card.cost} mana — you have ${state.you.mana}.`);
        return;
      }
      selected = index;
      if (playCard(state, YOU, index)) {
        if (card.kind === 'attack') damageSound();
        else if (card.kind === 'heal' || card.kind === 'draw') healSound();
        else playCardSound();
        selected = -1;
        if (state.phase === PHASE_OVER) onGameOver();
        else setStatus(state.log[state.log.length - 1]);
      }
    }
  }

  function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_PLAY && state.phase === PHASE_PLAY) {
      // Nix plays one planned card per beat, then passes.
      if (state.active === AI) {
        aiClock += dt;
        if (aiClock >= AI_CARD_DELAY) {
          aiClock = 0;
          if (!playPlannedCard(state, AI)) {
            endTurn(state);
            setStatus('Your turn. Play a card or end the turn.');
          } else if (state.phase === PHASE_OVER) {
            onGameOver();
          }
        }
      }
      for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
        state.floaters[i].life -= dt;
        if (state.floaters[i].life <= 0) state.floaters.splice(i, 1);
      }
    }
    renderer.draw(state, screen, { selected, muted: isMuted(), best });
    requestAnimationFrame(frame);
  }

  setStatus('Ember Court. Press Enter or click Play to start the duel.');
  requestAnimationFrame(frame);
  return input;
}

if (shot) runShot(shot);
else runGame();
