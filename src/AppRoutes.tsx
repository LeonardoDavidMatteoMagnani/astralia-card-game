import { Routes, Route } from "react-router-dom";
import App from "./App";
import MyDecksPage from "./pages/MyDecksPage.tsx";
import LobbyPage from "./pages/LobbyPage.tsx";
import GamePage from "./pages/GamePage.tsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/my-decks" element={<MyDecksPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/game" element={<GamePage />} />
    </Routes>
  );
}
