import { readCardData } from "../data/cardDataReader.ts";
import type { Card } from "../types/Card.ts";

export async function getAllCards(): Promise<Card[]> {
  return readCardData();
}

export async function getCardById(id: string): Promise<Card | undefined> {
  const cards = await readCardData();
  return cards.find((card) => card.id.toLowerCase() === id.toLowerCase());
}

export async function getCardsByFaction(faction: string): Promise<Card[]> {
  const cards = await readCardData();
  return cards.filter((card) => card.faction.toLowerCase() === faction.toLowerCase());
}

export async function getCardsByField<T extends keyof Card>(
  field: T,
  value: string
): Promise<Card[]> {
  const cards = await readCardData();
  const target = value.toLowerCase();

  return cards.filter((card) => {
    const fieldValue = card[field];
    if (typeof fieldValue === "string") return fieldValue.toLowerCase() === target;
    if (Array.isArray(fieldValue)) return fieldValue.some((v) => v.toLowerCase() === target);
    return false;
  });
}
