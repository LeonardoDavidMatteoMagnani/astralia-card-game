import React, { useState, useEffect } from "react";
import { getCardsByField } from "../services/cardDataService";
import type { Card } from "../types/Card.ts";
import CardDisplay from "./CardDisplay";
import styles from "./DeckCreationModal.module.scss";

interface DeckCreationModalProps {
  onClose: () => void;
}

const factions = ["red", "blue", "green", "purple", "pink"];

export default function DeckCreationModal({ onClose }: DeckCreationModalProps) {
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [protagonists, setProtagonists] = useState<Card[]>([]);

  useEffect(() => {
    if (!selectedFaction) return;

    (async () => {
      const allProtagonists = await getCardsByField("mainDeck", "Protagonist");
      const factionProtagonists = allProtagonists.filter(
        (c) => c.faction.toLowerCase() === selectedFaction.toLowerCase()
      );
      setProtagonists(factionProtagonists);
    })();
  }, [selectedFaction]);

  const handleProtagonistSelect = (card: Card) => {
    console.log("Selected protagonist:", card);
    //onClose();
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
            <h2>Select {selectedFaction.toUpperCase()} Protagonist</h2>
            <div className={styles.cardList}>
              {protagonists.map((card) => (
                <CardDisplay
                  key={card.id}
                  card={card}
                  onClick={handleProtagonistSelect}
                  isSelectable
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
