import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import astraliaLogo from "./assets/logo_astralia_chronicles.png";
import styles from "./App.module.scss";
import { gameConnection } from "./services/gameConnection";

function App() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("astralia.playerName");
      if (saved) setName(saved);
    } catch {}

    const offError = gameConnection.onError((error) => {
      setJoinError(error);
    });

    return () => {
      offError();
    };
  }, []);

  function ensureConnection() {
    gameConnection.connect();
  }

  function hostGame() {
    ensureConnection();
    const chosen = name || "Host";
    try {
      localStorage.setItem("astralia.role", "host");
      localStorage.removeItem("astralia.joinCode");
      sessionStorage.setItem("astralia.hostEmitted", "true");
    } catch {}
    const off = gameConnection.runWhenConnected(() => {
      gameConnection.host(chosen);
    });
    navigate("/lobby");
    void off;
  }

  async function joinGameWithCode() {
    if (!joinCode.trim()) {
      setJoinError("Please enter a join code");
      return;
    }

    const chosen = name || "Guest";
    try {
      localStorage.setItem("astralia.role", "guest");
      localStorage.setItem("astralia.joinCode", joinCode.trim());
    } catch {}

    // Look up the code to find the host's server
    const serverUrl = await gameConnection.lookupCode(joinCode.trim());
    if (!serverUrl) {
      setJoinError("Invalid join code. Could not find hosted lobby.");
      return;
    }

    // Connect to the host's server
    ensureConnection();
    gameConnection.connect(joinCode.trim(), serverUrl);

    let cleanup: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const off = gameConnection.runWhenConnected(() => {
      gameConnection.join(chosen, joinCode.trim());

      // Wait up to 3 seconds for successful join confirmation
      timeoutId = setTimeout(() => {
        if (cleanup) cleanup();
        // If we're still in the modal after 3 seconds, the join failed
        setJoinError("Join request timed out. Please try again.");
      }, 3000);
    });

    cleanup = gameConnection.onState((state) => {
      // Check if we're the guest in the lobby
      if (
        state.guest?.name === chosen &&
        state.guest?.socketId === gameConnection.getSocketId()
      ) {
        if (timeoutId) clearTimeout(timeoutId);
        cleanup?.();
        off();
        navigate("/lobby");
        setShowJoinModal(false);
      }
    });
  }

  function openJoinModal() {
    setJoinCode("");
    setJoinError(null);
    setShowJoinModal(true);
  }

  return (
    <div className={styles.pageRoot}>
      <a href="https://www.astraliachronicles.com/" target="_blank">
        <img src={astraliaLogo} className={styles.logo} alt="Astralia logo" />
      </a>
      <div className={styles.menuLayout}>
        <input
          placeholder="your name"
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setName(v);
            try {
              localStorage.setItem("astralia.playerName", v);
            } catch {}
          }}
          className={styles.nameInput}
        />
        <button className={styles.playButton} onClick={openJoinModal}>
          join game
        </button>
        <button className={styles.playButton} onClick={hostGame}>
          host game
        </button>
        <button
          className={styles.decksButton}
          onClick={() => navigate("/my-decks")}
        >
          my decks
        </button>
        <button
          onClick={() =>
            window.open("https://www.astraliachronicles.com/cards", "_blank")
          }
        >
          cards
        </button>
        <button
          onClick={() =>
            window.open(
              "https://drive.google.com/file/d/1m4AbGJR_e4ywfj-e-fKoaJ01asj_D9Cp/view",
              "_blank"
            )
          }
        >
          rules
        </button>
      </div>

      {showJoinModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowJoinModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Join Game</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <p>Enter the join code from the host:</p>
              {joinError && (
                <div
                  style={{
                    background: "rgba(255, 100, 100, 0.2)",
                    border: "1px solid rgba(255, 100, 100, 0.5)",
                    color: "#ff6464",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    marginBottom: "1rem",
                  }}
                >
                  {joinError}
                </div>
              )}
              <input
                type="text"
                placeholder="Enter join code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className={styles.codeInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") joinGameWithCode();
                }}
              />
              <button className={styles.playButton} onClick={joinGameWithCode}>
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
