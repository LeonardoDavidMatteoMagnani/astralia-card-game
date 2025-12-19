import { useEffect, useState } from "react";
import { gameConnection, type LobbyState } from "../services/gameConnection";

/**
 * Manages connection to the lobby server and lobby state
 */
export function useLobbyConnection() {
  const [state, setState] = useState<LobbyState>(() => gameConnection.getCurrentState());
  const [myId, setMyId] = useState<string | null>(gameConnection.getSocketId());

  useEffect(() => {
    gameConnection.connect();
    setMyId(gameConnection.getSocketId());
    setState(gameConnection.getCurrentState()); // Get current state immediately

    const off = gameConnection.onState((s) => {
      console.log('[useLobbyConnection] Received state update:', JSON.stringify(s, null, 2));
      setState(s);
      const sid = gameConnection.getSocketId();
      if (sid) setMyId((prev) => prev ?? sid);
    });

    const offConn = gameConnection.onConnect(() =>
      setMyId(gameConnection.getSocketId())
    );

    const offDisc = gameConnection.onDisconnect(() => {
      setMyId(null);
    });

    return () => {
      off();
      offConn();
      offDisc();
    };
  }, []);

  return { state, myId };
}
