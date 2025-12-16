import { useState } from "react";
import styles from "./LobbyPage.module.scss";
import { gameConnection } from "../services/gameConnection";
import { useNavigate } from "react-router-dom";
import FactionDeckSelectModal from "../components/FactionDeckSelectModal";
import PlayerPanel from "../components/PlayerPanel";
import { useLobbyConnection } from "../hooks/useLobbyConnection";
import { usePlayerRole } from "../hooks/usePlayerRole";
import { useSyncPlayerName } from "../hooks/useSyncPlayerName";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [selectingFor, setSelectingFor] = useState<"host" | "guest" | null>(
    null
  );
  const [tempFaction, setTempFaction] = useState<string | null>(null);

  // Connection and state management
  const { state, myId } = useLobbyConnection();
  const meRole = usePlayerRole(state, myId);
  useSyncPlayerName(meRole, state);

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
    setTempFaction(
      role === "host"
        ? state.host?.faction || null
        : state.guest?.faction || null
    );
  }

  function confirmDeck(deckId: string) {
    if (!meRole || meRole !== selectingFor) return;
    gameConnection.setFaction(tempFaction);
    gameConnection.setDeck(deckId);
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
          {canStart && (
            <button className={styles.startButton} onClick={start}>
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

      <FactionDeckSelectModal
        open={selectingFor !== null}
        onClose={() => {
          setSelectingFor(null);
          setTempFaction(null);
        }}
        faction={tempFaction}
        onFactionChange={setTempFaction}
        onPickDeck={confirmDeck}
      />
    </div>
  );
}
