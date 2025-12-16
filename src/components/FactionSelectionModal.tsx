import styles from "./FactionSelectionModal.module.scss";
import { FACTION_LIST } from "../constants/factions";

interface FactionSelectionProps {
  factions?: string[];
  onSelect: (faction: string) => void;
  onClose: () => void;
  heading?: string;
}

export default function FactionSelection({
  factions = FACTION_LIST,
  onSelect,
  onClose,
  heading = "Select Deck Faction",
}: FactionSelectionProps) {
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <button
            className={styles.closeButton}
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
          <h2 className={styles.heading}>{heading}</h2>
          <div className={styles.factionList}>
            {factions.map((f) => {
              const cap = f.charAt(0).toUpperCase() + f.slice(1);
              const factionClass =
                (styles[`faction${cap}` as keyof typeof styles] as string) ||
                "";
              return (
                <button
                  key={f}
                  onClick={() => onSelect(f)}
                  className={`${styles.factionButton} ${factionClass}`}
                  aria-label={`Select ${f} faction`}
                >
                  <span className={styles.factionLabel}>{f.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
