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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("astralia.playerName");
      if (saved) setName(saved);
    } catch {}
  }, []);

  function ensureConnection() {
    gameConnection.connect();
  }

  function hostGame() {
    ensureConnection();
    const chosen = name || "Host";
    try {
      localStorage.setItem("astralia.role", "host");
    } catch {}
    const off = gameConnection.runWhenConnected(() => {
      gameConnection.host(chosen);
    });
    navigate("/lobby");
    void off;
  }

  function joinGameWithCode() {
    if (!joinCode.trim()) {
      alert("Please enter a join code");
      return;
    }
    ensureConnection();
    const chosen = name || "Guest";
    try {
      localStorage.setItem("astralia.role", "guest");
      localStorage.setItem("astralia.joinCode", joinCode.trim());
    } catch {}
    const off = gameConnection.runWhenConnected(() => {
      gameConnection.join(chosen, joinCode.trim());
    });
    navigate("/lobby");
    setShowJoinModal(false);
    void off;
  }

  function openJoinModal() {
    setJoinCode("");
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
