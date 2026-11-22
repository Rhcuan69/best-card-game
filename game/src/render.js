// Ember Court: everything drawn on the canvas — the table, the hands, the
// cards, the HUD and the title / victory / defeat screens. Layout helpers are
// exported so input.js can hit-test the very rectangles drawn here.

import { ELEMENTS, MAX_HP, VIEW_H, VIEW_W } from './config.js';
import { AI, PHASE_OVER, PHASE_PLAY, PHASE_TITLE, YOU } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export const CARD_W = 150;
export const CARD_H = 210;
export const MINI_W = 132;
export const MINI_H = 184;

const GOLD = '#d9a441';
const CREAM = '#f7ead0';
const INK = '#241a12';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Fanned rectangles for a hand of `count` cards, centred near the bottom. */
export function playerHandRects(count) {
  const rects = [];
  const w = 132;
  const h = 184;
  const gap = count <= 1 ? 0 : Math.min(140, (VIEW_W - 260) / Math.max(1, count - 1));
  const total = w + gap * (count - 1);
  const startX = (VIEW_W - total) / 2;
  for (let i = 0; i < count; i += 1) {
    rects.push({ x: startX + i * gap, y: 584, w, h });
  }
  return rects;
}

/** Face-down rectangles for the opponent's hand, fanned across the top. */
export function aiHandRects(count) {
  const rects = [];
  const w = 84;
  const h = 118;
  const gap = count <= 1 ? 0 : Math.min(92, 420 / Math.max(1, count - 1));
  const total = w + gap * (count - 1);
  const startX = (VIEW_W - total) / 2;
  for (let i = 0; i < count; i += 1) {
    rects.push({ x: startX + i * gap, y: 96, w, h, tilt: (i - (count - 1) / 2) * 0.05 });
  }
  return rects;
}

export function endTurnRect() {
  return { x: 1052, y: 300, w: 188, h: 58 };
}

export function titleButtonRect() {
  return { x: VIEW_W / 2 - 170, y: 560, w: 340, h: 64 };
}

export function againButtonRect() {
  return { x: VIEW_W / 2 - 170, y: 640, w: 340, h: 64 };
}

export function muteButtonRect() {
  return { x: VIEW_W - 64, y: 12, w: 48, h: 36 };
}

function drawGlyph(ctx, glyph, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.beginPath();
  if (glyph === 'flame') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.85, cy - size * 0.2, cx + size * 0.6, cy + size * 0.7, cx, cy + size * 0.8);
    ctx.bezierCurveTo(cx - size * 0.6, cy + size * 0.7, cx - size * 0.85, cy - size * 0.2, cx, cy - size);
  } else if (glyph === 'wave') {
    for (let i = 0; i <= 12; i += 1) {
      const x = cx - size + (2 * size * i) / 12;
      const y = cy + Math.sin((i / 12) * Math.PI * 2) * size * 0.45;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(cx + size, cy + size * 0.7);
    ctx.lineTo(cx - size, cy + size * 0.7);
    ctx.closePath();
  } else if (glyph === 'leaf') {
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size, cy - size * 0.4, cx + size * 0.7, cy + size, cx, cy + size);
    ctx.bezierCurveTo(cx - size * 0.7, cy + size, cx - size, cy - size * 0.4, cx, cy - size);
  } else {
    // gem
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.75, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.75, cy);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.element];
  const scale = w / CARD_W;
  ctx.save();
  if (opts.dimmed) ctx.globalAlpha = 0.45;
  roundRect(ctx, x, y, w, h, 12 * scale);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = el.color;
  ctx.stroke();
  // Element header band.
  roundRect(ctx, x + 4 * scale, y + 4 * scale, w - 8 * scale, 34 * scale, 8 * scale);
  ctx.fillStyle = el.color;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(15 * scale)}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name.toUpperCase(), x + 12 * scale, y + 22 * scale);
  // Cost gem, top right.
  const gemX = x + w - 26 * scale;
  const gemY = y + 22 * scale;
  ctx.beginPath();
  ctx.arc(gemX, gemY, 17 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#2b4a8f';
  ctx.fill();
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = '#cfe0ff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(20 * scale)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), gemX, gemY + 1);
  // Glyph.
  drawGlyph(ctx, el.glyph, x + w / 2, y + 78 * scale, 26 * scale, el.color);
  // Big value.
  ctx.fillStyle = INK;
  ctx.font = `bold ${Math.round(46 * scale)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(card.value), x + w / 2, y + 138 * scale);
  ctx.font = `bold ${Math.round(13 * scale)}px Georgia, serif`;
  ctx.fillStyle = '#6b5a44';
  const kindLabel = card.kind === 'attack' ? 'DAMAGE' : card.kind === 'heal' ? 'HEAL' : card.kind === 'shield' ? 'SHIELD' : 'DRAW';
  ctx.fillText(kindLabel, x + w / 2, y + 160 * scale);
  // Name and rules text.
  ctx.fillStyle = INK;
  ctx.font = `bold ${Math.round(15 * scale)}px Georgia, serif`;
  ctx.fillText(card.name, x + w / 2, y + h - 34 * scale);
  ctx.font = `${Math.round(11.5 * scale)}px Georgia, serif`;
  ctx.fillStyle = '#5a4a38';
  wrapText(ctx, card.text, x + w / 2, y + h - 18 * scale, w - 16 * scale, 13 * scale);
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [''];
  for (const word of words) {
    const test = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && lines[lines.length - 1]) lines.push(word);
    else lines[lines.length - 1] = test;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => ctx.fillText(line, cx, y + i * lineHeight));
}

function drawCardBack(ctx, x, y, w, h, tilt = 0) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  roundRect(ctx, -w / 2, -h / 2, w, h, 8);
  ctx.fillStyle = '#3a2a5e';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  roundRect(ctx, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 6);
  ctx.strokeStyle = 'rgba(217,164,65,0.7)';
  ctx.stroke();
  drawGlyph(ctx, 'flame', 0, 0, w * 0.22, GOLD);
  ctx.restore();
}

function drawHpBar(ctx, x, y, w, hp, maxHp, shield, label) {
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  ctx.fillText(label, x, y - 16);
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  if (frac > 0) {
    roundRect(ctx, x + 2, y + 2, (w - 4) * frac, 18, 9);
    ctx.fillStyle = frac > 0.5 ? '#58c96b' : frac > 0.25 ? '#e8b93c' : '#e8492f';
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${hp} / ${maxHp}`, x + w / 2, y + 12);
  if (shield > 0) {
    ctx.fillStyle = '#2f8fe8';
    roundRect(ctx, x + w + 10, y, 76, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(`SHIELD ${shield}`, x + w + 48, y + 12);
  }
  ctx.restore();
}

