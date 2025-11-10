import type { Card } from "./Card";

export type AugCard = Card & {
  mergedKeywords?: string;
  mergedAtk?: string;
  mergedHp?: string;
};