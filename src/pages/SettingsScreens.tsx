import { useMemo } from "react";
import { useConsole } from "../app/ConsoleProvider";
import { ArcadeButton, ArcadePanel, PixelLabel, PixelTitle } from "../components/ui";
import type { SettingsPanel } from "../games/gameTypes";
import { PRESET_ORDER } from "../themes/themePresets";
import { THEME_PRESETS } from "../themes/themePresets";
import { applyCrtPreset } from "../themes/ThemeManager";
import { DEFAULT_CUSTOM_THEME, DEFAULT_KEY_BINDING, clearLibraryData, clearSaves, type KeyBinding } from "../storage/stores";
import { DEFAULT_UI_SETTINGS } from "../themes/themeTypes";
import { EXPECTED_GAME_COUNT } from "../games/gameTypes";
import { GAME_CATALOG } from "../games/gameCatalog";

const PANELS: { id: SettingsPanel; label: string }[] = [
  { id: "general", label: "GENERAL" },
  { id: "theme", label: "THEME" },
  { id: "display", label: "DISPLAY" },
  { id: "crt", label: "CRT" },
  { id: "controller", label: "CONTROLLER" },
  { id: "audio", label: "AUDIO" },
  { id: "library", label: "LIBRARY" },
  { id: "roms", label: "ROM MANAGEMENT" },
  { id: "saves", label: "SAVE DATA" },
  { id: "accessibility", label: "ACCESSIBILITY" },
  { id: "about", label: "ABOUT" },
];

const THEME_FIELDS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "screen",
  "text",
  "button",
  "selected",
  "danger",
  "success",
  "crtGlow",
] as const;

