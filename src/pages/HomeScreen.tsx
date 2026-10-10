import { useEffect, useMemo, useState } from "react";
import { useConsole } from "../app/ConsoleProvider";
import { CrtBezel } from "../components/CrtBezel";
import { GameArt } from "../components/GameArt";
import { ArcadeButton, ArcadePanel, PixelLabel, PixelTitle } from "../components/ui";
import type { ConsoleView } from "../games/gameTypes";

const MENU: { view: ConsoleView; label: string }[] = [
  { view: "play", label: "PLAY" },
  { view: "library", label: "LIBRARY" },
  { view: "favourites", label: "FAVOURITES" },
  { view: "recent", label: "RECENT" },
  { view: "categories", label: "CATEGORIES" },
  { view: "settings", label: "SETTINGS" },
  { view: "customise", label: "CUSTOMISE" },
];

export function HomeScreen() {
  const { games, setView, selectGame, padConnected, padId, audio, unlockAudio, settings } = useConsole();
  const [index, setIndex] = useState(0);
  const recent = useMemo(
    () => [...games].filter((g) => g.lastPlayed).sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0)).slice(0, 6),
    [games],
  );
  const featured = recent[0] ?? games[0] ?? null;
  const installed = games.filter((g) => g.romInstalled).length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
        event.preventDefault();
        setIndex((i) => (i + 1) % MENU.length);
        audio.beep("move");
      }
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
        event.preventDefault();
        setIndex((i) => (i - 1 + MENU.length) % MENU.length);
        audio.beep("move");
      }
      if (event.key === "Enter") {
        const item = MENU[index];
        if (item) open(item.view);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, audio]);

  const open = (view: ConsoleView) => {
    void unlockAudio();
    audio.beep("ok");
    if (view === "play") {
      const target = recent[0] ?? games.find((g) => g.romInstalled) ?? games[0];
      if (target) {
        selectGame(target.id);
        setView("detail");
        return;
      }
    }
    setView(view);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <ArcadePanel className="home-menu p-3">
        <PixelLabel className="mb-3 text-[var(--mr-accent)]">DASHBOARD</PixelLabel>
        <div className="grid gap-2">
          {MENU.map((item, i) => (
            <ArcadeButton key={item.label} active={i === index} onClick={() => open(item.view)}>
              {item.label}
            </ArcadeButton>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-[16px] opacity-80">
          <div>LIBRARY {games.length}</div>
          <div>INSTALLED {installed}</div>
          <div>{padConnected ? `CONTROLLER CONNECTED` : "NO CONTROLLER"}</div>
          {padConnected ? <div className="truncate text-[14px]">{padId}</div> : null}
        </div>
      </ArcadePanel>

      <CrtBezel className="min-h-[420px]">
        <div className="relative min-h-[380px] p-5">
          <PixelTitle>MAXIM RETRO</PixelTitle>
          <p className="mt-3 max-w-xl opacity-85">
            Personal cabinet. Only original built-in games — one unique mode each. No remakes of the same title.
          </p>
          {featured ? (
            <div className="mt-6 flex flex-wrap items-end gap-4">
              <GameArt game={featured} className="h-36 w-48 border border-[var(--mr-accent)]" />
              <div>
                <PixelLabel className="text-[var(--mr-selected)]">NOW ON DECK</PixelLabel>
                <div className="mt-2 font-['Press_Start_2P'] text-[11px] leading-5">{featured.title}</div>
                <div className="opacity-75">
                  {featured.year} · {featured.platform}
                </div>
                <ArcadeButton className="mt-3" onClick={() => open("play")}>
                  INSERT COIN / PLAY
                </ArcadeButton>
              </div>
            </div>
          ) : null}
          <div className="mt-6">
            <PixelLabel className="mb-2">RECENTLY PLAYED</PixelLabel>
            {recent.length === 0 ? (
              <div className="opacity-70">No sessions yet. Open LIBRARY to import a ROM.</div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recent.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    className="w-28 shrink-0"
                    onClick={() => {
                      selectGame(game.id);
                      setView("detail");
                    }}
                  >
                    <GameArt game={game} className="aspect-square" />
                    <div className="mt-1 truncate text-[14px]">{game.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {settings.ui.menuLayout === "rail" ? (
            <div className="absolute right-3 top-3 pixel-label opacity-60">RAIL LAYOUT</div>
          ) : null}
        </div>
      </CrtBezel>
    </div>
  );
}
