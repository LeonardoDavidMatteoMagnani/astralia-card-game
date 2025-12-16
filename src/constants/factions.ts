export const FACTIONS = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  PINK: 'pink',
} as const;

export type FactionType = typeof FACTIONS[keyof typeof FACTIONS];

export const FACTION_LIST = Object.values(FACTIONS);