export function SettingsScreen({ customiseOnly = false }: { customiseOnly?: boolean }) {
  const { settings, setSettings, setSettingsPanel, settingsPanel, games, padConnected, padId } = useConsole();
  const allowed = customiseOnly ? (["theme", "display", "crt", "accessibility"] as SettingsPanel[]) : PANELS.map((item) => item.id);
  const panel = allowed.includes(settingsPanel) ? settingsPanel : allowed[0] ?? "general";

  return (
    <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
      <ArcadePanel className="p-3">
        <PixelLabel className="mb-2 text-[var(--mr-accent)]">{customiseOnly ? "UI CUSTOMISER" : "SETTINGS"}</PixelLabel>
        <div className="grid gap-2">
          {(customiseOnly ? PANELS.filter((item) => ["theme", "display", "crt", "accessibility"].includes(item.id)) : PANELS).map((item) => (
            <ArcadeButton key={item.id} active={panel === item.id} onClick={() => setSettingsPanel(item.id)}>
              {item.label}
            </ArcadeButton>
          ))}
        </div>
      </ArcadePanel>
      <ArcadePanel className="p-4">
        {panel === "general" ? (
          <div>
            <PixelTitle className="mb-3 text-[14px]">GENERAL</PixelTitle>
            <p>MAXIM RETRO keeps catalogue metadata in memory and user data in IndexedDB. No remote database is queried during play.</p>
            <div className="mt-3">Controller: {padConnected ? `CONNECTED — ${padId}` : "Not detected"}</div>
          </div>
        ) : null}

        {panel === "theme" ? <ThemeEditor /> : null}

        {panel === "display" ? (
          <div className="grid gap-3">
            <PixelTitle className="text-[14px]">DISPLAY / UI</PixelTitle>
            <Slider label="UI SCALE" min={0.8} max={1.3} step={0.05} value={settings.ui.uiScale} onChange={(uiScale) => setSettings((s) => ({ ...s, ui: { ...s.ui, uiScale } }))} />
            <Slider label="PIXEL DENSITY" min={1} max={4} step={1} value={settings.ui.pixelDensity} onChange={(pixelDensity) => setSettings((s) => ({ ...s, ui: { ...s.ui, pixelDensity } }))} />
            <Slider label="BORDER THICKNESS" min={1} max={6} step={1} value={settings.ui.borderThickness} onChange={(borderThickness) => setSettings((s) => ({ ...s, ui: { ...s.ui, borderThickness } }))} />
            <Slider label="CORNER RADIUS" min={0} max={16} step={1} value={settings.ui.cornerRadius} onChange={(cornerRadius) => setSettings((s) => ({ ...s, ui: { ...s.ui, cornerRadius } }))} />
            <Slider label="ANIMATION" min={0} max={1} step={0.05} value={settings.ui.animationIntensity} onChange={(animationIntensity) => setSettings((s) => ({ ...s, ui: { ...s.ui, animationIntensity } }))} />
            <label className="block">
              FONT
              <select className="ml-2" value={settings.ui.fontStyle} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, fontStyle: e.target.value as typeof s.ui.fontStyle } }))}>
                <option value="hybrid">HYBRID</option>
                <option value="pixel">PIXEL</option>
                <option value="terminal">TERMINAL</option>
              </select>
            </label>
            <label className="block">
              MENU LAYOUT
              <select className="ml-2" value={settings.ui.menuLayout} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, menuLayout: e.target.value as typeof s.ui.menuLayout } }))}>
                <option value="cabinet">CABINET</option>
                <option value="rail">RAIL</option>
                <option value="grid">GRID</option>
              </select>
            </label>
            <label className="block">
              GAME CARD
              <select className="ml-2" value={settings.ui.gameCardStyle} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, gameCardStyle: e.target.value as typeof s.ui.gameCardStyle } }))}>
                <option value="cabinet">CABINET</option>
                <option value="cart">CART</option>
                <option value="marquee">MARQUEE</option>
              </select>
            </label>
            <label className="block">
              BACKGROUND
              <select className="ml-2" value={settings.ui.backgroundPattern} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, backgroundPattern: e.target.value as typeof s.ui.backgroundPattern } }))}>
                <option value="none">NONE</option>
                <option value="grid">GRID</option>
                <option value="dots">DOTS</option>
                <option value="scan">SCAN</option>
                <option value="carbon">CARBON</option>
              </select>
            </label>
            <label className="block">
              BUTTON STYLE
              <select className="ml-2" value={settings.ui.buttonStyle} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, buttonStyle: e.target.value as typeof s.ui.buttonStyle } }))}>
                <option value="arcade">ARCADE</option>
                <option value="rect">RECT</option>
                <option value="capsule">CAPSULE</option>
              </select>
            </label>
            <label className="block">
              CONTROLLER STYLE
              <select className="ml-2" value={settings.ui.controllerStyle} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, controllerStyle: e.target.value as typeof s.ui.controllerStyle } }))}>
                <option value="nes">NES</option>
                <option value="genesis">GENESIS</option>
                <option value="modern">MODERN</option>
              </select>
            </label>
            <div className="flex gap-2">
              <ArcadeButton onClick={() => setSettings((s) => ({ ...s, ui: DEFAULT_UI_SETTINGS }))}>RESET TO DEFAULT</ArcadeButton>
            </div>
          </div>
        ) : null}

        {panel === "crt" ? (
          <div className="grid gap-3">
            <PixelTitle className="text-[14px]">CRT EFFECT</PixelTitle>
            <div className="flex flex-wrap gap-2">
              {(["off", "low", "medium", "high"] as const).map((preset) => (
                <ArcadeButton key={preset} active={settings.ui.crtPreset === preset} onClick={() => setSettings((s) => ({ ...s, ui: applyCrtPreset(preset, s.ui) }))}>
                  {preset.toUpperCase()}
                </ArcadeButton>
              ))}
            </div>
            <Slider label="CRT INTENSITY" min={0} max={0.7} step={0.01} value={settings.ui.crtIntensity} onChange={(crtIntensity) => setSettings((s) => ({ ...s, ui: { ...s.ui, crtIntensity } }))} />
            <Slider label="SCANLINES" min={0} max={0.45} step={0.01} value={settings.ui.scanlineIntensity} onChange={(scanlineIntensity) => setSettings((s) => ({ ...s, ui: { ...s.ui, scanlineIntensity } }))} />
            <Slider label="CURVATURE" min={0} max={0.4} step={0.01} value={settings.ui.screenCurvature} onChange={(screenCurvature) => setSettings((s) => ({ ...s, ui: { ...s.ui, screenCurvature } }))} />
            <Slider label="GLOW" min={0} max={0.6} step={0.01} value={settings.ui.glowIntensity} onChange={(glowIntensity) => setSettings((s) => ({ ...s, ui: { ...s.ui, glowIntensity } }))} />
            <Slider label="BRIGHTNESS" min={0.6} max={1.4} step={0.02} value={settings.ui.brightness} onChange={(brightness) => setSettings((s) => ({ ...s, ui: { ...s.ui, brightness } }))} />
            <Slider label="CONTRAST" min={0.7} max={1.4} step={0.02} value={settings.ui.contrast} onChange={(contrast) => setSettings((s) => ({ ...s, ui: { ...s.ui, contrast } }))} />
            <Slider label="SATURATION" min={0.4} max={1.6} step={0.02} value={settings.ui.saturation} onChange={(saturation) => setSettings((s) => ({ ...s, ui: { ...s.ui, saturation } }))} />
            <label><input type="checkbox" checked={settings.ui.vignette} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, vignette: e.target.checked } }))} /> VIGNETTE</label>
            <label><input type="checkbox" checked={settings.ui.flicker} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, flicker: e.target.checked } }))} /> FLICKER</label>
          </div>
        ) : null}

        {panel === "controller" ? <ControllerSettings /> : null}

        {panel === "audio" ? (
          <div className="grid gap-3">
            <PixelTitle className="text-[14px]">AUDIO</PixelTitle>
            <p className="opacity-70">No sound plays until you interact with the cabinet.</p>
            <Slider label="MASTER" min={0} max={1} step={0.01} value={settings.audio.master} onChange={(master) => setSettings((s) => ({ ...s, audio: { ...s.audio, master } }))} />
            <Slider label="MUSIC" min={0} max={1} step={0.01} value={settings.audio.music} onChange={(music) => setSettings((s) => ({ ...s, audio: { ...s.audio, music } }))} />
            <Slider label="SFX" min={0} max={1} step={0.01} value={settings.audio.sfx} onChange={(sfx) => setSettings((s) => ({ ...s, audio: { ...s.audio, sfx } }))} />
            <label><input type="checkbox" checked={settings.audio.muted} onChange={(e) => setSettings((s) => ({ ...s, audio: { ...s.audio, muted: e.target.checked } }))} /> MUTE</label>
          </div>
        ) : null}

        {panel === "library" ? (
          <div>
            <PixelTitle className="text-[14px]">LIBRARY</PixelTitle>
            <p className="mt-2">Official catalogue size: {EXPECTED_GAME_COUNT}. Loaded: {GAME_CATALOG.length}. Runtime games: {games.length}.</p>
            <p className="mt-2">Search is local and instant. Sort and view modes persist in IndexedDB.</p>
          </div>
        ) : null}

        {panel === "roms" ? (
          <div>
            <PixelTitle className="text-[14px]">ROM MANAGEMENT</PixelTitle>
            <p className="mt-2">Installed ROMs: {games.filter((g) => g.romInstalled).length}. Import from a game detail page. Files stay in IndexedDB on this machine.</p>
            <ul className="mt-3 max-h-64 overflow-auto">
              {games.filter((g) => g.romInstalled).map((g) => (
                <li key={g.id}>{g.title} — {g.romFileName}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {panel === "saves" ? (
          <div>
            <PixelTitle className="text-[14px]">SAVE DATA</PixelTitle>
            <p>Save states for the NES core are stored in IndexedDB, not localStorage.</p>
            <ArcadeButton className="mt-3" onClick={() => void clearSaves()}>CLEAR SAVE STATES</ArcadeButton>
            <ArcadeButton className="mt-3 ml-2" onClick={() => void clearLibraryData()}>CLEAR ALL USER DATA</ArcadeButton>
          </div>
        ) : null}

        {panel === "accessibility" ? (
          <div className="grid gap-3">
            <PixelTitle className="text-[14px]">ACCESSIBILITY</PixelTitle>
            <label><input type="checkbox" checked={settings.ui.reducedMotion} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, reducedMotion: e.target.checked } }))} /> REDUCED MOTION</label>
            <label><input type="checkbox" checked={settings.ui.highContrast} onChange={(e) => setSettings((s) => ({ ...s, ui: { ...s.ui, highContrast: e.target.checked } }))} /> HIGH CONTRAST</label>
            <Slider label="UI SCALE" min={0.8} max={1.4} step={0.05} value={settings.ui.uiScale} onChange={(uiScale) => setSettings((s) => ({ ...s, ui: { ...s.ui, uiScale } }))} />
            <p>Keyboard navigation, visible focus rings, and colour-independent status dots are always on.</p>
          </div>
        ) : null}

        {panel === "about" ? (
          <div>
            <PixelTitle className="text-[14px]">ABOUT</PixelTitle>
            <p className="mt-2">MAXIM RETRO is a personal offline cabinet frontend. Commercial ROMs and BIOS files are not included. Play requires legally owned user-supplied files and an available core.</p>
          </div>
        ) : null}
      </ArcadePanel>
    </div>
  );
}

