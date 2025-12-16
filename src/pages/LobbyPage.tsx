import { useEffect, useState, useMemo } from "react";
import styles from "./LobbyPage.module.scss";
import { gameConnection, type LobbyState } from "../services/gameConnection";
import { useNavigate } from "react-router-dom";
import { listDecks, getDeck } from "../services/deckService";
import CardDisplay from "../components/CardDisplay";
import FactionSelection from "../components/FactionSelection";
import { getCardFaces } from "../services/cardDataService";
import type { Card } from "../types/Card";

interface SelectModalProps {
  open: boolean;
  onClose: () => void;
  faction: string | null;
  onFactionChange: (f: string) => void;
  onPickDeck: (deckId: string) => void;
}

function FactionDeckSelectModal({
  open,
  onClose,
  faction,
  onFactionChange,
  onPickDeck,
}: SelectModalProps) {
  const allDecks = listDecks();
  const decks = faction
    ? allDecks.filter((d) => d.faction.toLowerCase() === faction.toLowerCase())
    : [];
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "var(--background-color-secondary)",
          padding: "1rem",
          borderRadius: 10,
          width: "min(640px,90%)",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Select Faction & Deck</h3>
        <div style={{ marginBottom: "0.75rem" }}>
          <FactionSelection
            factions={["red", "blue", "green", "purple", "pink"]}
            onSelect={onFactionChange}
          />
        </div>
        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          }}
        >
          {decks.map((d) => (
            <button
              key={d.id}
              style={{
                background: "var(--background-color-tertiary)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "0.5rem",
                textAlign: "left",
                cursor: "pointer",
              }}
              onClick={() => {
                onPickDeck(d.id);
                onClose();
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                {d.name}
              </div>
              <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>
                {d.faction.toUpperCase()} • {d.deck.length} cards
              </div>
            </button>
          ))}
          {decks.length === 0 && faction && (
            <div style={{ opacity: 0.6, fontSize: "0.8rem" }}>
              No decks for faction {faction.toUpperCase()}
            </div>
          )}
          {!faction && (
            <div style={{ opacity: 0.6, fontSize: "0.8rem" }}>
              Pick a faction first
            </div>
          )}
        </div>
        <div style={{ marginTop: "1rem", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              background: "linear-gradient(180deg,#2a2a2a,#1f1f1f)",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LobbyPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LobbyState>({
    host: null,
    guest: null,
    started: false,
  });
  const [selectingFor, setSelectingFor] = useState<"host" | "guest" | null>(
    null
  );
  const [tempFaction, setTempFaction] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(gameConnection.getSocketId());

  useEffect(() => {
    gameConnection.connect();
    setMyId(gameConnection.getSocketId());
    const off = gameConnection.onState((s) => {
      setState(s);
      const sid = gameConnection.getSocketId();
      if (sid) setMyId((prev) => prev ?? sid);
    });
    const offConn = gameConnection.onConnect(() =>
      setMyId(gameConnection.getSocketId())
    );
    const offDisc = gameConnection.onDisconnect(() => {
      setMyId(null);
      try {
        sessionStorage.removeItem("astralia.hostEmitted");
      } catch {}
    });
    return () => {
      off();
      offConn();
      offDisc();
    };
  }, []);

  const meRole = useMemo<"host" | "guest" | null>(() => {
    if (state.host && state.host.socketId === myId) return "host";
    if (state.guest && state.guest.socketId === myId) return "guest";
    return null;
  }, [state, myId]);

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

  function pickFaction(f: string) {
    setTempFaction(f);
  }

  function confirmDeck(deckId: string) {
    if (!meRole || meRole !== selectingFor) return;
    gameConnection.setFaction(tempFaction);
    gameConnection.setDeck(deckId);
  }

  const hostDeck = state.host?.deckId ? getDeck(state.host.deckId) : null;
  const guestDeck = state.guest?.deckId ? getDeck(state.guest.deckId) : null;

  const hostProCardId = hostDeck?.protagonist || null;
  const guestProCardId = guestDeck?.protagonist || null;

  const [hostProCard, setHostProCard] = useState<Card | null>(null);
  const [guestProCard, setGuestProCard] = useState<Card | null>(null);

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

  useEffect(() => {
    if (hostProCardId && hostDeck) {
      getCardFaces(hostProCardId)
        .then((faces) => {
          setHostProCard(
            faces.front ||
              faces.back ||
              makePlaceholder(hostProCardId, hostDeck.faction)
          );
        })
        .catch(() =>
          setHostProCard(makePlaceholder(hostProCardId, hostDeck.faction))
        );
    } else {
      setHostProCard(null);
    }
  }, [hostProCardId, hostDeck]);

  useEffect(() => {
    if (guestProCardId && guestDeck) {
      getCardFaces(guestProCardId)
        .then((faces) => {
          setGuestProCard(
            faces.front ||
              faces.back ||
              makePlaceholder(guestProCardId, guestDeck.faction)
          );
        })
        .catch(() =>
          setGuestProCard(makePlaceholder(guestProCardId, guestDeck.faction))
        );
    } else {
      setGuestProCard(null);
    }
  }, [guestProCardId, guestDeck]);

  function start() {
    gameConnection.startRequest();
  }

  const canStart =
    meRole === "host" &&
    !!state.host?.deckId &&
    !!state.guest?.deckId &&
    !state.started;

  const [reattempted, setReattempted] = useState(false);
  useEffect(() => {
    if (reattempted) return;
    if (!myId || meRole) return;
    const savedRole = (() => {
      try {
        return localStorage.getItem("astralia.role");
      } catch {
        return null;
      }
    })();
    const savedName = (() => {
      try {
        return localStorage.getItem("astralia.playerName") || "";
      } catch {
        return "";
      }
    })();
    const hostEmitted = (() => {
      try {
        return sessionStorage.getItem("astralia.hostEmitted");
      } catch {
        return null;
      }
    })();

    // Only retry if we have no host (page reload) and we're supposed to be host
    // Don't retry if we already emitted in this session (initial navigation from App.tsx)
    if (savedRole === "host" && !state.host && !hostEmitted) {
      gameConnection.runWhenConnected(() =>
        gameConnection.host(savedName || "Host")
      );
      setReattempted(true);
    } else if (savedRole === "guest" && state.host && !state.guest) {
      gameConnection.runWhenConnected(() =>
        gameConnection.join(savedName || "Guest")
      );
      setReattempted(true);
    } else {
      setReattempted(true);
    }
  }, [myId, meRole, state.host, state.guest, reattempted]);

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
        <div className={styles.playerPanel}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              className={styles.nameInput}
              value={state.host?.name || ""}
              onChange={(e) => {
                if (meRole === "host") gameConnection.setName(e.target.value);
              }}
              placeholder="Host name"
              disabled={meRole !== "host"}
            />
            {meRole === "host" && (
              <button
                className={styles.factionDeckButton}
                onClick={() => openSelect("host")}
              >
                Select Deck
              </button>
            )}
          </div>
          <div className={styles.largeCardWrapper}>
            {hostProCard ? (
              <CardDisplay card={hostProCard} />
            ) : (
              <div style={{ opacity: 0.5 }}>No protagonist</div>
            )}
          </div>
          <div className={styles.deckInfo}>
            {hostDeck ? hostDeck.name : "No deck selected"}
          </div>
        </div>
        <div className={styles.centerVs}>VS</div>
        <div className={styles.playerPanel}>
          {state.guest ? (
            <>
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <input
                  className={styles.nameInput}
                  value={state.guest?.name || ""}
                  onChange={(e) => {
                    if (meRole === "guest")
                      gameConnection.setName(e.target.value);
                  }}
                  placeholder="Guest name"
                  disabled={meRole !== "guest"}
                />
                {meRole === "guest" && (
                  <button
                    className={styles.factionDeckButton}
                    onClick={() => openSelect("guest")}
                  >
                    Select Deck
                  </button>
                )}
              </div>
              <div className={styles.largeCardWrapper}>
                {guestProCard ? (
                  <CardDisplay card={guestProCard} />
                ) : (
                  <div style={{ opacity: 0.5 }}>No protagonist</div>
                )}
              </div>
              <div className={styles.deckInfo}>
                {guestDeck ? guestDeck.name : "No deck selected"}
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <div style={{ opacity: 0.7 }}>Waiting for opponent to join…</div>
              {meRole === "host" && state.code && (
                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                    Join code:
                  </div>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      letterSpacing: "0.2em",
                      fontFamily: "monospace",
                      color: "#e676ad",
                      marginTop: "0.5rem",
                      padding: "1rem",
                      background: "rgba(230, 118, 173, 0.1)",
                      borderRadius: "8px",
                      border: "2px solid rgba(230, 118, 173, 0.3)",
                    }}
                  >
                    {state.code}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <FactionDeckSelectModal
        open={selectingFor !== null}
        onClose={() => {
          setSelectingFor(null);
          setTempFaction(null);
        }}
        faction={tempFaction}
        onFactionChange={pickFaction}
        onPickDeck={confirmDeck}
      />
    </div>
  );
}
