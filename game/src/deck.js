// Deck building and drawing. A deck is 3 copies of each of the 10 card types
// (30 cards). Drawing from an empty deck reshuffles the discard pile; when
// both are empty the draw simply does nothing.

import { CARD_TYPES, DECK_SIZE } from './config.js';
import { shuffle } from './random.js';

let nextUid = 1;

/** Build a fresh shuffled deck of card instances (each with its own uid). */
export function buildDeck(rng) {
  const cards = [];
  for (let copy = 0; copy < 3; copy += 1) {
    for (const type of CARD_TYPES) cards.push({ ...type, uid: nextUid++ });
  }
  if (cards.length !== DECK_SIZE) throw new Error('deck size mismatch');
  return shuffle(cards, rng);
}

/** Draw `count` cards into `side.hand`, reshuffling the discard when needed. */
export function drawCards(side, count, rng) {
  let drawn = 0;
  for (let i = 0; i < count; i += 1) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = shuffle(side.discard, rng);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
    drawn += 1;
  }
  return drawn;
}
