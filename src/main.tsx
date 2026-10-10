import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConsoleProvider } from "./app/ConsoleProvider";
import { App } from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";
import { assertExactCatalogCount } from "./games/gameCatalog";

assertExactCatalogCount();

const root = document.getElementById("root");
if (!root) {
  throw new Error("MAXIM RETRO boot failure: #root missing.");
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ConsoleProvider>
        <App />
      </ConsoleProvider>
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: "/" });
  });
}
