import { useEffect, useState } from "react";
import { useConsole } from "./ConsoleProvider";
import { ArcadeButton, ErrorBanner } from "../components/ui";
import { BootSplash, PowerOffScreen } from "../components/BootSplash";
import { LibraryScreen } from "../pages/LibraryScreen";
import { SettingsScreen, StatsScreen } from "../pages/SettingsScreens";
import { PlayCabinet } from "../play/PlayCabinet";
import type { ConsoleView } from "../games/gameTypes";

const NAV: { view: ConsoleView; label: string }[] = [
  { view: "play", label: "PLAY" },
  { view: "library", label: "LIBRARY" },
  { view: "favourites", label: "FAVS" },
  { view: "stats", label: "STATS" },
  { view: "settings", label: "SET" },
];

export function App() {
  const { ready, error, view, setView, settings, setSettings } = useConsole();
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const wait = window.setTimeout(() => setBooting(false), 1600);
    return () => window.clearTimeout(wait);
  }, [ready, settings.poweredOn]);

  const powerOn = () => {
    setBooting(true);
    setSettings((current) => ({ ...current, poweredOn: true }));
  };

  if (!settings.poweredOn) {
    return <PowerOffScreen onPower={powerOn} />;
  }

  if (!ready || booting) {
    return <BootSplash label={ready ? "SYSTEM READY" : "LOADING STATES"} />;
  }

  if (view === "play" || view === "home" || view === "session") {
    return (
      <div className="play-root">
        {error ? <ErrorBanner message={error} /> : null}
        <PlayCabinet />
      </div>
    );
  }

  return (
    <div className="cabinet-app">
      <div className="cabinet-shell">
        <nav className="mb-4 flex flex-wrap gap-1">
          {NAV.map((item) => (
            <ArcadeButton key={item.view} active={view === item.view} onClick={() => setView(item.view)}>
              {item.label}
            </ArcadeButton>
          ))}
        </nav>
        {view === "library" || view === "search" || view === "recent" || view === "categories" ? (
          <LibraryScreen mode={view === "search" ? "search" : view === "recent" ? "recent" : view === "categories" ? "categories" : "library"} />
        ) : null}
        {view === "favourites" ? <LibraryScreen mode="favourites" /> : null}
        {view === "settings" || view === "customise" ? <SettingsScreen /> : null}
        {view === "stats" ? <StatsScreen /> : null}
      </div>
    </div>
  );
}
