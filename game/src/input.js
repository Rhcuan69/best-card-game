// Ember Court: mouse and keyboard input. Clicks are hit-tested against the
// rectangles render.js draws; keys 1-7 play a hand card, E ends the turn,
// Enter starts, R restarts, P pauses, M mutes.

import { againButtonRect, endTurnRect, muteButtonRect, playerHandRects, titleButtonRect } from './render.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_END_TURN = 'end-turn';
export const ACTION_RESTART = 'restart';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_PLAY_CARD = 'play-card';

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/**
 * Build the input handlers for one canvas. `hooks` is called with the action
 * the player took; main.js owns what each action does.
 */
export function createInput(canvas, hooks) {
  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  function onClick(event) {
    const { x, y } = canvasPoint(event);
    const screen = hooks.screen();
    if (inside(muteButtonRect(), x, y)) {
      hooks.onAction(ACTION_MUTE);
      return;
    }
    if (screen === 'title') {
      if (inside(titleButtonRect(), x, y)) hooks.onAction(ACTION_CONFIRM);
      return;
    }
    if (screen === 'over') {
      if (inside(againButtonRect(), x, y)) hooks.onAction(ACTION_RESTART);
      return;
    }
    if (screen !== 'play') return;
    if (inside(endTurnRect(), x, y)) {
      hooks.onAction(ACTION_END_TURN);
      return;
    }
    const rects = playerHandRects(hooks.handSize());
    for (let i = rects.length - 1; i >= 0; i -= 1) {
      const r = rects[i];
      // A selected card is raised 26 px; accept clicks on the raised card too.
      if (inside(r, x, y) || inside({ x: r.x, y: r.y - 26, w: r.w, h: r.h }, x, y)) {
        hooks.onAction(ACTION_PLAY_CARD, i);
        return;
      }
    }
  }

  function onKey(event) {
    const screen = hooks.screen();
    const key = event.key;
    if (key === 'm' || key === 'M') {
      hooks.onAction(ACTION_MUTE);
      return;
    }
    if (screen === 'title' && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      hooks.onAction(ACTION_CONFIRM);
      return;
    }
    if (screen === 'over' && (key === 'r' || key === 'R' || key === 'Enter')) {
      hooks.onAction(ACTION_RESTART);
      return;
    }
    if (key === 'p' || key === 'P' || key === 'Escape') {
      if (screen === 'play' || screen === 'paused') hooks.onAction(ACTION_PAUSE);
      return;
    }
    if (screen !== 'play') return;
    if (key === 'e' || key === 'E') {
      hooks.onAction(ACTION_END_TURN);
      return;
    }
    const digit = Number.parseInt(key, 10);
    if (digit >= 1 && digit <= 7) hooks.onAction(ACTION_PLAY_CARD, digit - 1);
  }

  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return {
    destroy() {
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    },
  };
}
