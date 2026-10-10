import { db, STORES } from "./IndexedDBManager";
import type { ConsoleTheme, ThemeId, UiSettings } from "../themes/themeTypes";
import { DEFAULT_UI_SETTINGS } from "../themes/themeTypes";
import { THEME_PRESETS } from "../themes/themePresets";
import type { LibraryViewMode, SortMode } from "../games/gameTypes";

export type KeyBinding = {
  up: string;
  down: string;
  left: string;
  right: string;
  a: string;
  b: string;
  start: string;
  select: string;
  l: string;
  r: string;
};

export const DEFAULT_KEY_BINDING: KeyBinding = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  a: "KeyZ",
  b: "KeyX",
  start: "Enter",
  select: "ShiftRight",
  l: "KeyA",
  r: "KeyS",
};

export type AudioSettings = {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
};

export const DEFAULT_AUDIO: AudioSettings = {
  master: 0,
  music: 1,
  sfx: 1,
  muted: true,
};

export type TouchSettings = {
  visible: boolean;
  opacity: number;
  size: number;
};

export const DEFAULT_TOUCH: TouchSettings = {
  visible: true,
  opacity: 0.45,
  size: 1,
};

export type AppSettings = {
  themeId: ThemeId;
  customTheme: ConsoleTheme;
  ui: UiSettings;
  keys: KeyBinding;
  audio: AudioSettings;
  touch: TouchSettings;
  libraryView: LibraryViewMode;
  sortMode: SortMode;
  poweredOn: boolean;
  lastGameId: string | null;
  lastDifficulty: "simple" | "medium" | "hard" | "professor";
  volumeStep: 0 | 1 | 2 | 3;
};

export const DEFAULT_CUSTOM_THEME: ConsoleTheme = {
  ...THEME_PRESETS.classicGreen,
  id: "custom",
  name: "Custom",
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  themeId: "classicGreen",
  customTheme: DEFAULT_CUSTOM_THEME,
  ui: DEFAULT_UI_SETTINGS,
  keys: DEFAULT_KEY_BINDING,
  audio: DEFAULT_AUDIO,
  touch: DEFAULT_TOUCH,
  libraryView: "grid",
  sortMode: "az",
  poweredOn: true,
  lastGameId: null,
  lastDifficulty: "simple",
  volumeStep: 0,
};

export type HistoryRecord = {
  gameId: string;
  lastPlayed: number;
  playCount: number;
  sessions: number;
};

export type FavouriteRecord = {
  gameId: string;
  addedAt: number;
};

export type RomRecord = {
  gameId: string;
  fileName: string;
  mimeType: string;
  data: ArrayBuffer;
  importedAt: number;
};

export type SaveRecord = {
  id: string;
  gameId: string;
  kind: "save" | "state";
  label: string;
  payload: unknown;
  createdAt: number;
};

export async function loadSettings(): Promise<AppSettings> {
  const stored = await db.get<AppSettings>(STORES.settings, "app");
  if (!stored) return DEFAULT_APP_SETTINGS;
  const merged = {
    ...DEFAULT_APP_SETTINGS,
    ...stored,
    ui: { ...DEFAULT_UI_SETTINGS, ...stored.ui },
    keys: { ...DEFAULT_KEY_BINDING, ...stored.keys },
    audio: { ...DEFAULT_AUDIO, ...stored.audio },
    touch: { ...DEFAULT_TOUCH, ...stored.touch },
    customTheme: { ...DEFAULT_CUSTOM_THEME, ...stored.customTheme },
  };
  const step = ([0, 1, 2, 3] as const).includes(merged.volumeStep) ? merged.volumeStep : 0;
  const level = [0, 0.3, 0.6, 1][step] ?? 0;
  return {
    ...merged,
    volumeStep: step,
    audio: { ...merged.audio, master: level, music: 1, sfx: 1, muted: step === 0 },
  };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.put(STORES.settings, settings, "app");
}

export async function loadHistory(): Promise<HistoryRecord[]> {
  return db.getAll<HistoryRecord>(STORES.history);
}

export async function upsertHistory(record: HistoryRecord): Promise<void> {
  await db.put(STORES.history, record);
}

export async function loadFavourites(): Promise<FavouriteRecord[]> {
  return db.getAll<FavouriteRecord>(STORES.favourites);
}

export async function setFavourite(gameId: string, favourite: boolean): Promise<void> {
  if (favourite) {
    await db.put(STORES.favourites, { gameId, addedAt: Date.now() } satisfies FavouriteRecord);
  } else {
    await db.delete(STORES.favourites, gameId);
  }
}

export async function getRom(gameId: string): Promise<RomRecord | undefined> {
  return db.get<RomRecord>(STORES.roms, gameId);
}

export async function putRom(record: RomRecord): Promise<void> {
  await db.put(STORES.roms, record);
}

export async function deleteRom(gameId: string): Promise<void> {
  await db.delete(STORES.roms, gameId);
}

export async function listRoms(): Promise<RomRecord[]> {
  return db.getAll<RomRecord>(STORES.roms);
}

export async function listSaves(gameId?: string): Promise<SaveRecord[]> {
  const all = await db.getAll<SaveRecord>(STORES.saves);
  return gameId ? all.filter((save) => save.gameId === gameId) : all;
}

export async function putSave(record: SaveRecord): Promise<void> {
  await db.put(STORES.saves, record);
}

export async function deleteSave(id: string): Promise<void> {
  await db.delete(STORES.saves, id);
}

export async function clearSaves(): Promise<void> {
  await db.clear(STORES.saves);
}

export async function clearLibraryData(): Promise<void> {
  await Promise.all([
    db.clear(STORES.history),
    db.clear(STORES.favourites),
    db.clear(STORES.roms),
    db.clear(STORES.saves),
  ]);
}
