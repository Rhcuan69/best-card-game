// Ember Court: the game state, the rules, and the AI opponent.
// Pure logic — no DOM, no canvas — so it can be driven by the mouse, the
// keyboard, or the screenshot stager with the same code path.

import { CARD_TYPES, EDGE_BONUS, ELEMENTS, MAX_HAND, MAX_HP, MAX_MANA, START_HAND } from './config.js';
import { buildDeck, drawCards } from './deck.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_OVER = 'over';

export const YOU = 'you';
export const AI = 'ai';

function makeSide(name, rng) {
  return {
    name,
    hp: MAX_HP,
    maxHp: MAX_HP,
    shield: 0,
    mana: 0,
    maxMana: 0,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
    lastAttackElement: null,
  };
}

/** A fresh game, dealt but not started: both sides draw their opening hand. */
export function createGame(rng) {
  const state = {
    rng,
    phase: PHASE_TITLE,
    round: 1,
    active: YOU,
    you: makeSide('You', rng),
    ai: makeSide('Nix', rng),
    log: ['Welcome to Ember Court.'],
    floaters: [],
    played: { you: null, ai: null },
    winner: null,
    stats: { rounds: 0, damageDealt: 0, damageTaken: 0, cardsPlayed: 0 },
    aiPlan: [],
  };
  drawCards(state.you, START_HAND, rng);
  drawCards(state.ai, START_HAND, rng);
  return state;
}

/** Start a match: reset both sides, deal fresh hands, you go first. */
export function startGame(state) {
  const fresh = createGame(state.rng);
  Object.assign(state, fresh);
  state.phase = PHASE_PLAY;
  beginTurn(state, YOU);
  state.log = ['The duel begins — you go first.'];
}

/** Refill mana for the round, draw a card, and hand the turn over. */
export function beginTurn(state, who) {
  const side = state[who];
  side.maxMana = Math.min(MAX_MANA, state.round);
  side.mana = side.maxMana;
  if (side.hand.length < MAX_HAND) drawCards(side, 1, state.rng);
}

/** The other side. */
export function foeOf(who) {
  return who === YOU ? AI : YOU;
}

/** Damage after the Elemental Edge: +2 when this element beats the foe's last attack. */
export function attackDamage(card, foe) {
  const el = ELEMENTS[card.element];
  const edge = el.beats !== null && foe.lastAttackElement === el.beats;
  return { damage: card.value + (edge ? EDGE_BONUS : 0), edge };
}

function addFloater(state, target, text, color) {
  state.floaters.push({ target, text, color, life: 1.2 });
}

function hurt(state, who, damage) {
  const side = state[who];
  let left = damage;
  if (side.shield > 0) {
    const blocked = Math.min(side.shield, left);
    side.shield -= blocked;
    left -= blocked;
  }
  side.hp = Math.max(0, side.hp - left);
  return left;
}

/**
 * Play the card at `handIndex` for `who`. Returns false when the play is not
 * legal (wrong turn, not enough mana, bad index). Every legal play resolves
 * through this one function, whoever plays it.
 */
