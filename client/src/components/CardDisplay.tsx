import React, { useEffect, useState } from "react";
import type { Card } from "../types/Card.ts";
import { getCardImagePath } from "../services/cardImageService";
import { getCardFaces } from "../services/cardDataService";
import styles from "./CardDisplay.module.scss";

interface CardDisplayProps {
  card: Card;
  onClick?: (card: Card) => void;
  isSelectable?: boolean;
  enableFlip?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  onClick,
  isSelectable,
  enableFlip = true,
}) => {
  const [currentFace, setCurrentFace] = useState<Card>(card);
  const [backFace, setBackFace] = useState<Card | null>(null);

  useEffect(() => {
    (async () => {
      if (!enableFlip) return;

      const { back } = await getCardFaces(card.id);
      if (back) setBackFace(back);
    })();
  }, [card, enableFlip]);

  const handleFlip = () => {
    if (backFace) {
      setCurrentFace((prev) => (prev.face === 1 ? backFace : card));
    }
  };

  const handleClick = () => {
    if (onClick) onClick(currentFace);
  };

  return (
    <div
      className={`${styles.cardDisplay} ${
        isSelectable ? styles.selectable : ""
      }`}
      onClick={handleClick}
    >
      <img
        src={getCardImagePath(currentFace)}
        alt={currentFace.name}
        className={styles.cardImage}
      />

      {backFace && enableFlip && (
        <button className={styles.flipButton} onClick={handleFlip}>
          Flip
        </button>
      )}
    </div>
  );
};

export default CardDisplay;
