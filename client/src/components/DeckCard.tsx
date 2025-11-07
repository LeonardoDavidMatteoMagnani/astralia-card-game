import { useState } from "react";
import DeckCreationModal from "./DeckCreationModal.tsx";
import styles from "./DeckCard.module.scss";

interface DeckCardProps {
  title?: string;
  isAddButton?: boolean;
  onClick?: () => void;
}

export default function DeckCard({ title, isAddButton }: DeckCardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (isAddButton) {
      setShowModal(true);
    }
  };

  return (
    <>
      <div
        className={`${styles.card} ${isAddButton ? styles.addCard : ""}`}
        onClick={handleClick}
      >
        {isAddButton ? "+" : title || "Empty Deck"}
      </div>

      {showModal && <DeckCreationModal onClose={() => setShowModal(false)} />}
    </>
  );
}
