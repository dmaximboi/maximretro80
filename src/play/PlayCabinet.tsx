import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useConsole } from "../app/ConsoleProvider";
import {
  DIFFICULTY_SCALE,
  specForGame,
  specFromMode,
  type Difficulty,
  type UniqueMode,
  type UniqueSpec,
} from "./uniqueSpecs";
import { createUniqueGame, type PlayableGame } from "./uniqueEngine";
import { stepLabel, steps } from "./music";

const QUICK: { mode: UniqueMode; title: string }[] = [
  { mode: "snake", title: "SNAKE" },
  { mode: "dodge", title: "DODGE" },
  { mode: "tetris", title: "TETRIS" },
  { mode: "race", title: "RACE" },
  { mode: "bricks", title: "BREAKOUT" },
];

const DIFFS: Difficulty[] = ["simple", "medium", "hard", "professor"];

function padScore(score: number): string {
  return String(Math.max(0, score)).padStart(4, "0");
}

export function PlayCabinet() {
  const { selectedGame, markPlayed, games, selectGame, audio, unlockAudio, settings, setSettings } = useConsole();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PlayableGame | null>(null);
  const playedRef = useRef(markPlayed);
  playedRef.current = markPlayed;
  const [spec, setSpec] = useState<UniqueSpec>(() =>
    selectedGame ? specForGame(selectedGame) : specFromMode("dodge", "DODGE"),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = settings.lastDifficulty;
    return saved === "simple" || saved === "medium" || saved === "hard" || saved === "professor" ? saved : "simple";
  });
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("READY");
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5);
  const [progress, setProgress] = useState(0);
  const [place, setPlace] = useState(1);
  const [goal, setGoal] = useState("GOAL");
  const [paused, setPaused] = useState(false);
  const [showHowTo, setShowHowTo] = useState(true);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const libraryRows = useMemo(
    () => games.map((game) => ({ game, unique: specForGame(game) })),
    [games],
  );

  useEffect(() => {
    if (selectedGame) {
      setSpec(specForGame(selectedGame));
      setShowHowTo(true);
      setSettings((current) => ({ ...current, lastGameId: selectedGame.id }));
    }
  }, [selectedGame, setSettings]);

  useEffect(() => {
    setSettings((current) => ({ ...current, lastDifficulty: difficulty }));
  }, [difficulty, setSettings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current?.stop();
    if (showHowTo) return;
    const game = createUniqueGame(canvas, spec, difficulty, {
      onScore: setScore,
      onStatus: setStatus,
      onHud: (info) => {
        setLevel(info.level);
        setLives(info.lives);
        setProgress(info.progress);
        setPlace(info.place);
        setGoal(info.goal);
      },
      onLevelClear: (info) => {
        setBanner(`LEVEL ${info.level} ${info.rank}`);
        window.setTimeout(() => setBanner(null), 1200);
        if (selectedGame) void playedRef.current(selectedGame.id);
      },
      onOver: () => {
        if (selectedGame) void playedRef.current(selectedGame.id);
      },
      onSfx: (kind) => audio.playSfx(kind),
    });
    gameRef.current = game;
    game.start();
    setPaused(false);
    setStatus("PLAY");
    return () => game.stop();
  }, [spec, difficulty, showHowTo, audio, selectedGame]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (event.code === "KeyP") {
        togglePause();
        return;
      }
      gameRef.current?.press(event.code, true);
      if (event.code === "Enter" && showHowTo) begin();
    };
    const up = (event: KeyboardEvent) => gameRef.current?.press(event.code, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  const hold = (code: string, pressed: boolean) => gameRef.current?.press(code, pressed);

  const begin = () => {
    void unlockAudio();
    setShowHowTo(false);
    setBanner(null);
  };

  const togglePause = () => {
    if (showHowTo || status === "GAME OVER") {
      begin();
      if (status === "GAME OVER") gameRef.current?.restart();
      setPaused(false);
      return;
    }
    if (paused) {
      gameRef.current?.resume();
      setPaused(false);
    } else {
      gameRef.current?.pause();
      setPaused(true);
    }
  };

  const jump = (delta: number) => {
    const current = selectedGame ? games.findIndex((game) => game.id === selectedGame.id) : -1;
    const next = games[(current + delta + games.length) % games.length];
    if (!next) return;
    selectGame(next.id);
    setSpec(specForGame(next));
    setShowHowTo(true);
    gameRef.current?.stop();
  };

  const playColor = settings.customTheme.accent;
  const volumeStep = settings.volumeStep ?? 0;

  const cycleVolume = () => {
    const next = ((volumeStep + 1) % 4) as 0 | 1 | 2 | 3;
    const level = steps()[next] ?? 0;
    void unlockAudio().then(() => {
      setSettings((current) => ({
        ...current,
        volumeStep: next,
        audio: { ...current.audio, master: level, music: 1, sfx: 1, muted: next === 0 },
      }));
    });
  };

  useEffect(() => {
    const playing = !showHowTo && !paused && status !== "GAME OVER" && settings.poweredOn && volumeStep > 0;
    if (playing) audio.playTune(spec.mode, spec.scene);
    else audio.stopTune();
    return () => audio.stopTune();
  }, [audio, spec.mode, spec.scene, showHowTo, paused, status, volumeStep, settings.poweredOn]);

  return (
    <div className="toy-shell" style={{ color: playColor }}>
      <header className="play-head">
        <span className="play-brand">MAXIM RETRO</span>
        <span className="play-title">{spec.title.toUpperCase()}</span>
        <span className="play-lv">LV {String(level).padStart(2, "0")}</span>
      </header>

      <div className="toy-bezel">
      <div className="play-screen">
        <div className="screen-hud">
          <span>SC {padScore(score)}</span>
          <span>{goal}</span>
          <span>P{place}</span>
          <span>HP {lives}</span>
        </div>
        <div className="goal-bar"><i style={{ width: `${Math.max(4, progress)}%` }} /></div>
        <canvas ref={canvasRef} />
        {showHowTo ? (
          <div className="play-howto">
            <div className="play-howto-title">HOW TO PLAY · {spec.modeLabel}</div>
            {spec.howTo.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <button type="button" className="play-howto-go" onClick={begin}>
              START
            </button>
          </div>
        ) : null}
        {banner ? <div className="play-over">{banner}</div> : null}
        {status === "GAME OVER" ? (
          <div className="play-over">
            GAME OVER
            <button type="button" className="play-howto-go" onClick={() => gameRef.current?.restart()}>
              RETRY
            </button>
          </div>
        ) : null}
        {paused ? <div className="play-over">PAUSE</div> : null}
      </div>
      </div>

      <div className="play-controls">
      <div className="play-modes">
        {QUICK.map((item) => (
          <button
            key={item.mode}
            type="button"
            className={spec.mode === item.mode && spec.id.startsWith("mode-") ? "is-on" : ""}
            onClick={() => {
              selectGame(null);
              setSpec(specFromMode(item.mode, item.title));
              setShowHowTo(true);
            }}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="icon-row">
        <IconButton
          title="Power"
          className="power-icon"
          onClick={() => {
            gameRef.current?.stop();
            audio.stopTune();
            setSettings((current) => ({ ...current, poweredOn: false }));
          }}
        >
          <PowerIcon />
        </IconButton>
        <IconButton
          title={`Volume ${stepLabel(volumeStep)}`}
          className={`vol-toggle ${volumeStep === 0 ? "is-muted" : ""}`}
          onClick={cycleVolume}
        >
          <VolumeIcon />
          <span className="vol-tag">{stepLabel(volumeStep)}</span>
        </IconButton>
        <IconButton title="Settings" onClick={() => setShowSettings((v) => !v)}>
          ⚙
        </IconButton>
        <IconButton title="Previous game" onClick={() => jump(-1)}>
          ‹
        </IconButton>
        <IconButton title="Next game" onClick={() => jump(1)}>
          ›
        </IconButton>
        <IconButton title="Restart" onClick={() => gameRef.current?.restart()}>
          ↻
        </IconButton>
        <IconButton title="Stop" onClick={() => { gameRef.current?.stop(); setShowHowTo(true); setPaused(false); }}>
          ■
        </IconButton>
        <IconButton
          title={paused || showHowTo ? "Play" : "Pause"}
          className={`pause-toggle ${paused || showHowTo ? "is-play" : "is-pause"}`}
          onClick={togglePause}
        >
          <span className="pause-face pause-face-pause" aria-hidden="true">
            <PauseIcon />
          </span>
          <span className="pause-face pause-face-play" aria-hidden="true">
            <PlayIcon />
          </span>
        </IconButton>
      </div>

      <div className="play-pads">
        <div className="dpad">
          <span />
          <Pad label="▲" onHold={(down) => hold("ArrowUp", down)} />
          <span />
          <Pad label="◄" onHold={(down) => hold("ArrowLeft", down)} />
          <span />
          <Pad label="►" onHold={(down) => hold("ArrowRight", down)} />
          <span />
          <Pad label="▼" onHold={(down) => hold("ArrowDown", down)} />
          <span />
        </div>
        <div className="ab-wrap">
          <div className="ab">
            <Pad label="B" round onHold={(down) => hold("KeyX", down)} />
            <Pad label="A" round onHold={(down) => hold("KeyZ", down)} />
          </div>
          <button type="button" className="icon-round library-fab" onClick={() => setShowLibrary((v) => !v)} title="All 200 games">
            200
          </button>
        </div>
      </div>
      </div>

      {showSettings ? (
        <div className="play-settings">
          <div className="play-library-head">
            <span>SETTINGS</span>
            <button type="button" onClick={() => setShowSettings(false)}>
              CLOSE
            </button>
          </div>
          <p>DIFFICULTY</p>
          <div className="play-modes">
            {DIFFS.map((item) => (
              <button key={item} type="button" className={difficulty === item ? "is-on" : ""} onClick={() => setDifficulty(item)}>
                {DIFFICULTY_SCALE[item].label}
              </button>
            ))}
          </div>
          <p>SCREEN COLOR</p>
          <input
            type="color"
            value={settings.customTheme.accent}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                themeId: "custom",
                customTheme: {
                  ...current.customTheme,
                  accent: event.target.value,
                  selected: event.target.value,
                  crtGlow: event.target.value,
                  text: event.target.value,
                },
              }))
            }
          />
          <button
            type="button"
            className="play-howto-go"
            onClick={() =>
              setSettings((current) => ({
                ...current,
                themeId: "classicGreen",
              }))
            }
          >
            RESET GREEN
          </button>
        </div>
      ) : null}

      {showLibrary ? (
        <div className="play-library">
          <div className="play-library-head">
            <span>200 GAMES</span>
            <button type="button" onClick={() => setShowLibrary(false)}>
              CLOSE
            </button>
          </div>
          <div className="play-library-list">
            {libraryRows.map(({ game, unique }) => (
              <button
                key={game.id}
                type="button"
                onClick={() => {
                  selectGame(game.id);
                  setShowLibrary(false);
                  setShowHowTo(true);
                }}
              >
                <b>{game.title}</b>
                <em>{unique.modeLabel} · {unique.edition}</em>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Pad({
  label,
  onHold,
  round = false,
}: {
  label: string;
  onHold: (pressed: boolean) => void;
  round?: boolean;
}) {
  return (
    <button
      type="button"
      className={round ? "pad-round" : "pad-dir"}
      onPointerDown={(event) => {
        event.preventDefault();
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
    >
      {label}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  title,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  className?: string;
}) {
  return (
    <button type="button" className={`icon-round ${className}`} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function PowerIcon() {
  return (
    <svg className="ui-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2v10M7.2 5.1a8 8 0 1 0 9.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="ui-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg className="ui-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9h3.2L12 5v14l-4.8-4H4V9z" fill="currentColor" />
      <path d="M15 9.2c1.2 1 1.8 2.2 1.8 2.8S16.2 14 15 15M17.6 7c2 1.8 3 3.6 3 5s-1 3.2-3 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="ui-ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.2v13.6L19 12 8 5.2z" fill="currentColor" />
    </svg>
  );
}
