import { useEffect, useState } from "react";
import DeckCard from "../components/DeckCard.tsx";
import type { Deck } from "../types/Deck";
import {
  listDecks,
  deleteDeck,
  exportDeck,
  importDeck,
  createDeck,
} from "../services/deckService";
import DeckCreationModal from "../components/DeckCreationModal";
import ModalDialog from "../components/ModalDialog";
import styles from "./MyDecksPage.module.scss";
import modalStyles from "../components/ModalDialog.module.scss";
import { Link } from "react-router-dom";

export default function MyDecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const refresh = () => setDecks(listDecks());

  useEffect(() => {
    refresh();
  }, []);

  const handleShare = async (deck: Deck) => {
    const code = exportDeck(deck);
    setShareCode(code);
    setShareTitle(deck.name || "Untitled Deck");
    setShowShare(true);
  };

  const [showShare, setShowShare] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );

  const processImport = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setImportError("Please paste a deck code.");
      return;
    }
    try {
      const imported = importDeck(trimmed);
      const saved = createDeck(imported);
      setDecks([saved, ...decks]);
      setShowImport(false);
      setImportCode("");
      setImportError(null);
    } catch (e) {
      setImportError("Invalid or unsupported deck code");
    }
  };

  return (
    <div className={styles.pageRoot}>
      <div className={styles.pageHeader}>
        <Link to="/" className={styles.homeButton} aria-label="Home">
          <svg
            className={styles.homeIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.homeLabel}>Home</span>
        </Link>
        <h1>My Decks</h1>
      </div>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}
      >
        <button
          className={styles.importButton}
          onClick={() => setShowImport(true)}
        >
          Import Deck
        </button>
      </div>
      <div className={styles.deckSlots}>
        {decks.map((d) => (
          <DeckCard
            key={d.id}
            deck={d}
            onEdit={(deck) => setEditingDeck(deck)}
            onDelete={(deck) => {
              if (confirm("Delete deck?")) {
                deleteDeck(deck.id);
                refresh();
              }
            }}
            onShare={handleShare}
          />
        ))}
        <DeckCard isAddButton onAddSaved={() => refresh()} />
      </div>

      {editingDeck && (
        <DeckCreationModal
          initialDeck={editingDeck.id === "temp" ? undefined : editingDeck}
          onClose={() => setEditingDeck(null)}
          onSaved={() => {
            setEditingDeck(null);
            refresh();
          }}
        />
      )}

      {showShare && (
        <ModalDialog
          title={`Share: ${shareTitle}`}
          ariaId="shareTitle"
          onClose={() => setShowShare(false)}
          secondary={{ label: "Close", onClick: () => setShowShare(false) }}
          primary={{
            label: "Copy",
            onClick: async () => {
              try {
                await navigator.clipboard.writeText(shareCode);
                setCopyStatus("copied");
                setTimeout(() => setCopyStatus("idle"), 1500);
              } catch {
                setCopyStatus("failed");
                setTimeout(() => setCopyStatus("idle"), 2000);
              }
            },
          }}
        >
          <textarea
            className={modalStyles.codeInput}
            rows={3}
            readOnly
            value={shareCode}
          />
          <div style={{ marginTop: 8 }}>
            {copyStatus === "copied" && (
              <div style={{ color: "#9ee6b4", fontWeight: 700 }}>Copied!</div>
            )}
            {copyStatus === "failed" && (
              <div style={{ color: "#ffb4b4", fontWeight: 700 }}>
                Copy failed — use keyboard to copy.
              </div>
            )}
          </div>
        </ModalDialog>
      )}

      {showImport && (
        <ModalDialog
          title="Import Deck"
          ariaId="importTitle"
          onClose={() => {
            setShowImport(false);
            setImportError(null);
          }}
          secondary={{
            label: "Cancel",
            onClick: () => {
              setShowImport(false);
              setImportError(null);
            },
          }}
          primary={{
            label: "Import",
            onClick: () => processImport(importCode),
          }}
        >
          <textarea
            className={modalStyles.codeInput}
            rows={3}
            placeholder="Paste code..."
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
          />
          {importError && (
            <div className={modalStyles.errorText}>{importError}</div>
          )}
        </ModalDialog>
      )}
    </div>
  );
}
