import { Routes, Route } from "react-router-dom";
import App from "./App";
import MyDecksPage from "./pages/MyDecksPage.tsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/my-decks" element={<MyDecksPage />} />
    </Routes>
  );
}
