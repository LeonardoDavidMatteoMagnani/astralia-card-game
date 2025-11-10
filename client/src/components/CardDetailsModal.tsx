import type { Card } from "../types/Card";
import { getCardImagePath } from "../services/cardImageService";
import styles from "./CardDetailsModal.module.scss";

interface Props {
  card: Card;
  onClose: () => void;
}

export default function CardDetailsModal({ card, onClose }: Props) {
  if (!card) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.content}>
          <img
            src={getCardImagePath(card)}
            alt={card.name}
            className={styles.image}
          />

          <div className={styles.info}>
            <h2 className={styles.name}>{card.name}</h2>
            <div className={styles.meta}>
              <span>#{card.id}</span>
              {card.cost !== undefined && <span>Cost: {card.cost}</span>}
              {card.type && <span>Type: {card.type}</span>}
              {card.subtype && <span>Subtype: {card.subtype}</span>}
            </div>

            {card.keywords && (
              <div className={styles.keywords}>
                <strong>Keywords:</strong> {card.keywords}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
