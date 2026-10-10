export const EXPECTED_GAME_COUNT = 200;

export const PLATFORMS = [
  "NES",
  "SNES",
  "N64",
  "Game Boy",
  "Arcade",
  "Genesis",
  "Mega Drive",
  "Sega CD",
  "Master System",
  "Saturn",
  "Dreamcast",
  "PlayStation",
  "PlayStation 2",
  "PC",
  "Neo Geo",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const ENGINE_IDS = [
  "nes",
  "snes",
  "n64",
  "gb",
  "arcade",
  "genesis",
  "saturn",
  "dreamcast",
  "psx",
  "ps2",
  "pc",
  "neogeo",
] as const;

export type EngineId = (typeof ENGINE_IDS)[number];

export const CATEGORIES = [
  "Arcade",
  "Platformer",
  "Fighting",
  "Racing",
  "Shooting",
  "Beat 'em Up",
  "Sports",
  "Adventure",
  "RPG",
  "Puzzle",
  "Action",
  "Strategy",
  "Shooter",
  "Tennis",
  "Football",
  "Basketball",
  "Wrestling",
  "Flight",
  "Run & Gun",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Genre = string;

export type GameCatalogEntry = {
  id: string;
  catalogIndex: number;
  title: string;
  platform: Platform;
  year: number;
  genres: readonly string[];
  categories: readonly Category[];
  developer: string;
  publisher: string;
  description: string;
  controls: string;
  engine: EngineId;
  romRequired: true;
  romExtensions: readonly string[];
  artworkSeed: string;
};

export type RomStatus = "missing" | "installed";

export type GameUserState = {
  favourite: boolean;
  favouriteAddedAt: number | null;
  lastPlayed: number | null;
  playCount: number;
  sessions: number;
  romInstalled: boolean;
  romFileName: string | null;
};

export type LibraryGame = GameCatalogEntry & GameUserState;

export type SortMode =
  | "az"
  | "za"
  | "year"
  | "platform"
  | "genre"
  | "mostPlayed"
  | "recentlyPlayed"
  | "favourites";

export type LibraryViewMode = "grid" | "list" | "carousel" | "arcade";

export type ConsoleView =
  | "home"
  | "play"
  | "library"
  | "favourites"
  | "recent"
  | "categories"
  | "settings"
  | "customise"
  | "detail"
  | "session"
  | "stats"
  | "search";

export type SettingsPanel =
  | "general"
  | "theme"
  | "display"
  | "crt"
  | "controller"
  | "audio"
  | "library"
  | "roms"
  | "saves"
  | "accessibility"
  | "about";