export function playCard(state, who, handIndex) {
  if (state.phase !== PHASE_PLAY || state.active !== who) return false;
  const side = state[who];
  const foe = state[foeOf(who)];
  const card = side.hand[handIndex];
  if (!card || card.cost > side.mana) return false;

  side.mana -= card.cost;
  side.hand.splice(handIndex, 1);
  side.discard.push(card);
  state.played[who] = card;
  state.stats.cardsPlayed += 1;

  if (card.kind === 'attack') {
    const { damage, edge } = attackDamage(card, foe);
    const dealt = hurt(state, foeOf(who), damage);
    foe.lastAttackElement = card.element;
    if (who === YOU) state.stats.damageDealt += dealt;
    else state.stats.damageTaken += dealt;
    state.log.push(`${side.name} played ${card.name} — ${damage} damage${edge ? ' (Elemental Edge +2!)' : ''}.`);
    addFloater(state, foeOf(who), `-${dealt}`, '#ff6b5e');
    if (card.bonus) {
      drawCards(side, card.bonus, state.rng);
      state.log.push(`${side.name} draws a card.`);
    }
  } else if (card.kind === 'heal') {
    const healed = Math.min(card.value, side.maxHp - side.hp);
    side.hp += healed;
    state.log.push(`${side.name} played ${card.name} — restored ${healed} life.`);
    addFloater(state, who, `+${healed}`, '#7ddb8a');
  } else if (card.kind === 'shield') {
    side.shield += card.value;
    state.log.push(`${side.name} played ${card.name} — gained ${card.value} shield.`);
    addFloater(state, who, `+${card.value} shield`, '#8ecbff');
  } else if (card.kind === 'draw') {
    const drawn = drawCards(side, card.value, state.rng);
    state.log.push(`${side.name} played ${card.name} — drew ${drawn} cards.`);
  }

  if (foe.hp <= 0) {
    state.phase = PHASE_OVER;
    state.winner = who;
    state.stats.rounds = state.round;
    state.log.push(`${side.name} wins the duel!`);
  }
  return true;
}

/** End the current turn and open the next side's turn. */
export function endTurn(state) {
  if (state.phase !== PHASE_PLAY) return;
  const next = foeOf(state.active);
  if (next === YOU) state.round += 1;
  state.active = next;
  beginTurn(state, next);
  state.log.push(next === YOU ? 'Your turn.' : 'Nix takes the turn.');
}

// ---- The AI opponent: Nix, the Tidecaller ----

/** Score one card for `me` against `foe`; higher is better. */
export function scoreCard(card, me, foe) {
  if (card.kind === 'attack') {
    const { damage, edge } = attackDamage(card, foe);
    const lethal = damage >= foe.hp + foe.shield;
    return damage * 1.0 + (lethal ? 6 : 0) + (edge ? 1 : 0) + (card.bonus ? 0.8 : 0) - card.cost * 0.4;
  }
  if (card.kind === 'heal') {
    const missing = me.maxHp - me.hp;
    if (missing <= 0) return -10;
    return Math.min(card.value, missing) * 0.9 + (me.hp <= 10 ? 3 : 0) - card.cost * 0.3;
  }
  if (card.kind === 'shield') {
    if (me.shield >= 8) return -5;
    return card.value * 0.7 + (foe.lastAttackElement ? 1 : 0) - card.cost * 0.3;
  }
  // draw
  return (me.hand.length < 4 ? 3 : 1.2) - card.cost * 0.2;
}

/**
 * Plan one turn as a list of card uids, best first. Style 'best' plays like a
 * sharp opponent; style 'weak' only ever plays cheap cards and never heals or
 * shields, so a staged scene can be won or lost on purpose.
 */
export function planTurn(state, who, style) {
  const me = state[who];
  const foe = state[foeOf(who)];
  const plan = [];
  let mana = me.mana;
  const hand = me.hand.slice();
  for (;;) {
    let best = null;
    let bestScore = style === 'best' ? 1.0 : 2.5;
    for (const card of hand) {
      if (card.cost > mana) continue;
      if (style === 'weak' && (card.cost > 1 || card.kind === 'heal' || card.kind === 'shield')) continue;
      const score = scoreCard(card, me, foe);
      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }
    if (!best) break;
    plan.push(best.uid);
    mana -= best.cost;
    hand.splice(hand.indexOf(best), 1);
  }
  return plan;
}

/** Play the next card of the stored plan (uids), or false when it is spent. */
export function playPlannedCard(state, who) {
  const uid = state.aiPlan[0];
  if (uid === undefined) return false;
  const index = state[who].hand.findIndex((card) => card.uid === uid);
  if (index === -1) {
    state.aiPlan.shift();
    return playPlannedCard(state, who);
  }
  state.aiPlan.shift();
  return playCard(state, who, index);
}

export function cardTypeById(id) {
  return CARD_TYPES.find((type) => type.id === id);
}
