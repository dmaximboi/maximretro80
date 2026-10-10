import { useRef, useState } from "react";
import { useConsole } from "../app/ConsoleProvider";
import { CrtBezel } from "../components/CrtBezel";
import { GameArt } from "../components/GameArt";
import { ArcadeButton, ArcadePanel, EmptyState, ErrorBanner, PixelLabel, PixelTitle, StatusBadge } from "../components/ui";
import { importRomFile, removeRom } from "../emulator/RomManager";

export function DetailScreen() {
  const { selectedGame, setView, toggleFavourite, refreshRoms, unlockAudio, audio } = useConsole();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!selectedGame) {
    return <EmptyState title="NO GAME SELECTED" body="Return to the library and choose a cabinet title." action={<ArcadeButton onClick={() => setView("library")}>LIBRARY</ArcadeButton>} />;
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      await importRomFile(selectedGame, file);
      await refreshRoms();
      setMessage(`Imported ${file.name}`);
      audio.beep("ok");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed.");
      audio.beep("warn");
    } finally {
      setBusy(false);
    }
  };

  const onPlay = async () => {
    await unlockAudio();
    audio.beep("ok");
    setView("play");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <CrtBezel>
        <div className="p-3">
          <GameArt game={selectedGame} className="aspect-[4/3]" />
        </div>
      </CrtBezel>
      <ArcadePanel className="p-4">
        <PixelLabel className="text-[var(--mr-accent)]">GAME {String(selectedGame.catalogIndex).padStart(3, "0")}</PixelLabel>
        <PixelTitle className="mt-2">{selectedGame.title}</PixelTitle>
        <div className="mt-3 flex flex-wrap gap-3 opacity-85">
          <span>YEAR {selectedGame.year}</span>
          <span>PLATFORM {selectedGame.platform}</span>
          <span>GENRE {selectedGame.genres.join(" / ")}</span>
        </div>
        <div className="mt-2 opacity-80">
          {selectedGame.developer} · {selectedGame.publisher}
        </div>
        <p className="mt-4 max-w-3xl leading-6">{selectedGame.description}</p>
        <div className="mt-4">
          <PixelLabel>CONTROLS</PixelLabel>
          <p className="mt-1">{selectedGame.controls}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <StatusBadge tone="ok" label="PLAYABLE NOW" />
          <StatusBadge tone="info" label="BUILT-IN CABINET GAME" />
          <StatusBadge tone="info" label={selectedGame.engine.toUpperCase()} />
        </div>
        {selectedGame.romFileName ? <div className="mt-2 text-[15px] opacity-70">FILE {selectedGame.romFileName}</div> : null}
        {message ? <div className="mt-3"><ErrorBanner message={message} /></div> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <ArcadeButton onClick={() => void onPlay()} disabled={busy}>
            PLAY
          </ArcadeButton>
          <ArcadeButton onClick={() => void toggleFavourite(selectedGame.id)}>{selectedGame.favourite ? "UNFAVOURITE" : "FAVOURITE"}</ArcadeButton>
          <ArcadeButton onClick={() => fileRef.current?.click()} disabled={busy}>
            IMPORT ROM
          </ArcadeButton>
          {selectedGame.romInstalled ? (
            <ArcadeButton
              onClick={() => {
                void removeRom(selectedGame.id).then(() => refreshRoms());
              }}
            >
              REMOVE ROM
            </ArcadeButton>
          ) : null}
          <ArcadeButton onClick={() => setView("settings")}>SETTINGS</ArcadeButton>
          <ArcadeButton onClick={() => setView("library")}>BACK</ArcadeButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept={selectedGame.romExtensions.map((ext) => `.${ext}`).join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            void onImport(file);
            event.target.value = "";
          }}
        />
        <p className="mt-4 max-w-2xl text-[15px] opacity-70">
          This title plays immediately as a built-in cabinet game. Optional ROM import is only for a future emulator core.
        </p>
      </ArcadePanel>
    </div>
  );
}
