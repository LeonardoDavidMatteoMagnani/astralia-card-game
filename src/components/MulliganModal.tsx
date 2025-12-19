import { useState } from "react";
import styles from "./MulliganModal.module.scss";
import CardDisplay from "./CardDisplay";
import type { Card } from "../types/Card";

interface MulliganModalProps {
  hand: Card[];
  onConfirm: (cardsToMulligan: Card[]) => void;
}

export default function MulliganModal({ hand, onConfirm }: MulliganModalProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const handleCardClick = (card: Card) => {
    if (selectedCards.includes(card)) {
      // Remove from mulligan
      setSelectedCards(selectedCards.filter((c) => c !== card));
    } else {
      // Add to mulligan
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedCards);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Mulligan Phase</h2>
        <p className={styles.subtitle}>Select cards to put on bottom of deck</p>

        <div className={styles.handArea}>
          <h3>Your Hand</h3>
          <div className={styles.cardGrid}>
            {hand.map((card, idx) => (
              <div
                key={idx}
                className={`${styles.cardWrapper} ${
                  selectedCards.includes(card) ? styles.selected : ""
                }`}
                onClick={() => handleCardClick(card)}
              >
                <CardDisplay card={card} size={120} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.mulliganArea}>
          <h3>Cards to Mulligan ({selectedCards.length})</h3>
          <div className={styles.cardGrid}>
            {selectedCards.map((card, idx) => (
              <div key={idx} className={styles.cardWrapper}>
                <CardDisplay card={card} size={100} />
              </div>
            ))}
          </div>
        </div>

        <button className={styles.confirmButton} onClick={handleConfirm}>
          Confirm Mulligan
        </button>
      </div>
    </div>
  );
}
