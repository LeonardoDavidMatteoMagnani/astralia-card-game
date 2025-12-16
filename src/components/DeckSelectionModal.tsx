import { listDecks } from "../services/deckService";
import DeckCard from "./DeckCard";
import styles from "./DeckSelectionModal.module.scss";

interface DeckSelectionModalProps {
  faction: string;
  onSelectDeck: (deckId: string) => void;
  onClose: () => void;
}

export default function DeckSelectionModal({
  faction,
  onSelectDeck,
  onClose,
}: DeckSelectionModalProps) {
  const allDecks = listDecks();
  const factionDecks = allDecks.filter(
    (d) => d.faction.toLowerCase() === faction.toLowerCase()
  );

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <button
            className={styles.closeButton}
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
          <h2 className={styles.heading}>
            Select {faction.toUpperCase()} Deck
          </h2>
          <div className={styles.deckList}>
            {factionDecks.length === 0 ? (
              <div className={styles.noDeckMessage}>
                No decks of this faction found
              </div>
            ) : (
              factionDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  showActions={false}
                  onClick={() => onSelectDeck(deck.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
