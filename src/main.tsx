import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import "./index.scss";

// Block image dragging and copying site-wide
if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("dragstart", (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target.tagName === "IMG") e.preventDefault();
  });

  document.addEventListener("copy", (e) => {
    const selection = document.getSelection();
    if (selection && selection.rangeCount) {
      const container = selection.getRangeAt(0)
        .commonAncestorContainer as HTMLElement;
      if (container && container.closest && container.closest("img")) {
        e.preventDefault();
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <AppRoutes />
    </Router>
  </StrictMode>
);
