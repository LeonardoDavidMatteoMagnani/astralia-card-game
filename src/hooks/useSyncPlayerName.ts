import { useEffect } from "react";
import { gameConnection, type LobbyState } from "../services/gameConnection";

/**
 * Syncs player name with server when role changes
 */
export function useSyncPlayerName(meRole: "host" | "guest" | null, state: LobbyState) {
  useEffect(() => {
    if (!meRole) return;
    try {
      const saved = localStorage.getItem("astralia.playerName");
      if (!saved) return;
      if (meRole === "host" && state.host && state.host.name !== saved) {
        gameConnection.setName(saved);
      }
      if (meRole === "guest" && state.guest && state.guest.name !== saved) {
        gameConnection.setName(saved);
      }
    } catch {}
  }, [meRole, state.host?.name, state.guest?.name]);
}
