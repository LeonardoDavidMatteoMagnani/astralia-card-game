import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import astraliaLogo from "./assets/logo_astralia_chronicles.png";
import styles from "./App.module.scss";
import { gameConnection } from "./services/gameConnection";

function App() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

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

  function joinGame() {
    ensureConnection();
    const chosen = name || "Guest";
    try {
      localStorage.setItem("astralia.role", "guest");
    } catch {}
    const off = gameConnection.runWhenConnected(() => {
      gameConnection.join(chosen);
    });
    navigate("/lobby");
    void off;
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
        <button className={styles.playButton} onClick={joinGame}>
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
    </div>
  );
}

export default App;
