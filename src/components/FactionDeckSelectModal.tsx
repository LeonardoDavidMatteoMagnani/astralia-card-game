import { listDecks } from "../services/deckService";
import FactionSelection from "./FactionSelection";
import styles from "./FactionDeckSelectModal.module.scss";

interface SelectModalProps {
  open: boolean;
  onClose: () => void;
  faction: string | null;
  onFactionChange: (f: string) => void;
  onPickDeck: (deckId: string) => void;
}

export default function FactionDeckSelectModal({
  open,
  onClose,
  faction,
  onFactionChange,
  onPickDeck,
}: SelectModalProps) {
  const allDecks = listDecks();
  const decks = faction
    ? allDecks.filter((d) => d.faction.toLowerCase() === faction.toLowerCase())
    : [];

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Select Faction & Deck</h3>

        <div className={styles.factionSection}>
          <FactionSelection
            factions={["red", "blue", "green", "purple", "pink"]}
            onSelect={onFactionChange}
          />
        </div>

        <div className={styles.decksGrid}>
          {decks.map((d) => (
            <button
              key={d.id}
              className={styles.deckCard}
              onClick={() => {
                onPickDeck(d.id);
                onClose();
              }}
            >
              <div className={styles.deckName}>{d.name}</div>
              <div className={styles.deckMeta}>
                {d.faction.toUpperCase()} • {d.deck.length} cards
              </div>
            </button>
          ))}

          {decks.length === 0 && faction && (
            <div className={styles.emptyMessage}>
              No decks for faction {faction.toUpperCase()}
            </div>
          )}

          {!faction && (
            <div className={styles.emptyMessage}>Pick a faction first</div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
