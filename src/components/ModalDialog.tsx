import React from "react";
import styles from "./ModalDialog.module.scss";

type Action = { label: string; onClick: () => void };

interface ModalDialogProps {
  title?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  primary?: Action;
  secondary?: Action;
  ariaId?: string;
}

export default function ModalDialog({
  title,
  children,
  onClose,
  primary,
  secondary,
  ariaId,
}: ModalDialogProps) {
  const overlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={overlayClick}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaId}
      >
        {title && (
          <h3 id={ariaId} className={styles.dialogTitle}>
            {title}
          </h3>
        )}

        <div className={styles.dialogBody}>{children}</div>

        <div className={styles.dialogActions}>
          {secondary && (
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={secondary.onClick}
            >
              {secondary.label}
            </button>
          )}
          {primary && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={primary.onClick}
            >
              {primary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
