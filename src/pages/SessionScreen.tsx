import { useEffect, useRef, useState } from "react";
import { useConsole } from "../app/ConsoleProvider";
import { CrtBezel } from "../components/CrtBezel";
import { VirtualGamepad } from "../components/VirtualGamepad";
import { ArcadeButton, ArcadePanel, EmptyState, ErrorBanner, PixelLabel, PixelTitle } from "../components/ui";
import type { PadButton } from "../controllers/controllerTypes";
import { LaunchError, launchGame } from "../emulator/GameLauncher";
import { readLatestState, writeSaveState } from "../emulator/SaveStateManager";
import type { PlayableEngine } from "../emulator/GameLauncher";

export function SessionScreen() {
  const { selectedGame, setView, markPlayed, input, settings, padConnected } = useConsole();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PlayableEngine | null>(null);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("BOOTING CORE...");
  const [showHelp, setShowHelp] = useState(true);

  useEffect(() => {
    if (!selectedGame) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const start = async () => {
      try {
        const engine = await launchGame(selectedGame, {
          onFrame: (pixels, width, height) => {
            if (cancelled) return;
            canvas.width = width;
            canvas.height = height;
            const image = new ImageData(new Uint8ClampedArray(pixels), width, height);
            ctx.putImageData(image, 0, 0);
          },
        });
        if (cancelled) {
          engine.stop();
          return;
        }
        engineRef.current = engine;
        engine.start();
        await markPlayed(selectedGame.id);
        setStatus("RUNNING");
      } catch (err) {
        const message =
          err instanceof LaunchError ? err.message : err instanceof Error ? err.message : "Launch failed.";
        setError(message);
        setStatus("HALTED");
      }
    };

    void start();

    const unsub = input.subscribe((button: PadButton, pressed) => {
      engineRef.current?.setButton(button, pressed);
    });

    return () => {
      cancelled = true;
      unsub();
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, [selectedGame, input, markPlayed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (paused) engineRef.current?.stop();
    else if (engineRef.current && status === "RUNNING") engineRef.current.start();
  }, [paused, status]);

  if (!selectedGame) {
    return <EmptyState title="NO SESSION" body="Select a game first." action={<ArcadeButton onClick={() => setView("library")}>LIBRARY</ArcadeButton>} />;
  }

  const exit = () => {
    engineRef.current?.stop();
    setView("detail");
  };

  const saveState = async () => {
    const engine = engineRef.current;
    if (!engine?.supportsSaveState) {
      setError("Save states are not supported by the current core.");
      return;
    }
    await writeSaveState(selectedGame.id, engine.captureState());
    setStatus("STATE SAVED");
  };

  const loadState = async () => {
    const engine = engineRef.current;
    if (!engine?.supportsSaveState) return;
    const latest = await readLatestState(selectedGame.id);
    if (!latest) {
      setError("No save state stored for this title.");
      return;
    }
    engine.restoreState(latest.payload);
    setStatus("STATE LOADED");
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <PixelTitle className="text-[14px]">{selectedGame.title}</PixelTitle>
          <PixelLabel className="mt-1 text-[var(--mr-accent)]">{status}{padConnected ? " · CONTROLLER CONNECTED" : ""}</PixelLabel>
        </div>
        <div className="flex flex-wrap gap-2">
          <ArcadeButton onClick={() => setPaused((v) => !v)}>{paused ? "RESUME" : "PAUSE"}</ArcadeButton>
          <ArcadeButton onClick={() => void saveState()}>SAVE STATE</ArcadeButton>
          <ArcadeButton onClick={() => void loadState()}>LOAD STATE</ArcadeButton>
          <ArcadeButton onClick={() => setShowHelp((v) => !v)}>{showHelp ? "HIDE HELP" : "SHOW HELP"}</ArcadeButton>
          <ArcadeButton onClick={exit}>EXIT</ArcadeButton>
        </div>
      </div>
      {error ? <ErrorBanner message={error} /> : null}
      <CrtBezel className="relative">
        <div className="relative aspect-[4/3] max-h-[70vh] bg-black">
          <canvas ref={canvasRef} className="h-full w-full" style={{ imageRendering: "pixelated" }} />
          {paused ? (
            <div className="absolute inset-0 grid place-items-center bg-[#000a]">
              <PixelTitle>PAUSED</PixelTitle>
            </div>
          ) : null}
          <VirtualGamepad />
        </div>
      </CrtBezel>
      {showHelp ? (
        <ArcadePanel className="p-3 text-[16px]">
          <PixelLabel className="mb-2">SESSION CONTROLS</PixelLabel>
          <div>
            Move {settings.keys.up}/{settings.keys.left}/{settings.keys.down}/{settings.keys.right} or WASD · A {settings.keys.a} · B{" "}
            {settings.keys.b} · Start {settings.keys.start} · Select {settings.keys.select} · Escape pause · Exit returns to details
          </div>
          <div className="mt-1 opacity-70">{selectedGame.controls}</div>
        </ArcadePanel>
      ) : null}
    </div>
  );
}
