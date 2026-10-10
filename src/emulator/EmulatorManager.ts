import type { GameCatalogEntry } from "../games/gameTypes";
import { describeCore, launchGame, type PlayableEngine } from "./GameLauncher";
import type { EngineHooks } from "./engines/NesEngine";

export class EmulatorManager {
  private engine: PlayableEngine | null = null;

  statusFor(game: GameCatalogEntry) {
    return describeCore(game.engine);
  }

  async start(game: GameCatalogEntry, hooks: EngineHooks): Promise<PlayableEngine> {
    this.stop();
    this.engine = await launchGame(game, hooks);
    this.engine.start();
    return this.engine;
  }

  stop(): void {
    this.engine?.stop();
    this.engine = null;
  }

  active(): PlayableEngine | null {
    return this.engine;
  }
}

export const emulatorManager = new EmulatorManager();
