import { useState, useEffect } from "react";
import { getDeck } from "../services/deckService";
import { getCardFaces } from "../services/cardDataService";
import { getCardImagePath } from "../services/cardImageService";
import type { Card } from "../types/Card";
import type { LobbyPlayerState } from "../services/gameConnection";
import styles from "./PlayerPanel.module.scss";

interface PlayerPanelProps {
  player: LobbyPlayerState | null;
  isCurrentPlayer: boolean;
  onSelectDeck: () => void;
  onNameChange: (name: string) => void;
  showJoinCode?: boolean;
  joinCode?: string;
}

function makePlaceholder(id: string, faction: string): Card {
  return {
    id,
    setId: "",
    name: "Protagonist",
    faction,
    mainDeck: "Protagonist",
    cost: "0",
    type: "Protagonist",
    subtype: "",
    sets: "",
    atk: "",
    hp: "",
    keywords: "",
    flip: false,
    face: 0,
    singularity: false,
    imageId: id,
  };
}

export default function PlayerPanel({
  player,
  isCurrentPlayer,
  onSelectDeck,
  onNameChange,
  showJoinCode = false,
  joinCode = "",
}: PlayerPanelProps) {
  const [proCard, setProCard] = useState<Card | null>(null);

  // For current player, load from localStorage; for opponent, use data from server
  const deck =
    isCurrentPlayer && player?.deckId ? getDeck(player.deckId) : null;
  const proCardId = player?.protagonistId || deck?.protagonist || null;
  const deckName = player?.deckName || deck?.name || null;

  useEffect(() => {
    if (proCardId && player?.faction) {
      getCardFaces(proCardId)
        .then((faces) => {
          setProCard(
            faces.front ||
              faces.back ||
              makePlaceholder(proCardId, player.faction!)
          );
        })
        .catch(() => setProCard(makePlaceholder(proCardId, player.faction!)));
    } else {
      setProCard(null);
    }
  }, [proCardId, player?.faction]);

  if (!player) {
    return (
      <div className={styles.emptyPanel}>
        <div className={styles.waitingText}>Waiting for opponent to join…</div>
        {showJoinCode && joinCode && (
          <div className={styles.joinCodeSection}>
            <div className={styles.joinCodeLabel}>Join code:</div>
            <div className={styles.joinCode}>{joinCode}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <input
          className={styles.nameInput}
          value={player.name || ""}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Player name"
          disabled={!isCurrentPlayer}
        />
        {isCurrentPlayer && (
          <button className={styles.selectDeckButton} onClick={onSelectDeck}>
            Select Deck
          </button>
        )}
      </div>

      <div className={styles.cardWrapper}>
        {proCard ? (
          <img
            src={getCardImagePath(proCard)}
            alt={proCard.name}
            className={styles.protagonistImage}
          />
        ) : (
          <div className={styles.noCard}>No protagonist</div>
        )}
      </div>

      <div className={styles.deckInfo}>
        {deckName || (deck ? deck.name : "No deck selected")}
      </div>
    </div>
  );
}
