import { useState, useEffect } from "react";
import styles from "./LobbyPage.module.scss";
import { gameConnection } from "../services/gameConnection";
import { useNavigate } from "react-router-dom";
import PlayerPanel from "../components/PlayerPanel";
import { useLobbyConnection } from "../hooks/useLobbyConnection";
import { usePlayerRole } from "../hooks/usePlayerRole";
import { useSyncPlayerName } from "../hooks/useSyncPlayerName";
import FactionSelectionModal from "../components/FactionSelectionModal";
import DeckSelectionModal from "../components/DeckSelectionModal";
import { getDeck } from "../services/deckService";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [selectingFor, setSelectingFor] = useState<"host" | "guest" | null>(
    null
  );
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [showFactionSelection, setShowFactionSelection] = useState(false);

  // Connection and state management
  const { state, myId } = useLobbyConnection();
  const meRole = usePlayerRole(state, myId);
  useSyncPlayerName(meRole, state);

  // Navigate to game when started
  useEffect(() => {
    console.log("[LobbyPage] state.started changed:", state.started);
    if (state.started) {
      console.log("[LobbyPage] Navigating to /game");
      navigate("/game");
    }
  }, [state.started, navigate]);

  // Handlers
  function leave() {
    try {
      localStorage.removeItem("astralia.role");
    } catch {}
    gameConnection.leave();
    navigate("/");
  }

  function openSelect(role: "host" | "guest") {
    setSelectingFor(role);
    setShowFactionSelection(true);
  }

  function start() {
    gameConnection.startRequest();
  }

  const canStart =
    meRole === "host" &&
    !!state.host?.deckId &&
    !!state.guest?.deckId &&
    !state.started;

  return (
    <div className={styles.lobbyRoot}>
      <div className={styles.topBar}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontWeight: 700 }}>Lobby</span>
          {state.started && (
            <span style={{ color: "lime", fontSize: "0.8rem" }}>Started</span>
          )}
        </div>
        <div className={styles.actions}>
          {meRole === "host" && (
            <button
              className={styles.startButton}
              onClick={start}
              disabled={!canStart}
            >
              Start Match
            </button>
          )}
          <button className={styles.leaveButton} onClick={leave}>
            Leave
          </button>
        </div>
      </div>

      <div className={styles.playerRow}>
        <PlayerPanel
          player={state.host}
          isCurrentPlayer={meRole === "host"}
          onSelectDeck={() => openSelect("host")}
          onNameChange={(name) => {
            if (meRole === "host") gameConnection.setName(name);
          }}
        />

        <div className={styles.centerVs}>VS</div>

        <PlayerPanel
          player={state.guest}
          isCurrentPlayer={meRole === "guest"}
          onSelectDeck={() => openSelect("guest")}
          onNameChange={(name) => {
            if (meRole === "guest") gameConnection.setName(name);
          }}
          showJoinCode={meRole === "host"}
          joinCode={state.code}
        />
      </div>

      {showFactionSelection && (
        <FactionSelectionModal
          onSelect={(faction) => {
            setSelectedFaction(faction);
            setShowFactionSelection(false);
            gameConnection.setFaction(faction);
          }}
          onClose={() => {
            setShowFactionSelection(false);
            setSelectingFor(null);
          }}
        />
      )}

      {selectedFaction && selectingFor && (
        <DeckSelectionModal
          faction={selectedFaction}
          onSelectDeck={(deckId) => {
            const deck = getDeck(deckId);
            if (deck) {
              gameConnection.setDeckWithInfo(
                deckId,
                deck.protagonist ?? null,
                deck.name ?? null,
                deck.persona ?? null,
                deck.deck ?? null
              );
            } else {
              gameConnection.setDeck(deckId);
            }
            setSelectedFaction(null);
            setSelectingFor(null);
          }}
          onClose={() => {
            setSelectedFaction(null);
            setSelectingFor(null);
          }}
        />
      )}
    </div>
  );
}
