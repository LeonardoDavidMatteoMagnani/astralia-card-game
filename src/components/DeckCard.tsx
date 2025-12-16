import type { Deck } from "../types/Deck";
import styles from "./DeckCard.module.scss";

interface DeckCardProps {
  deck?: Deck;
  isAddButton?: boolean;
  onAdd?: () => void;
  onClick?: (deck: Deck) => void;
  onDelete?: (deck: Deck) => void;
  onShare?: (deck: Deck) => void;
  showActions?: boolean;
}

export default function DeckCard({
  deck,
  isAddButton,
  onAdd,
  onClick,
  onDelete,
  onShare,
  showActions = true,
}: DeckCardProps) {
  const factionMap: Record<string, string> = {
    red: styles.factionRed,
    blue: styles.factionBlue,
    green: styles.factionGreen,
    purple: styles.factionPurple,
    pink: styles.factionPink,
  };

  const factionClass = deck?.faction
    ? factionMap[deck.faction.toLowerCase()] ?? ""
    : "";

  const handleClick = () => {
    if (isAddButton) {
      onAdd?.();
    } else if (deck) {
      onClick?.(deck);
    }
  };

  return (
    <>
      <div
        className={`${styles.card} ${isAddButton ? styles.addCard : ""} ${
          !isAddButton && factionClass ? factionClass : ""
        }`}
        onClick={handleClick}
      >
        {isAddButton ? (
          "+"
        ) : (
          <div
            className={styles.cardInner}
            style={
              deck?.backgroundImage
                ? {
                    backgroundImage: `url(${deck.backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <div className={styles.cardTitle}>
              {deck?.name || "Unnamed Deck"}
            </div>
            {showActions && (
              <div className={styles.actions}>
                <button
                  className={`${styles.action} ${styles.primary}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deck && onShare?.(deck);
                  }}
                >
                  Share
                </button>
                <button
                  className={`${styles.action} ${styles.danger}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deck && onDelete?.(deck);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
