import { useState } from "react";
import styles from "./DeckActionModal.module.scss";
import type { Card } from "../types/Card";
import CardDisplay from "./CardDisplay";
import GameActionModal from "./GameActionModal";

interface DeckActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckCards: Card[];
  onDraw: (count: number) => void;
  onPeep: (
    cards: Card[],
    decisions: Map<Card, "draw" | "discard" | "top" | "bottom">
  ) => void;
  onFind: (card: Card) => void;
}

type ActionMode = "menu" | "peep" | "find";

export default function DeckActionModal({
  isOpen,
  onClose,
  deckCards,
  onDraw,
  onPeep,
  onFind,
}: DeckActionModalProps) {
  const [mode, setMode] = useState<ActionMode>("menu");
  const [drawCount, setDrawCount] = useState(1);
  const [peepCount, setPeepCount] = useState(1);
  const [peepDecisions, setPeepDecisions] = useState<
    Map<Card, "draw" | "discard" | "top" | "bottom">
  >(new Map());
  const [processedCards, setProcessedCards] = useState<Set<Card>>(new Set());

  if (!isOpen) return null;

  const handleClose = () => {
    setMode("menu");
    setDrawCount(1);
    setPeepCount(1);
    setPeepDecisions(new Map());
    setProcessedCards(new Set());
    onClose();
  };

  const handlePeepDecision = (
    card: Card,
    decision: "draw" | "discard" | "top" | "bottom"
  ) => {
    // Execute the action immediately
    const decisionMap = new Map([[card, decision]]);
    onPeep([card], decisionMap);

    // Mark card as processed so it disappears from view
    const newProcessedCards = new Set(processedCards);
    newProcessedCards.add(card);
    setProcessedCards(newProcessedCards);

    // If all cards have been processed, go back to menu
    if (newProcessedCards.size >= peepCount) {
      handleClose();
    }
  };

  return (
    <GameActionModal
      isOpen={isOpen}
      onClose={handleClose}
      minWidth={mode === "find" ? "70vw" : mode === "peep" ? "50vw" : "30vw"}
    >
      {mode === "menu" && (
        <div className={styles.menu}>
          <h2>Deck Actions</h2>
          <div className={styles.actions}>
            <div className={styles.counterAction}>
              <button
                className={styles.actionButton}
                onClick={() => {
                  onDraw(drawCount);
                  handleClose();
                }}
              >
                Draw {drawCount}
              </button>
              <div className={styles.counterGroup}>
                <button
                  className={styles.counterButton}
                  onClick={() => setDrawCount(Math.max(1, drawCount - 1))}
                >
                  &lt;
                </button>
                <span className={styles.counterValue}>{drawCount}</span>
                <button
                  className={styles.counterButton}
                  onClick={() =>
                    setDrawCount(Math.min(deckCards.length, drawCount + 1))
                  }
                >
                  &gt;
                </button>
              </div>
            </div>
            <div className={styles.counterAction}>
              <button
                className={styles.actionButton}
                onClick={() => {
                  setPeepDecisions(
                    new Map(
                      deckCards.slice(0, peepCount).map((c) => [c, "top"])
                    )
                  );
                  setMode("peep");
                }}
              >
                Peep {peepCount}
              </button>
              <div className={styles.counterGroup}>
                <button
                  className={styles.counterButton}
                  onClick={() => setPeepCount(Math.max(1, peepCount - 1))}
                >
                  &lt;
                </button>
                <span className={styles.counterValue}>{peepCount}</span>
                <button
                  className={styles.counterButton}
                  onClick={() =>
                    setPeepCount(Math.min(deckCards.length, peepCount + 1))
                  }
                >
                  &gt;
                </button>
              </div>
            </div>
            <button onClick={() => setMode("find")}>Find a Card</button>
          </div>
        </div>
      )}

      {mode === "peep" && (
        <div className={styles.peepMode}>
          <h2>Peep Cards</h2>
          <div className={styles.cardGrid}>
            {deckCards
              .slice(0, peepCount)
              .filter((card) => !processedCards.has(card))
              .map((card) => (
                <div
                  key={(card as any)._instanceId || card.id}
                  className={styles.peepCard}
                >
                  <CardDisplay card={card} size={120} enableFlip={false} />
                  <div className={styles.peepActions}>
                    <button onClick={() => handlePeepDecision(card, "draw")}>
                      Draw
                    </button>
                    <button onClick={() => handlePeepDecision(card, "discard")}>
                      Discard
                    </button>
                    <button onClick={() => handlePeepDecision(card, "top")}>
                      Top
                    </button>
                    <button onClick={() => handlePeepDecision(card, "bottom")}>
                      Bottom
                    </button>
                  </div>
                </div>
              ))}
          </div>
          <div className={styles.actions}>
            <button
              onClick={() => {
                setPeepDecisions(new Map());
                setProcessedCards(new Set());
                setMode("menu");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "find" && (
        <div className={styles.findMode}>
          <h2>Find a Card</h2>
          <div className={styles.cardGrid}>
            {[...deckCards]
              .sort((a, b) => {
                const costA = parseInt(a.cost || "0");
                const costB = parseInt(b.cost || "0");
                if (costA !== costB) return costA - costB;
                return (a.name || "").localeCompare(b.name || "");
              })
              .map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className={styles.findCard}
                  onClick={() => {
                    onFind(card);
                    handleClose();
                  }}
                >
                  <CardDisplay card={card} size={120} enableFlip={false} />
                </div>
              ))}
          </div>
          <div className={styles.actions}>
            <button onClick={() => setMode("menu")}>Back</button>
          </div>
        </div>
      )}
    </GameActionModal>
  );
}
