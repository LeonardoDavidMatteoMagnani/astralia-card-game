import { useState, useEffect } from "react";
import { getCardsByField } from "../services/cardDataService";
import type { Card } from "../types/Card.ts";
import type { AugCard } from "../types/AugCard";
import CardDisplay from "./CardDisplay";
import CardDetailsModal from "./CardDetailsModal";
import CardFilters from "./CardFilters";
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

  const [protagonistOptions, setProtagonistOptions] = useState<AugCard[]>([]);
  const [personaOptions, setPersonaOptions] = useState<AugCard[]>([]);
  const [deckOptions, setDeckOptions] = useState<AugCard[]>([]);

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

  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const openCardDetails = (card: Card) => setDetailCard(card);
  const closeCardDetails = () => setDetailCard(null);

  useEffect(() => {
    if (!selectedFaction) return;

    (async () => {
      const [pros, personas, deckCards] = await Promise.all([
        getCardsByField("mainDeck", "Protagonist"),
        getCardsByField("mainDeck", "Persona"),
        getCardsByField("mainDeck", "Deck"),
      ]);

      const low = selectedFaction.toLowerCase();
      const mergeList = async (list: Card[]) => {
        const { getCardFaces } = await import("../services/cardDataService");

        const out: AugCard[] = await Promise.all(
          list
            .filter((c) => c.faction.toLowerCase() === low)
            .map(async (c) => {
              try {
                const faces = await getCardFaces(c.id);
                const back = faces.back;
                const frontKeys = (c.keywords || "").trim();
                const backKeys = (back?.keywords || "").trim();
                const mergedKeys = [frontKeys, backKeys]
                  .filter(Boolean)
                  .join(",")
                  .split(",")
                  .map((k: string) => k.trim())
                  .filter(Boolean)
                  .join(",");

                const frontAtk = (c.atk || "").trim();
                const backAtk = (back?.atk || "").trim();
                const mergedAtk = [frontAtk, backAtk]
                  .filter(Boolean)
                  .map((a: string) => a.trim())
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .join(",");

                const frontHp = (c.hp || "").trim();
                const backHp = (back?.hp || "").trim();
                const mergedHp = [frontHp, backHp]
                  .filter(Boolean)
                  .map((h: string) => h.trim())
                  .filter((v, i, arr) => arr.indexOf(v) === i)
                  .join(",");

                const aug: AugCard = {
                  ...c,
                  mergedKeywords: mergedKeys,
                  mergedAtk,
                  mergedHp,
                };
                return aug;
              } catch {
                return { ...c } as AugCard;
              }
            })
        );

        return out;
      };

      setProtagonistOptions(await mergeList(pros));
      setPersonaOptions(await mergeList(personas));
      setDeckOptions(await mergeList(deckCards));
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

  function useFilters() {
    const [searchText, setSearchText] = useState("");
    const [selectedCosts, setSelectedCosts] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [selectedAtks, setSelectedAtks] = useState<string[]>([]);
    const [selectedHps, setSelectedHps] = useState<string[]>([]);

    const clearFilters = () => {
      setSearchText("");
      setSelectedCosts([]);
      setSelectedTypes([]);
      setSelectedSubtypes([]);
      setSelectedKeywords([]);
      setSelectedAtks([]);
      setSelectedHps([]);
    };

    return {
      searchText,
      setSearchText,
      selectedCosts,
      setSelectedCosts,
      selectedTypes,
      setSelectedTypes,
      selectedSubtypes,
      setSelectedSubtypes,
      selectedKeywords,
      setSelectedKeywords,
      selectedAtks,
      setSelectedAtks,
      selectedHps,
      setSelectedHps,
      clearFilters,
    };
  }

  const protagonistFilters = useFilters();
  const personaFilters = useFilters();
  const deckFilters = useFilters();

  const applyFilters = (
    cards: Card[] | (Card & { mergedKeywords?: string })[],
    f: ReturnType<typeof useFilters>
  ) => {
    const q = f.searchText.trim().toLowerCase();

    return cards.filter((card) => {
      if (q) {
        const nameMatch = card.name.toLowerCase().includes(q);
        const idMatch = card.id.toLowerCase().includes(q);
        if (!nameMatch && !idMatch) return false;
      }

      if (
        f.selectedCosts.length > 0 &&
        !f.selectedCosts.includes(String(card.cost))
      )
        return false;
      if (f.selectedTypes.length > 0 && !f.selectedTypes.includes(card.type))
        return false;
      if (
        f.selectedSubtypes.length > 0 &&
        !f.selectedSubtypes.includes(card.subtype)
      )
        return false;

      if (f.selectedKeywords.length > 0) {
        const rawKeywords =
          (card as any).mergedKeywords ?? (card.keywords || "");
        const cardKeys = rawKeywords
          .split(",")
          .map((k: string) => k.trim().toLowerCase())
          .filter(Boolean);
        if (!f.selectedKeywords.some((k) => cardKeys.includes(k.toLowerCase())))
          return false;
      }

      if (f.selectedAtks.length > 0) {
        const rawAtks = (card as any).mergedAtk ?? card.atk ?? "";
        const cardAtkVals = String(rawAtks)
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean);
        if (!f.selectedAtks.some((a) => cardAtkVals.includes(a))) return false;
      }

      if (f.selectedHps.length > 0) {
        const rawHps = (card as any).mergedHp ?? card.hp ?? "";
        const cardHpVals = String(rawHps)
          .split(",")
          .map((h: string) => h.trim())
          .filter(Boolean);
        if (!f.selectedHps.some((h) => cardHpVals.includes(h))) return false;
      }

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
          <div className={styles.cardWrapper}>
            <CardDisplay
              card={protagonistSelection.card}
              onClick={openCardDetails}
            />
          </div>
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
            <div
              className={styles.cardWrapper}
              onClick={(e) => {
                // don't open details if the click originated from an interactive child (flip button, etc.)
                const target = e.target as HTMLElement | null;
                if (!target) return;
                if (
                  target.closest("button") ||
                  target.closest("a") ||
                  target.closest("input")
                )
                  return;
                openCardDetails(it.card);
              }}
              role="button"
            >
              <CardDisplay card={it.card} />
              {section === "deck" && (
                <div className={styles.qtyBadge}>{it.qty}</div>
              )}
            </div>
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
    const filters =
      section === "protagonist"
        ? protagonistFilters
        : section === "persona"
        ? personaFilters
        : deckFilters;

    const displayOptions = applyFilters(options, filters);

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
              <div className={styles.cardWrapper}>
                <CardDisplay card={card} onClick={openCardDetails} />
              </div>
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

        {detailCard && (
          <CardDetailsModal card={detailCard} onClose={closeCardDetails} />
        )}

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
                {editing.protagonist ? (
                  <>
                    <CardFilters
                      options={protagonistOptions}
                      searchText={protagonistFilters.searchText}
                      setSearchText={protagonistFilters.setSearchText}
                      selectedCosts={protagonistFilters.selectedCosts}
                      setSelectedCosts={protagonistFilters.setSelectedCosts}
                      selectedTypes={protagonistFilters.selectedTypes}
                      setSelectedTypes={protagonistFilters.setSelectedTypes}
                      selectedSubtypes={protagonistFilters.selectedSubtypes}
                      setSelectedSubtypes={
                        protagonistFilters.setSelectedSubtypes
                      }
                      selectedKeywords={protagonistFilters.selectedKeywords}
                      setSelectedKeywords={
                        protagonistFilters.setSelectedKeywords
                      }
                      selectedAtks={protagonistFilters.selectedAtks}
                      setSelectedAtks={protagonistFilters.setSelectedAtks}
                      selectedHps={protagonistFilters.selectedHps}
                      setSelectedHps={protagonistFilters.setSelectedHps}
                      clearFilters={protagonistFilters.clearFilters}
                      hideTypeFilter
                    />
                    {renderEditGrid("protagonist")}
                  </>
                ) : (
                  renderSelectedList("protagonist")
                )}
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
                {editing.persona ? (
                  <>
                    <CardFilters
                      options={personaOptions}
                      searchText={personaFilters.searchText}
                      setSearchText={personaFilters.setSearchText}
                      selectedCosts={personaFilters.selectedCosts}
                      setSelectedCosts={personaFilters.setSelectedCosts}
                      selectedTypes={personaFilters.selectedTypes}
                      setSelectedTypes={personaFilters.setSelectedTypes}
                      selectedSubtypes={personaFilters.selectedSubtypes}
                      setSelectedSubtypes={personaFilters.setSelectedSubtypes}
                      selectedKeywords={personaFilters.selectedKeywords}
                      setSelectedKeywords={personaFilters.setSelectedKeywords}
                      selectedAtks={personaFilters.selectedAtks}
                      setSelectedAtks={personaFilters.setSelectedAtks}
                      selectedHps={personaFilters.selectedHps}
                      setSelectedHps={personaFilters.setSelectedHps}
                      clearFilters={personaFilters.clearFilters}
                    />
                    {renderEditGrid("persona")}
                  </>
                ) : (
                  renderSelectedList("persona")
                )}
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
                    <CardFilters
                      options={deckOptions}
                      searchText={deckFilters.searchText}
                      setSearchText={deckFilters.setSearchText}
                      selectedCosts={deckFilters.selectedCosts}
                      setSelectedCosts={deckFilters.setSelectedCosts}
                      selectedTypes={deckFilters.selectedTypes}
                      setSelectedTypes={deckFilters.setSelectedTypes}
                      selectedSubtypes={deckFilters.selectedSubtypes}
                      setSelectedSubtypes={deckFilters.setSelectedSubtypes}
                      selectedKeywords={deckFilters.selectedKeywords}
                      setSelectedKeywords={deckFilters.setSelectedKeywords}
                      selectedAtks={deckFilters.selectedAtks}
                      setSelectedAtks={deckFilters.setSelectedAtks}
                      selectedHps={deckFilters.selectedHps}
                      setSelectedHps={deckFilters.setSelectedHps}
                      clearFilters={deckFilters.clearFilters}
                    />

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
