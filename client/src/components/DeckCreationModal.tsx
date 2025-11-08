import { useState, useEffect, useMemo } from "react";
import { getCardsByField } from "../services/cardDataService";
import type { Card } from "../types/Card.ts";
import CardDisplay from "./CardDisplay";
import styles from "./DeckCreationModal.module.scss";

interface DeckCreationModalProps {
  onClose: () => void;
}

const factions = ["red", "blue", "green", "purple", "pink"];

type SectionKey = "protagonist" | "persona" | "deck";

interface SelectedCard {
  card: Card;
  qty: number;
}

export default function DeckCreationModal({ onClose }: DeckCreationModalProps) {
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);

  const [protagonistOptions, setProtagonistOptions] = useState<Card[]>([]);
  const [personaOptions, setPersonaOptions] = useState<Card[]>([]);
  const [deckOptions, setDeckOptions] = useState<Card[]>([]);

  const [protagonistSelection, setProtagonistSelection] =
    useState<SelectedCard | null>(null);
  const [personaSelectionMap, setPersonaSelectionMap] = useState<
    Record<string, SelectedCard>
  >({});
  const [deckSelectionMap, setDeckSelectionMap] = useState<
    Record<string, SelectedCard>
  >({});

  const [editing, setEditing] = useState<Record<SectionKey, boolean>>({
    protagonist: false,
    persona: false,
    deck: false,
  });

  useEffect(() => {
    if (!selectedFaction) return;

    (async () => {
      const [pros, personas, deckCards] = await Promise.all([
        getCardsByField("mainDeck", "Protagonist"),
        getCardsByField("mainDeck", "Persona"),
        getCardsByField("mainDeck", "Deck"),
      ]);

      const low = selectedFaction.toLowerCase();
      setProtagonistOptions(
        pros.filter((c) => c.faction.toLowerCase() === low)
      );
      setPersonaOptions(
        personas.filter((c) => c.faction.toLowerCase() === low)
      );
      setDeckOptions(deckCards.filter((c) => c.faction.toLowerCase() === low));
    })();
  }, [selectedFaction]);

  const sectionLimits: Record<SectionKey, number> = {
    protagonist: 1,
    persona: 5,
    deck: 45,
  };

  const perCardMax = 4;

  const getTotalInMap = (map: Record<string, SelectedCard>) =>
    Object.values(map).reduce((s, it) => s + it.qty, 0);

  const toggleEdit = (section: SectionKey) => {
    setEditing((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const [deckSearchMode, setDeckSearchMode] = useState<"name" | "id">("name");
  const [deckSearchText, setDeckSearchText] = useState("");

  const [selectedCosts, setSelectedCosts] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedAtks, setSelectedAtks] = useState<string[]>([]);
  const [selectedHps, setSelectedHps] = useState<string[]>([]);

  const clearDeckFilters = () => {
    setDeckSearchText("");
    setSelectedCosts([]);
    setSelectedTypes([]);
    setSelectedSubtypes([]);
    setSelectedKeywords([]);
    setSelectedAtks([]);
    setSelectedHps([]);
  };

  const deckFilterValues = useMemo(() => {
    const costs = new Set<string>();
    const types = new Set<string>();
    const subtypes = new Set<string>();
    const keywords = new Set<string>();
    const atks = new Set<string>();
    const hps = new Set<string>();

    deckOptions.forEach((c) => {
      if (
        c.cost !== undefined &&
        c.cost !== null &&
        String(c.cost).trim() !== ""
      )
        costs.add(String(c.cost));
      if (c.type) types.add(c.type);
      if (c.subtype) subtypes.add(c.subtype);
      if (c.keywords) {
        c.keywords
          .split(",")
          .map((k) => k.trim())
          .forEach((k) => {
            if (k) keywords.add(k);
          });
      }
      if (c.atk !== undefined && c.atk !== null && String(c.atk).trim() !== "")
        atks.add(String(c.atk));
      if (c.hp !== undefined && c.hp !== null && String(c.hp).trim() !== "")
        hps.add(String(c.hp));
    });

    const sortNumericLike = (arr: string[]) =>
      arr.sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      });

    return {
      costs: sortNumericLike(Array.from(costs)),
      types: Array.from(types).sort(),
      subtypes: Array.from(subtypes).sort(),
      keywords: Array.from(keywords).sort(),
      atks: sortNumericLike(Array.from(atks)),
      hps: sortNumericLike(Array.from(hps)),
    };
  }, [deckOptions]);

  const applyDeckFilters = (cards: Card[]) => {
    const q = deckSearchText.trim().toLowerCase();

    return cards.filter((card) => {
      if (q) {
        if (deckSearchMode === "name") {
          if (!card.name.toLowerCase().includes(q)) return false;
        } else {
          if (!card.id.toLowerCase().includes(q)) return false;
        }
      }

      if (
        selectedCosts.length > 0 &&
        !selectedCosts.includes(String(card.cost))
      )
        return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(card.type))
        return false;
      if (
        selectedSubtypes.length > 0 &&
        !selectedSubtypes.includes(card.subtype)
      )
        return false;

      if (selectedKeywords.length > 0) {
        const cardKeys = (card.keywords || "")
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);
        // match if the card has ANY of the selected keywords
        if (!selectedKeywords.some((k) => cardKeys.includes(k.toLowerCase())))
          return false;
      }

      if (selectedAtks.length > 0 && !selectedAtks.includes(String(card.atk)))
        return false;
      if (selectedHps.length > 0 && !selectedHps.includes(String(card.hp)))
        return false;

      return true;
    });
  };

  const addCard = (section: SectionKey, card: Card) => {
    if (section === "protagonist") {
      setProtagonistSelection({ card, qty: 1 });
      return;
    }

    const map =
      section === "persona"
        ? { ...personaSelectionMap }
        : { ...deckSelectionMap };

    const total = getTotalInMap(map);
    if (total >= sectionLimits[section]) return;

    const existing = map[card.id];
    const maxForCard = section === "persona" ? 1 : perCardMax;
    if (existing) {
      if (existing.qty >= maxForCard) return;
      existing.qty += 1;
    } else {
      map[card.id] = { card, qty: 1 };
    }

    if (section === "persona") setPersonaSelectionMap(map);
    else setDeckSelectionMap(map);
  };

  const removeCard = (section: SectionKey, card: Card) => {
    if (section === "protagonist") {
      setProtagonistSelection((prev) =>
        prev && prev.card.id === card.id ? null : prev
      );
      return;
    }

    const map =
      section === "persona"
        ? { ...personaSelectionMap }
        : { ...deckSelectionMap };
    const existing = map[card.id];
    if (!existing) return;
    existing.qty -= 1;
    if (existing.qty <= 0) delete map[card.id];

    if (section === "persona") setPersonaSelectionMap(map);
    else setDeckSelectionMap(map);
  };

  const renderSelectedList = (section: SectionKey) => {
    if (section === "protagonist") {
      if (!protagonistSelection)
        return <div className={styles.empty}>No protagonist selected</div>;
      return (
        <div className={styles.selectedProtagonist}>
          <CardDisplay card={protagonistSelection.card} />
        </div>
      );
    }

    const map = section === "persona" ? personaSelectionMap : deckSelectionMap;
    const items = Object.values(map);
    if (items.length === 0)
      return <div className={styles.empty}>No cards selected</div>;

    return (
      <div className={styles.selectedGrid}>
        {items.map((it) => (
          <div key={it.card.id} className={styles.selectedItem}>
            <CardDisplay card={it.card} />
            {section === "deck" && (
              <div className={styles.qtyBadge}>{it.qty}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderEditGrid = (section: SectionKey) => {
    const options =
      section === "protagonist"
        ? protagonistOptions
        : section === "persona"
        ? personaOptions
        : deckOptions;
    const map = section === "persona" ? personaSelectionMap : deckSelectionMap;
    const displayOptions =
      section === "deck" ? applyDeckFilters(options) : options;

    return (
      <div className={styles.editGrid}>
        {displayOptions.map((card) => {
          const currentQty =
            section === "protagonist"
              ? protagonistSelection?.card.id === card.id
                ? protagonistSelection.qty
                : 0
              : map[card.id]?.qty ?? 0;

          const total =
            section === "persona"
              ? getTotalInMap(personaSelectionMap)
              : section === "deck"
              ? getTotalInMap(deckSelectionMap)
              : 0;

          const maxForCard =
            section === "protagonist" || section === "persona" ? 1 : perCardMax;

          const disableAdd =
            currentQty >= maxForCard ||
            (section !== "protagonist" && total >= sectionLimits[section]);

          return (
            <div key={card.id} className={styles.editRow}>
              <CardDisplay
                card={card}
                isSelectable={false}
                enableFlip={false}
              />
              <div className={styles.controls}>
                <button
                  onClick={() => removeCard(section, card)}
                  disabled={currentQty <= 0}
                >
                  -
                </button>
                <span className={styles.qty}>{currentQty}</span>
                <button
                  onClick={() => addCard(section, card)}
                  disabled={disableAdd}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        {!selectedFaction ? (
          <>
            <h2>Select Deck Faction</h2>
            <div className={styles.factionList}>
              {factions.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFaction(f)}
                  className={styles.factionButton}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2>{selectedFaction.toUpperCase()} Deck Builder</h2>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>
                  Protagonist
                  <span className={styles.sectionCount}>
                    {protagonistSelection ? protagonistSelection.qty : 0}/
                    {sectionLimits.protagonist}
                  </span>
                </h3>
                <div>
                  <button
                    className={styles.editButton}
                    onClick={() => toggleEdit("protagonist")}
                  >
                    {editing.protagonist ? "Done" : "Edit"}
                  </button>
                </div>
              </div>

              <div className={styles.sectionBody}>
                {editing.protagonist
                  ? renderEditGrid("protagonist")
                  : renderSelectedList("protagonist")}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>
                  Persona Cards
                  <span className={styles.sectionCount}>
                    {getTotalInMap(personaSelectionMap)}/{sectionLimits.persona}
                  </span>
                </h3>
                <div>
                  <button
                    className={styles.editButton}
                    onClick={() => toggleEdit("persona")}
                  >
                    {editing.persona ? "Done" : "Edit"}
                  </button>
                </div>
              </div>

              <div className={styles.sectionBody}>
                {editing.persona
                  ? renderEditGrid("persona")
                  : renderSelectedList("persona")}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>
                  Deck Cards
                  <span className={styles.sectionCount}>
                    {getTotalInMap(deckSelectionMap)}/{sectionLimits.deck}
                  </span>
                </h3>
                <div>
                  <button
                    className={styles.editButton}
                    onClick={() => toggleEdit("deck")}
                  >
                    {editing.deck ? "Done" : "Edit"}
                  </button>
                </div>
              </div>

              <div className={styles.sectionBody}>
                {editing.deck ? (
                  <>
                    <div className={styles.deckFilters}>
                      <div className={styles.searchContainer}>
                        <div className={styles.searchModeButtons}>
                          <button
                            type="button"
                            className={
                              deckSearchMode === "name"
                                ? styles.activeFilter
                                : ""
                            }
                            onClick={() => setDeckSearchMode("name")}
                          >
                            Name
                          </button>
                          <button
                            type="button"
                            className={
                              deckSearchMode === "id" ? styles.activeFilter : ""
                            }
                            onClick={() => setDeckSearchMode("id")}
                          >
                            ID
                          </button>
                        </div>

                        <input
                          className={styles.searchBar}
                          placeholder={`Search ${deckSearchMode}`}
                          value={deckSearchText}
                          onChange={(e) => setDeckSearchText(e.target.value)}
                        />

                        <button
                          type="button"
                          className={styles.editButton}
                          onClick={clearDeckFilters}
                        >
                          Clear
                        </button>
                      </div>

                      <div className={styles.filterRow}>
                        <div className={styles.filterGroup}>
                          <div className={styles.filterTitle}>Cost</div>
                          <div className={styles.filterChips}>
                            {deckFilterValues.costs.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={
                                  selectedCosts.includes(c)
                                    ? styles.chip + " " + styles.activeChip
                                    : styles.chip
                                }
                                onClick={() =>
                                  setSelectedCosts((prev) =>
                                    prev.includes(c)
                                      ? prev.filter((x) => x !== c)
                                      : [...prev, c]
                                  )
                                }
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.filterGroup}>
                          <div className={styles.filterTitle}>Type</div>
                          <div className={styles.filterChips}>
                            {deckFilterValues.types.map((t) => (
                              <button
                                key={t}
                                type="button"
                                className={
                                  selectedTypes.includes(t)
                                    ? styles.chip + " " + styles.activeChip
                                    : styles.chip
                                }
                                onClick={() =>
                                  setSelectedTypes((prev) =>
                                    prev.includes(t)
                                      ? prev.filter((x) => x !== t)
                                      : [...prev, t]
                                  )
                                }
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.filterGroup}>
                          <div className={styles.filterTitle}>Subtype</div>
                          <div className={styles.filterChips}>
                            {deckFilterValues.subtypes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className={
                                  selectedSubtypes.includes(s)
                                    ? styles.chip + " " + styles.activeChip
                                    : styles.chip
                                }
                                onClick={() =>
                                  setSelectedSubtypes((prev) =>
                                    prev.includes(s)
                                      ? prev.filter((x) => x !== s)
                                      : [...prev, s]
                                  )
                                }
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.filterGroup}>
                          <div className={styles.filterTitle}>Keyword</div>
                          <div className={styles.filterChips}>
                            {deckFilterValues.keywords.map((k) => (
                              <button
                                key={k}
                                type="button"
                                className={
                                  selectedKeywords.includes(k)
                                    ? styles.chip + " " + styles.activeChip
                                    : styles.chip
                                }
                                onClick={() =>
                                  setSelectedKeywords((prev) =>
                                    prev.includes(k)
                                      ? prev.filter((x) => x !== k)
                                      : [...prev, k]
                                  )
                                }
                              >
                                {k}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.filterGroup}>
                          <div className={styles.filterTitle}>ATK</div>
                          <div className={styles.filterChips}>
                            {deckFilterValues.atks.map((a) => (
                              <button
                                key={a}
                                type="button"
                                className={
                                  selectedAtks.includes(a)
                                    ? styles.chip + " " + styles.activeChip
                                    : styles.chip
                                }
                                onClick={() =>
                                  setSelectedAtks((prev) =>
                                    prev.includes(a)
                                      ? prev.filter((x) => x !== a)
                                      : [...prev, a]
                                  )
                                }
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.filterGroup}>
                          <div className={styles.filterTitle}>HP</div>
                          <div className={styles.filterChips}>
                            {deckFilterValues.hps.map((h) => (
                              <button
                                key={h}
                                type="button"
                                className={
                                  selectedHps.includes(h)
                                    ? styles.chip + " " + styles.activeChip
                                    : styles.chip
                                }
                                onClick={() =>
                                  setSelectedHps((prev) =>
                                    prev.includes(h)
                                      ? prev.filter((x) => x !== h)
                                      : [...prev, h]
                                  )
                                }
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {renderEditGrid("deck")}
                  </>
                ) : (
                  renderSelectedList("deck")
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
