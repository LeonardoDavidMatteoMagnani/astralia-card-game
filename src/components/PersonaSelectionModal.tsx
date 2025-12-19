import styles from "./PersonaSelectionModal.module.scss";
import type { Card } from "../types/Card";
import CardDisplay from "./CardDisplay";
import GameActionModal from "./GameActionModal";

interface PersonaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaCards: Card[];
  onSelectPersona?: (card: Card) => void;
  viewOnly?: boolean;
}

export default function PersonaSelectionModal({
  isOpen,
  onClose,
  personaCards,
  onSelectPersona,
  viewOnly = false,
}: PersonaSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <GameActionModal isOpen={isOpen} onClose={onClose} minWidth="400px">
      <div className={styles.content}>
        <h2>{viewOnly ? "Opponent's Personas" : "Choose a Persona"}</h2>
        <div className={styles.cardGrid}>
          {personaCards.map((card, i) => (
            <div
              key={i}
              className={`${styles.personaCard} ${
                viewOnly ? styles.viewOnly : ""
              }`}
              onClick={() => !viewOnly && onSelectPersona?.(card)}
            >
              <CardDisplay card={card} size={140} enableFlip={true} />
            </div>
          ))}
        </div>
      </div>
    </GameActionModal>
  );
}
