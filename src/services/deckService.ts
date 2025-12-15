import type { Deck, DeckEntry } from "../types/Deck";

const STORAGE_KEY = "astralia.decks";

function loadAll(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Deck[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(decks: Deck[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

function genId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function listDecks(): Deck[] {
  return loadAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDeck(id: string): Deck | undefined {
  return loadAll().find((d) => d.id === id);
}

export function createDeck(input: Omit<Deck, "id" | "updatedAt">): Deck {
  const decks = loadAll();
  const deck: Deck = { ...input, id: genId(), updatedAt: Date.now() };
  decks.push(deck);
  saveAll(decks);
  return deck;
}

export function updateDeck(deck: Deck): Deck {
  const decks = loadAll();
  const idx = decks.findIndex((d) => d.id === deck.id);
  const next = { ...deck, updatedAt: Date.now() };
  if (idx >= 0) decks[idx] = next; else decks.push(next);
  saveAll(decks);
  return next;
}

export function deleteDeck(id: string): void {
  const decks = loadAll().filter((d) => d.id !== id);
  saveAll(decks);
}

// Compact share format to keep it human-shareable and URL safe
// { v:1, n:name, f:faction, p:protagonist, pe:[ids], d:[[id,qty], ...] }
interface SharePayloadV1 {
  v: 1;
  n: string;
  f: string;
  p?: string | null;
  pe: string[];
  d: [string, number][];
}

function toSharePayload(deck: Deck): SharePayloadV1 {
  return {
    v: 1,
    n: deck.name,
    f: deck.faction,
    p: deck.protagonist ?? null,
    pe: deck.persona,
    d: deck.deck.map((e) => [e.id, e.qty]),
  };
}

function fromSharePayload(p: SharePayloadV1): Omit<Deck, "id" | "updatedAt"> {
  return {
    name: p.n,
    faction: p.f,
    protagonist: p.p ?? null,
    persona: p.pe,
    deck: p.d.map(([id, qty]) => ({ id, qty } as DeckEntry)),
    backgroundImage: null,
  };
}

// Robust Base64 for UTF-8 strings
function encodeBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}
function decodeBase64(b64: string) {
  return decodeURIComponent(escape(atob(b64)));
}

export function exportDeck(deck: Deck): string {
  const payload = toSharePayload(deck);
  const json = JSON.stringify(payload);
  return encodeBase64(json);
}

export function importDeck(code: string): Omit<Deck, "id" | "updatedAt"> {
  const json = decodeBase64(code.trim());
  const parsed = JSON.parse(json) as SharePayloadV1;
  if (!parsed || parsed.v !== 1) throw new Error("Unsupported deck format");
  return fromSharePayload(parsed);
}

export async function setDeckBackgroundImage(
  id: string,
  file: File
): Promise<Deck | undefined> {
  const deck = getDeck(id);
  if (!deck) return undefined;
  const dataUrl = await fileToDataUrl(file);
  deck.backgroundImage = dataUrl;
  return updateDeck(deck);
}

export function clearDeckBackgroundImage(id: string): Deck | undefined {
  const deck = getDeck(id);
  if (!deck) return undefined;
  deck.backgroundImage = null;
  return updateDeck(deck);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
