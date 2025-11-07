import type { Card } from "../types/Card.ts";

export function getCardImagePath(card: Card): string {
  const faction = card.faction.toLowerCase();
  const imageId = card.imageId.toLowerCase();

  return new URL(`/src/assets/${faction}/${imageId}.png`, import.meta.url).href;
}

export function getImagePath(faction: string, imageId: string): string {
  return new URL(`/src/assets/${faction.toLowerCase()}/${imageId.toLowerCase()}.png`, import.meta.url).href;
}
