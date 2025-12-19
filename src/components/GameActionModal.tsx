import type { ReactNode } from "react";
import styles from "./GameActionModal.module.scss";

interface GameActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  minWidth?: string;
}

export default function GameActionModal({
  isOpen,
  onClose,
  children,
  minWidth,
}: GameActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={minWidth ? { minWidth } : undefined}
      >
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
