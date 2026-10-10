import type { GameCatalogEntry } from "../games/gameTypes";
import type { PadButton } from "../controllers/controllerTypes";
import { loadRomBytes } from "./RomManager";
import { NesEngine, type EngineHooks } from "./engines/NesEngine";

export type LaunchErrorCode = "ROM_MISSING" | "CORE_MISSING" | "ROM_INVALID" | "UNSUPPORTED";

export class LaunchError extends Error {
  readonly code: LaunchErrorCode;
  constructor(code: LaunchErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type PlayableEngine = {
  width: number;
  height: number;
  supportsSaveState: boolean;
  start: () => void;
  stop: () => void;
  setButton: (button: PadButton, pressed: boolean) => void;
  captureState: () => unknown;
  restoreState: (state: unknown) => void;
};

export type CoreAvailability = {
  installed: boolean;
  playable: boolean;
  reason: string;
};

const BUNDLED_CORES: Record<string, string> = {
  nes: "jsnes (bundled NES core)",
};

export function describeCore(engine: GameCatalogEntry["engine"]): CoreAvailability {
  if (engine === "nes") {
    return { installed: true, playable: true, reason: BUNDLED_CORES.nes };
  }
  return {
    installed: false,
    playable: false,
    reason: `No ${engine.toUpperCase()} core is bundled. Import a ROM after a future core is connected.`,
  };
}

export async function verifyPlayable(game: GameCatalogEntry): Promise<{ romName: string; rom: ArrayBuffer }> {
  const core = describeCore(game.engine);
  if (!core.installed) {
    throw new LaunchError("CORE_MISSING", core.reason);
  }
  const rom = await loadRomBytes(game.id);
  if (!rom) {
    throw new LaunchError("ROM_MISSING", "ROM NOT INSTALLED");
  }
  if (rom.data.byteLength < 16) {
    throw new LaunchError("ROM_INVALID", "The imported file is too small to be a valid ROM.");
  }
  return { romName: rom.fileName, rom: rom.data };
}

export function createEngine(game: GameCatalogEntry, hooks: EngineHooks): PlayableEngine {
  if (game.engine === "nes") {
    return new NesEngine(hooks);
  }
  throw new LaunchError("CORE_MISSING", describeCore(game.engine).reason);
}

export async function launchGame(game: GameCatalogEntry, hooks: EngineHooks): Promise<PlayableEngine> {
  const { rom } = await verifyPlayable(game);
  const engine = createEngine(game, hooks);
  if (engine instanceof NesEngine || game.engine === "nes") {
    (engine as NesEngine).load(rom);
  }
  return engine;
}
