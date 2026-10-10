import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConsoleProvider } from "./app/ConsoleProvider";
import { App } from "./app/App";
import "./styles/index.css";
import { assertExactCatalogCount } from "./games/gameCatalog";

assertExactCatalogCount();

const root = document.getElementById("root");
if (!root) {
  throw new Error("MAXIM RETRO boot failure: #root missing.");
}

createRoot(root).render(
  <StrictMode>
    <ConsoleProvider>
      <App />
    </ConsoleProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js");
  });
}
