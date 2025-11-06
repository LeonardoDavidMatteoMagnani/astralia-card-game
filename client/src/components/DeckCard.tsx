// src/components/DeckCard.tsx
import styles from "./DeckCard.module.scss";

interface DeckCardProps {
  title?: string; // optional, if we want to show deck name
  isAddButton?: boolean; // true for the "+" slot
  onClick?: () => void;
}

export default function DeckCard({
  title,
  isAddButton,
  onClick,
}: DeckCardProps) {
  return (
    <div
      className={`${styles.card} ${isAddButton ? styles.addCard : ""}`}
      onClick={onClick}
    >
      {isAddButton ? "+" : title || "Empty Deck"}
    </div>
  );
}
