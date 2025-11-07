export interface Card {
  id: string;
  setId: string;
  name: string;
  faction: string;
  mainDeck: string;
  cost: string;
  type: string;
  subtype: string;
  sets: string;
  atk?: string;
  hp?: string;
  keywords?: string;
  flip: boolean;
  face: number;
  singularity: boolean;
  imageId: string;
}