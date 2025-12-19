import React, { useEffect, useState } from "react";
import type { Card } from "../types/Card.ts";
import { getCardImagePath } from "../services/cardImageService";
import { getCardFaces } from "../services/cardDataService";
import N_BackImg from "../assets/N_Back.png";
import EX_BackImg from "../assets/EX_Back.png";
import styles from "./CardDisplay.module.scss";

interface CardDisplayProps {
  card: Card;
  onClick?: (card: Card) => void;
  enableFlip?: boolean;
  size?: number;
  startFlipped?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  onClick,
  enableFlip = true,
  size = 160,
  startFlipped = false,
}) => {
  const [currentFace, setCurrentFace] = useState<Card>(card);
  const [backFace, setBackFace] = useState<Card | null>(null);
  const [hasRealBackFace, setHasRealBackFace] = useState(false);

  useEffect(() => {
    setCurrentFace(card);
    setBackFace(null);
    setHasRealBackFace(false);
    (async () => {
      const { back } = await getCardFaces(card.id);
      if (back) {
        setBackFace(back);
        setHasRealBackFace(true);
        if (startFlipped) {
          setCurrentFace(back);
        }
      } else {
        // Create a default back card based on card type
        const isEXCard = card.id?.toLowerCase().endsWith("ex");
        const defaultBackPath = isEXCard ? EX_BackImg : N_BackImg;
        const defaultBack: Card = {
          ...card,
          id: `${card.id}-back`,
          face: 2,
        };
        // Store the imagePath in a way we can access it
        (defaultBack as any).imagePath = defaultBackPath;
        setBackFace(defaultBack);
        setHasRealBackFace(false);
        if (startFlipped) {
          setCurrentFace(defaultBack);
        }
      }
    })();
  }, [card, startFlipped]);

  const handleFlip = () => {
    if (backFace) {
      setCurrentFace((prev) => (prev.face === 1 ? backFace : card));
    }
  };

  const handleClick = () => {
    if (onClick) onClick(currentFace);
  };

  return (
    <div className={styles.cardDisplay} onClick={handleClick}>
      <img
        src={(currentFace as any).imagePath || getCardImagePath(currentFace)}
        alt={currentFace.name}
        className={styles.cardImage}
        style={{ width: `${size}px` }}
      />
      {hasRealBackFace && enableFlip && (
        <button
          className={styles.flipButton}
          onClick={(e) => {
            e.stopPropagation();
            handleFlip();
          }}
        >
          Flip
        </button>
      )}
    </div>
  );
};

export default CardDisplay;