function drawMana(ctx, x, y, mana, maxMana, label) {
  ctx.save();
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  for (let i = 0; i < maxMana; i += 1) {
    const cx = x + 62 + i * 24;
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    const s = 8;
    ctx.fillStyle = i < mana ? '#7ec8ff' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.strokeStyle = i < mana ? '#cfe8ff' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    ctx.restore();
  }
  ctx.restore();
}

function drawPortrait(ctx, x, y, r, glyph, color, name) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#2c2118';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
  drawGlyph(ctx, glyph, x, y - 4, r * 0.42, color);
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + r + 16);
  ctx.restore();
}

function drawButton(ctx, rect, label, enabled, accent) {
  ctx.save();
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = enabled ? accent : 'rgba(255,255,255,0.14)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = enabled ? '#fff' : 'rgba(255,255,255,0.35)';
  ctx.stroke();
  ctx.fillStyle = enabled ? '#fff' : 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.restore();
}

function drawTable(ctx) {
  const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 80, VIEW_W / 2, VIEW_H / 2, 760);
  grad.addColorStop(0, '#2f6b3c');
  grad.addColorStop(1, '#173d22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = 'rgba(217,164,65,0.55)';
  ctx.lineWidth = 3;
  roundRect(ctx, 14, 14, VIEW_W - 28, VIEW_H - 28, 26);
  ctx.stroke();
  // Centre emblem: a faint court circle.
  ctx.save();
  ctx.strokeStyle = 'rgba(247,234,208,0.10)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(VIEW_W / 2, 330, 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(VIEW_W / 2, 330, 84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayScreen(ctx, state, opts) {
  drawTable(ctx);
  const { you, ai } = state;

  // Top bar.
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('EMBER COURT', 28, 34);
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = 'rgba(247,234,208,0.75)';
  ctx.textAlign = 'center';
  ctx.fillText(
    state.phase === PHASE_OVER
      ? `Duel over — ${state.winner === YOU ? 'you win' : 'Nix wins'}`
      : state.active === YOU
        ? `Round ${state.round} — your turn: play cards, then End Turn (E)`
        : `Round ${state.round} — Nix is playing…`,
    VIEW_W / 2,
    34,
  );
  ctx.restore();
  const mute = muteButtonRect();
  drawButton(ctx, mute, opts.muted ? '♪✕' : '♪', true, 'rgba(0,0,0,0.35)');

  // Opponent zone.
  drawPortrait(ctx, 92, 158, 40, 'wave', '#2f8fe8', 'NIX');
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Nix — Tidecaller', 146, 118);
  ctx.restore();
  drawHpBar(ctx, 146, 132, 300, ai.hp, ai.maxHp, ai.shield, '');
  drawMana(ctx, 146, 176, ai.mana, ai.maxMana, 'Mana');
  const aiRects = aiHandRects(ai.hand.length);
  aiRects.forEach((r) => drawCardBack(ctx, r.x, r.y, r.w, r.h, r.tilt));
  ctx.save();
  ctx.fillStyle = 'rgba(247,234,208,0.85)';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${ai.hand.length} cards in hand`, VIEW_W / 2, 232);
  ctx.restore();

  // Centre: last played cards.
  ctx.save();
  ctx.fillStyle = 'rgba(247,234,208,0.85)';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LAST PLAYED', VIEW_W / 2, 262);
  ctx.restore();
  if (state.played.ai) {
    drawCardFace(ctx, state.played.ai, 470, 276, MINI_W, MINI_H);
    ctx.save();
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("Nix's card", 470 + MINI_W / 2, 472);
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = 'rgba(247,234,208,0.35)';
    ctx.setLineDash([6, 6]);
    roundRect(ctx, 470, 276, MINI_W, MINI_H, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(247,234,208,0.5)';
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('— no card yet —', 470 + MINI_W / 2, 368);
    ctx.restore();
  }
  if (state.played.you) {
    drawCardFace(ctx, state.played.you, 678, 276, MINI_W, MINI_H);
    ctx.save();
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Your card', 678 + MINI_W / 2, 472);
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = 'rgba(247,234,208,0.35)';
    ctx.setLineDash([6, 6]);
    roundRect(ctx, 678, 276, MINI_W, MINI_H, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(247,234,208,0.5)';
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('— no card yet —', 678 + MINI_W / 2, 368);
    ctx.restore();
  }
  // Elemental edge hint.
  ctx.save();
  ctx.fillStyle = 'rgba(247,234,208,0.9)';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Flame beats Leaf · Leaf beats Tide · Tide beats Flame — beat the foe’s last element for +2 damage', VIEW_W / 2, 500);
  ctx.restore();

  // Log, right side.
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  roundRect(ctx, 1052, 372, 188, 108, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(247,234,208,0.9)';
  ctx.font = '12.5px Georgia, serif';
  ctx.textAlign = 'left';
  const lines = state.log.slice(-5);
  lines.forEach((line, i) => {
    ctx.fillText(line.length > 34 ? `${line.slice(0, 33)}…` : line, 1062, 392 + i * 18);
  });
  ctx.restore();

  // End Turn button.
  const endRect = endTurnRect();
  drawButton(ctx, endRect, 'END TURN  (E)', state.active === YOU && state.phase === PHASE_PLAY, '#b3541e');

  // Player zone: an info strip above the hand, so the cards never cover it.
  drawPortrait(ctx, 78, 540, 30, 'flame', '#e8492f', 'YOU');
  ctx.save();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('You — Ember Warden', 124, 522);
  ctx.restore();
  drawHpBar(ctx, 124, 532, 240, you.hp, you.maxHp, you.shield, '');
  drawMana(ctx, 124, 566, you.mana, you.maxMana, 'Mana');
  ctx.save();
  ctx.fillStyle = 'rgba(247,234,208,0.85)';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Deck: ${you.deck.length} cards`, 440, 534);
  ctx.fillText(`Score: ${state.stats.damageDealt} damage dealt`, 440, 566);
  ctx.restore();

  // Player hand.
  const rects = playerHandRects(you.hand.length);
  you.hand.forEach((card, i) => {
    const r = rects[i];
    const selected = opts.selected === i;
    const affordable = card.cost <= you.mana && state.active === YOU;
    drawCardFace(ctx, card, r.x, selected ? r.y - 26 : r.y, r.w, r.h, { dimmed: !affordable });
    if (selected) {
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffd76a';
      roundRect(ctx, r.x - 3, r.y - 29, r.w + 6, r.h + 6, 14);
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.save();
  ctx.fillStyle = 'rgba(247,234,208,0.85)';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Click a card to play it  ·  keys 1–7 play · E ends the turn', VIEW_W / 2, 786);
  ctx.restore();

  // Floaters.
  for (const f of state.floaters) {
    const anchor = f.target === YOU ? { x: 250, y: 540 } : { x: 300, y: 158 };
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.fillStyle = f.color;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, anchor.x, anchor.y - (1.2 - f.life) * 60);
    ctx.restore();
  }
}

function drawTitleScreen(ctx, best) {
  drawTable(ctx);
  // Show a sample hand behind the title panel for flavour.
  const sample = [
    { id: 'wildfire', name: 'Wildfire', element: 'flame', kind: 'attack', cost: 4, value: 8, text: 'Deal 8 damage.' },
    { id: 'riptide', name: 'Riptide', element: 'tide', kind: 'attack', cost: 3, value: 6, bonus: 1, text: 'Deal 6 damage. Draw a card.' },
    { id: 'mend', name: 'Grove Mend', element: 'leaf', kind: 'heal', cost: 2, value: 6, text: 'Restore 6 life.' },
    { id: 'bastion', name: 'Bastion', element: 'stone', kind: 'shield', cost: 2, value: 6, text: 'Gain 6 shield.' },
  ];
  sample.forEach((card, i) => {
    const x = 300 + i * 175;
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawCardFace(ctx, card, x, 84, CARD_W * 0.92, CARD_H * 0.92);
    ctx.restore();
  });
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,8,0.72)';
  roundRect(ctx, 190, 330, 900, 300, 20);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  roundRect(ctx, 190, 330, 900, 300, 20);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBER COURT', VIEW_W / 2, 410);
  ctx.fillStyle = CREAM;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('A duel of element cards — outplay Nix, the Tidecaller, before your life runs out.', VIEW_W / 2, 448);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = 'rgba(247,234,208,0.9)';
  ctx.fillText('Both wardens start at 30 life. Mana grows one crystal a turn.', VIEW_W / 2, 482);
  ctx.fillText('Flame beats Leaf, Leaf beats Tide, Tide beats Flame — beat the foe’s last element for +2 damage.', VIEW_W / 2, 506);
  ctx.fillText('Click a card or press 1–7 to play it · E ends your turn · first to 0 life loses.', VIEW_W / 2, 530);
  if (best > 0) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(`Best duel: ${best} damage dealt`, VIEW_W / 2, 556);
  }
  ctx.restore();
  drawButton(ctx, titleButtonRect(), 'PLAY THE DUEL  (Enter)', true, '#b3541e');
  ctx.save();
  ctx.fillStyle = 'rgba(247,234,208,0.7)';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('An original card game — no network, no accounts, just the table.', VIEW_W / 2, 660);
  ctx.restore();
}

