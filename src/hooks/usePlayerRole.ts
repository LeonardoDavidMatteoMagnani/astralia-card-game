import { useMemo } from "react";
import type { LobbyState } from "../services/gameConnection";

/**
 * Determines the current player's role (host, guest, or none)
 */
export function usePlayerRole(state: LobbyState, myId: string | null) {
  return useMemo<"host" | "guest" | null>(() => {
    if (state.host && state.host.socketId === myId) return "host";
    if (state.guest && state.guest.socketId === myId) return "guest";
    return null;
  }, [state, myId]);
}
