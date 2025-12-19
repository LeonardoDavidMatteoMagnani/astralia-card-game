import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLobbyConnection } from "../hooks/useLobbyConnection";
import { usePlayerRole } from "../hooks/usePlayerRole";
import Playmat from "../components/Playmat";
import styles from "./GamePage.module.scss";

export default function GamePage() {
  const navigate = useNavigate();
  const { state, myId } = useLobbyConnection();
  const meRole = usePlayerRole(state, myId);

  useEffect(() => {
    console.log("[GamePage] State:", JSON.stringify(state, null, 2));
    console.log("[GamePage] meRole:", meRole);
    console.log("[GamePage] state.host:", state.host);
    console.log("[GamePage] state.guest:", state.guest);
  }, [state, meRole]);

  return (
    <div className={styles.gameRoot}>
      <Playmat
        playerName={meRole === "host" ? state.host?.name : state.guest?.name}
        opponentName={meRole === "host" ? state.guest?.name : state.host?.name}
        playerState={meRole === "host" ? state.host : state.guest}
        opponentState={meRole === "host" ? state.guest : state.host}
      />
    </div>
  );
}
