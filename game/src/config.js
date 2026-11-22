// Ember Court: constants and the card catalog.
// A duel card game: two wardens, 30 life each, mana that grows one crystal a
// turn, and a deck of element cards. Flame beats Leaf, Leaf beats Tide, Tide
// beats Flame; Stone is neutral and hits hard. An attack whose element beats
// the foe's last attack element lands an Elemental Edge (+2 damage).

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const MAX_HP = 30;
export const START_HAND = 3;
export const MAX_HAND = 7;
export const MAX_MANA = 10;
export const DECK_SIZE = 30;

// The four elements: colour, a darker edge colour, the element it beats, and
// the glyph the renderer draws (never text alone).
export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e8492f', dark: '#8f1f0e', beats: 'leaf', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f8fe8', dark: '#0e4a8f', beats: 'flame', glyph: 'wave' },
  leaf: { name: 'Leaf', color: '#3fae4a', dark: '#1c6b26', beats: 'tide', glyph: 'leaf' },
  stone: { name: 'Stone', color: '#c9922e', dark: '#7a5510', beats: null, glyph: 'gem' },
};

// kind: 'attack' | 'heal' | 'shield' | 'draw'. value is damage, healing,
// shield or cards drawn; bonus is an extra effect (drawn cards on attacks).
export const CARD_TYPES = [
  { id: 'ember', name: 'Ember Spark', element: 'flame', kind: 'attack', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { id: 'lash', name: 'Flame Lash', element: 'flame', kind: 'attack', cost: 2, value: 5, text: 'Deal 5 damage.' },
  { id: 'wildfire', name: 'Wildfire', element: 'flame', kind: 'attack', cost: 4, value: 8, text: 'Deal 8 damage.' },
  { id: 'slap', name: 'Tide Slap', element: 'tide', kind: 'attack', cost: 1, value: 3, text: 'Deal 3 damage.' },
  { id: 'riptide', name: 'Riptide', element: 'tide', kind: 'attack', cost: 3, value: 6, bonus: 1, text: 'Deal 6 damage. Draw a card.' },
  { id: 'thorn', name: 'Thorn Whip', element: 'leaf', kind: 'attack', cost: 2, value: 5, text: 'Deal 5 damage.' },
  { id: 'mend', name: 'Grove Mend', element: 'leaf', kind: 'heal', cost: 2, value: 6, text: 'Restore 6 life.' },
  { id: 'fist', name: 'Stone Fist', element: 'stone', kind: 'attack', cost: 3, value: 7, text: 'Deal 7 damage.' },
  { id: 'bastion', name: 'Bastion', element: 'stone', kind: 'shield', cost: 2, value: 6, text: 'Gain 6 shield.' },
  { id: 'quarry', name: 'Quarry Draw', element: 'stone', kind: 'draw', cost: 1, value: 2, text: 'Draw 2 cards.' },
];

export const EDGE_BONUS = 2;
export const BEST_KEY = 'ember-court-best';
export const STEP = 1 / 60;