function ThemeEditor() {
  const { settings, setSettings } = useConsole();
  const theme = settings.themeId === "custom" ? settings.customTheme : THEME_PRESETS[settings.themeId];

  return (
    <div className="grid gap-3">
      <PixelTitle className="text-[14px]">THEME EDITOR</PixelTitle>
      <div className="flex flex-wrap gap-2">
        {PRESET_ORDER.map((id) => (
          <ArcadeButton key={id} active={settings.themeId === id} onClick={() => setSettings((s) => ({ ...s, themeId: id }))}>
            {id === "custom" ? "CUSTOM" : THEME_PRESETS[id].name.toUpperCase()}
          </ArcadeButton>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {THEME_FIELDS.map((field) => (
          <label key={field} className="flex items-center justify-between gap-2">
            <span className="uppercase">{field}</span>
            <input
              type="color"
              value={toHex(theme[field])}
              onChange={(event) => {
                setSettings((s) => ({
                  ...s,
                  themeId: "custom",
                  customTheme: { ...s.customTheme, [field]: event.target.value },
                }));
              }}
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <ArcadeButton onClick={() => setSettings((s) => ({ ...s, themeId: "classicGreen", customTheme: DEFAULT_CUSTOM_THEME }))}>RESET TO DEFAULT</ArcadeButton>
        <ArcadeButton onClick={() => setSettings((s) => ({ ...s, themeId: "custom", customTheme: { ...theme, id: "custom", name: "Custom" } }))}>SAVE THEME</ArcadeButton>
      </div>
    </div>
  );
}

function ControllerSettings() {
  const { settings, setSettings, padConnected, padId } = useConsole();
  const waitBind = (field: keyof KeyBinding) => {
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      setSettings((s) => ({ ...s, keys: { ...s.keys, [field]: event.code } }));
      window.removeEventListener("keydown", onKey, true);
    };
    window.addEventListener("keydown", onKey, true);
  };

  return (
    <div className="grid gap-3">
      <PixelTitle className="text-[14px]">CONTROLLER SETTINGS</PixelTitle>
      <div>{padConnected ? `CONTROLLER CONNECTED — ${padId}` : "No gamepad detected. Keyboard remains active."}</div>
      <p>Default map includes Arrows, WASD, Z, X, A, S, Enter, Escape, Space. Click a row and press a key to remap.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(settings.keys) as (keyof KeyBinding)[]).map((field) => (
          <ArcadeButton key={field} onClick={() => waitBind(field)}>
            {field.toUpperCase()} = {settings.keys[field]}
          </ArcadeButton>
        ))}
      </div>
      <ArcadeButton onClick={() => setSettings((s) => ({ ...s, keys: DEFAULT_KEY_BINDING }))}>RESET KEYS</ArcadeButton>
      <PixelLabel>TOUCH</PixelLabel>
      <label><input type="checkbox" checked={settings.touch.visible} onChange={(e) => setSettings((s) => ({ ...s, touch: { ...s.touch, visible: e.target.checked } }))} /> SHOW CONTROLS</label>
      <Slider label="OPACITY" min={0.15} max={0.9} step={0.05} value={settings.touch.opacity} onChange={(opacity) => setSettings((s) => ({ ...s, touch: { ...s.touch, opacity } }))} />
      <Slider label="SIZE" min={0.7} max={1.6} step={0.05} value={settings.touch.size} onChange={(size) => setSettings((s) => ({ ...s, touch: { ...s.touch, size } }))} />
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span>
        {label} {value}
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function toHex(color: string): string {
  if (color.startsWith("#") && color.length === 7) return color;
  return "#00ff00";
}

export function StatsScreen() {
  const { games, setView } = useConsole();
  const stats = useMemo(() => {
    const installed = games.filter((g) => g.romInstalled).length;
    const favs = games.filter((g) => g.favourite).length;
    const played = games.filter((g) => g.playCount > 0);
    const sessions = games.reduce((sum, g) => sum + g.sessions, 0);
    const most = [...games].sort((a, b) => b.playCount - a.playCount)[0];
    const recent = [...games].sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0))[0];
    const byGenre = new Map<string, number>();
    const byPlatform = new Map<string, number>();
    for (const game of games) {
      byPlatform.set(game.platform, (byPlatform.get(game.platform) ?? 0) + 1);
      for (const genre of game.genres) byGenre.set(genre, (byGenre.get(genre) ?? 0) + 1);
    }
    return { installed, favs, played: played.length, sessions, most, recent, byGenre, byPlatform };
  }, [games]);

  return (
    <ArcadePanel className="p-4">
      <PixelTitle className="text-[14px]">STATISTICS</PixelTitle>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="TOTAL GAMES" value={String(games.length)} />
        <Stat label="INSTALLED" value={String(stats.installed)} />
        <Stat label="FAVOURITES" value={String(stats.favs)} />
        <Stat label="GAMES PLAYED" value={String(stats.played)} />
        <Stat label="TOTAL SESSIONS" value={String(stats.sessions)} />
        <Stat label="MOST PLAYED" value={stats.most && stats.most.playCount ? stats.most.title : "—"} />
        <Stat label="RECENT" value={stats.recent?.lastPlayed ? stats.recent.title : "—"} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <PixelLabel>GAMES BY GENRE</PixelLabel>
          {[...stats.byGenre.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => (
            <Bar key={name} label={name} count={count} max={games.length} />
          ))}
        </div>
        <div>
          <PixelLabel>GAMES BY PLATFORM</PixelLabel>
          {[...stats.byPlatform.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => (
            <Bar key={name} label={name} count={count} max={games.length} />
          ))}
        </div>
      </div>
      <ArcadeButton className="mt-4" onClick={() => setView("home")}>HOME</ArcadeButton>
    </ArcadePanel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="arcade-panel p-3">
      <PixelLabel className="text-[var(--mr-accent)]">{label}</PixelLabel>
      <div className="mt-2 font-['Press_Start_2P'] text-[11px] leading-5">{value}</div>
    </div>
  );
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[15px]">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-2 border border-[var(--mr-accent)]">
        <div className="h-full bg-[var(--mr-accent)]" style={{ width: `${Math.max(4, (count / max) * 100)}%` }} />
      </div>
    </div>
  );
}