function drawOverScreen(ctx, state, best) {
  drawPlayScreen(ctx, state, { selected: -1, muted: false });
  const won = state.winner === YOU;
  ctx.save();
  ctx.fillStyle = 'rgba(16,10,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = won ? '#ffd76a' : '#ff8a7a';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', VIEW_W / 2, 300);
  ctx.fillStyle = CREAM;
  ctx.font = '22px Georgia, serif';
  ctx.fillText(
    won ? 'Nix bows to the Ember Warden — the court is yours.' : 'Nix takes the court this time — the tide was stronger.',
    VIEW_W / 2,
    348,
  );
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = 'rgba(247,234,208,0.92)';
  ctx.fillText(`Rounds played: ${state.stats.rounds}    ·    Damage dealt: ${state.stats.damageDealt}    ·    Cards played: ${state.stats.cardsPlayed}`, VIEW_W / 2, 400);
  ctx.fillText(`Your life: ${state.you.hp} / ${MAX_HP}    ·    Nix's life: ${state.ai.hp} / ${MAX_HP}`, VIEW_W / 2, 432);
  ctx.restore();
  drawButton(ctx, againButtonRect(), 'PLAY AGAIN  (R)', true, won ? '#2f7d3c' : '#b3541e');
}

function drawPausedScreen(ctx, state) {
  drawPlayScreen(ctx, state, { selected: -1, muted: false });
  ctx.save();
  ctx.fillStyle = 'rgba(16,10,6,0.7)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW_W / 2, 380);
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Press P or Esc to carry on.', VIEW_W / 2, 424);
  ctx.restore();
}

/** Paint the current screen. `opts` carries the selected card and mute state. */
export function draw(ctx, state, screen, opts) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (screen === SCREEN_TITLE) drawTitleScreen(ctx, opts.best);
  else if (screen === SCREEN_OVER) drawOverScreen(ctx, state, opts.best);
  else if (screen === SCREEN_PAUSED) drawPausedScreen(ctx, state);
  else drawPlayScreen(ctx, state, opts);
}

/** Bind a canvas at the game's fixed 1280x800 resolution and return a painter. */
export function createRenderer(canvas) {
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext('2d');
  return {
    draw(state, screen, opts) {
      draw(ctx, state, screen, opts);
    },
  };
}
