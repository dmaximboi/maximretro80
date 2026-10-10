import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GAME_CATALOG } from "../games/gameCatalog";
import type { ConsoleView, LibraryGame, LibraryViewMode, SettingsPanel, SortMode } from "../games/gameTypes";
import { InputManager } from "../controllers/inputManager";
import { AudioBus } from "../lib/audio";
import {
  DEFAULT_APP_SETTINGS,
  loadFavourites,
  loadHistory,
  loadSettings,
  listRoms,
  saveSettings,
  setFavourite as persistFavourite,
  upsertHistory,
  type AppSettings,
} from "../storage/stores";
import { applyThemeToDocument, resolveTheme } from "../themes/ThemeManager";

type ConsoleContextValue = {
  ready: boolean;
  error: string | null;
  settings: AppSettings;
  setSettings: (updater: (current: AppSettings) => AppSettings) => void;
  games: LibraryGame[];
  view: ConsoleView;
  setView: (view: ConsoleView) => void;
  selectedId: string | null;
  selectGame: (id: string | null) => void;
  selectedGame: LibraryGame | null;
  query: string;
  setQuery: (query: string) => void;
  category: string;
  setCategory: (category: string) => void;
  settingsPanel: SettingsPanel;
  setSettingsPanel: (panel: SettingsPanel) => void;
  toggleFavourite: (id: string) => Promise<void>;
  markPlayed: (id: string) => Promise<void>;
  refreshRoms: () => Promise<void>;
  input: InputManager;
  audio: AudioBus;
  padConnected: boolean;
  padId: string;
  unlockAudio: () => Promise<void>;
  setLibraryView: (mode: LibraryViewMode) => void;
  setSortMode: (mode: SortMode) => void;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

function mergeGames(
  favourites: Map<string, number>,
  history: Map<string, { lastPlayed: number; playCount: number; sessions: number }>,
  roms: Set<string>,
): LibraryGame[] {
  return GAME_CATALOG.map((game) => {
    const hist = history.get(game.id);
    const favAt = favourites.get(game.id);
    return {
      ...game,
      favourite: favAt !== undefined,
      favouriteAddedAt: favAt ?? null,
      lastPlayed: hist?.lastPlayed ?? null,
      playCount: hist?.playCount ?? 0,
      sessions: hist?.sessions ?? 0,
      romInstalled: roms.has(game.id),
      romFileName: null,
    };
  });
}

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [games, setGames] = useState<LibraryGame[]>([]);
  const [view, setView] = useState<ConsoleView>("play");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>("general");
  const [padConnected, setPadConnected] = useState(false);
  const [padId, setPadId] = useState("");
  const persistTimer = useRef<number | null>(null);
  const input = useMemo(() => new InputManager(DEFAULT_APP_SETTINGS.keys), []);
  const audio = useMemo(() => new AudioBus(DEFAULT_APP_SETTINGS.audio), []);

  const hydrate = useCallback(async () => {
    try {
      const [saved, favs, hist, roms] = await Promise.all([
        loadSettings(),
        loadFavourites(),
        loadHistory(),
        listRoms(),
      ]);
      setSettingsState(saved);
      input.setKeys(saved.keys);
      audio.apply(saved.audio);
      const favouriteMap = new Map(favs.map((item) => [item.gameId, item.addedAt]));
      const historyMap = new Map(hist.map((item) => [item.gameId, item]));
      const romSet = new Set(roms.map((item) => item.gameId));
      const merged = mergeGames(favouriteMap, historyMap, romSet).map((game) => {
        const rom = roms.find((item) => item.gameId === game.id);
        return { ...game, romFileName: rom?.fileName ?? null };
      });
      setGames(merged);
      if (saved.lastGameId) setSelectedId(saved.lastGameId);
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load console data.");
      setGames(mergeGames(new Map(), new Map(), new Set()));
      setReady(true);
    }
  }, [audio, input]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    input.start();
    const timer = window.setInterval(() => {
      setPadConnected(input.connected);
      setPadId(input.padId);
    }, 500);
    return () => {
      input.stop();
      window.clearInterval(timer);
    };
  }, [input]);

  useEffect(() => {
    const theme = resolveTheme(settings.themeId, settings.customTheme);
    applyThemeToDocument(theme, settings.ui);
    input.setKeys(settings.keys);
    audio.apply(settings.audio);
    if (!ready) return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      void saveSettings(settings);
    }, 200);
  }, [settings, ready, input, audio]);

  const setSettings = useCallback((updater: (current: AppSettings) => AppSettings) => {
    setSettingsState((current) => updater(current));
  }, []);

  const toggleFavourite = useCallback(async (id: string) => {
    const current = games.find((game) => game.id === id);
    if (!current) return;
    const next = !current.favourite;
    await persistFavourite(id, next);
    setGames((list) =>
      list.map((game) =>
        game.id === id
          ? { ...game, favourite: next, favouriteAddedAt: next ? Date.now() : null }
          : game,
      ),
    );
  }, [games]);

  const markPlayed = useCallback(async (id: string) => {
    const current = games.find((game) => game.id === id);
    const next = {
      gameId: id,
      lastPlayed: Date.now(),
      playCount: (current?.playCount ?? 0) + 1,
      sessions: (current?.sessions ?? 0) + 1,
    };
    await upsertHistory(next);
    setGames((list) =>
      list.map((game) =>
        game.id === id
          ? { ...game, lastPlayed: next.lastPlayed, playCount: next.playCount, sessions: next.sessions }
          : game,
      ),
    );
  }, [games]);

  const refreshRoms = useCallback(async () => {
    const roms = await listRoms();
    const romSet = new Set(roms.map((item) => item.gameId));
    setGames((list) =>
      list.map((game) => {
        const rom = roms.find((item) => item.gameId === game.id);
        return { ...game, romInstalled: romSet.has(game.id), romFileName: rom?.fileName ?? null };
      }),
    );
  }, []);

  const selectedGame = games.find((game) => game.id === selectedId) ?? null;

  const value = useMemo<ConsoleContextValue>(
    () => ({
      ready,
      error,
      settings,
      setSettings,
      games,
      view,
      setView,
      selectedId,
      selectGame: setSelectedId,
      selectedGame,
      query,
      setQuery,
      category,
      setCategory,
      settingsPanel,
      setSettingsPanel,
      toggleFavourite,
      markPlayed,
      refreshRoms,
      input,
      audio,
      padConnected,
      padId,
      unlockAudio: () => audio.unlock(),
      setLibraryView: (mode) => setSettings((current) => ({ ...current, libraryView: mode })),
      setSortMode: (mode) => setSettings((current) => ({ ...current, sortMode: mode })),
    }),
    [
      ready,
      error,
      settings,
      setSettings,
      games,
      view,
      selectedId,
      selectedGame,
      query,
      category,
      settingsPanel,
      toggleFavourite,
      markPlayed,
      refreshRoms,
      input,
      audio,
      padConnected,
      padId,
    ],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export function useConsole(): ConsoleContextValue {
  const value = useContext(ConsoleContext);
  if (!value) throw new Error("useConsole must be used within ConsoleProvider");
  return value;
}
