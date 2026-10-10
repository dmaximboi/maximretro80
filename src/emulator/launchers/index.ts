import type { GameCatalogEntry } from "../../games/gameTypes";
import { describeCore, LaunchError, launchGame, type PlayableEngine } from "../GameLauncher";
import type { EngineHooks } from "../engines/NesEngine";

export abstract class GameLauncherBase {
  abstract readonly id: string;
  abstract canLaunch(game: GameCatalogEntry): boolean;
  abstract launch(game: GameCatalogEntry, hooks: EngineHooks): Promise<PlayableEngine>;
}

export class EmulatorLauncher extends GameLauncherBase {
  readonly id = "emulator";
  canLaunch(game: GameCatalogEntry): boolean {
    return describeCore(game.engine).installed;
  }
  launch(game: GameCatalogEntry, hooks: EngineHooks): Promise<PlayableEngine> {
    return launchGame(game, hooks);
  }
}

export class LocalRomLauncher extends GameLauncherBase {
  readonly id = "local-rom";
  canLaunch(game: GameCatalogEntry): boolean {
    return game.romRequired && describeCore(game.engine).installed;
  }
  launch(game: GameCatalogEntry, hooks: EngineHooks): Promise<PlayableEngine> {
    return launchGame(game, hooks);
  }
}

export class CanvasGameLauncher extends GameLauncherBase {
  readonly id = "canvas";
  canLaunch(game: GameCatalogEntry): boolean {
    return game.engine === "nes";
  }
  launch(game: GameCatalogEntry, hooks: EngineHooks): Promise<PlayableEngine> {
    return launchGame(game, hooks);
  }
}

export class FutureCoreLauncher extends GameLauncherBase {
  readonly id = "future-core";
  canLaunch(): boolean {
    return false;
  }
  launch(game: GameCatalogEntry): Promise<PlayableEngine> {
    throw new LaunchError("CORE_MISSING", describeCore(game.engine).reason);
  }
}

export const launchers = [
  new LocalRomLauncher(),
  new EmulatorLauncher(),
  new CanvasGameLauncher(),
  new FutureCoreLauncher(),
];

export function selectLauncher(game: GameCatalogEntry): GameLauncherBase {
  const match = launchers.find((launcher) => launcher.canLaunch(game));
  return match ?? new FutureCoreLauncher();
}
