// The screenshot scenes behind ?shot=title|play|win|loss. Each one drives the
// real rules forward from a fresh deal — no hand-placed state — steered by the
// same planTurn() policy the live AI uses, so the frame is what a real game
// looks like and the same seed always gives the same frame.

import { AI, PHASE_OVER, PHASE_PLAY, endTurn, playCard, playPlannedCard, planTurn, startGame, YOU } from './state.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const MAX_ROUNDS = 40;

/** Play one whole turn for `who` with the given style, card by card. */
function playWholeTurn(state, who, style) {
  const plan = planTurn(state, who, style);
  state.aiPlan = plan;
  while (state.phase === PHASE_PLAY && state.active === who) {
    if (!playPlannedCard(state, who)) break;
  }
  if (state.phase === PHASE_PLAY && state.active === who) endTurn(state);
}

/** Run the game forward until `stop(state)` is true or the duel ends. */
function simulate(state, youStyle, aiStyle, stop) {
  for (let round = 0; round < MAX_ROUNDS && state.phase === PHASE_PLAY; round += 1) {
    playWholeTurn(state, YOU, youStyle);
    if (state.phase === PHASE_PLAY) playWholeTurn(state, AI, aiStyle);
    if (stop(state)) break;
  }
}

/**
 * Stage the named scene on a fresh game and return the screen to draw and the
 * best score to show. 'title' shows the title over a fresh deal; 'play' stops
 * mid-duel; 'win'/'loss' play the duel out to its end.
 */
export function stageShot(name, state) {
  if (name === 'title') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  startGame(state);
  if (name === 'win') {
    simulate(state, 'best', 'weak', () => state.phase === PHASE_OVER);
    return { screen: state.phase === PHASE_OVER ? SCREEN_OVER : SCREEN_PLAY, best: state.stats.damageDealt };
  }
  if (name === 'loss') {
    simulate(state, 'weak', 'best', () => state.phase === PHASE_OVER);
    return { screen: state.phase === PHASE_OVER ? SCREEN_OVER : SCREEN_PLAY, best: state.stats.damageDealt };
  }
  // play: a mid-duel table, both hands full, a few rounds in.
  simulate(state, 'best', 'best', (s) => s.round >= 4 && s.you.hp > 0 && s.ai.hp > 0);
  return { screen: state.phase === PHASE_OVER ? SCREEN_OVER : SCREEN_PLAY, best: state.stats.damageDealt };
}

export { PHASE_PLAY, PHASE_OVER };
