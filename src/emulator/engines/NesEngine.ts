import { Controller, NES } from "jsnes";
import type { PadButton } from "../../controllers/controllerTypes";
import { bufferToBinaryString } from "../RomManager";

const NES_BUTTON: Record<PadButton, number | null> = {
  up: Controller.BUTTON_UP,
  down: Controller.BUTTON_DOWN,
  left: Controller.BUTTON_LEFT,
  right: Controller.BUTTON_RIGHT,
  a: Controller.BUTTON_A,
  b: Controller.BUTTON_B,
  start: Controller.BUTTON_START,
  select: Controller.BUTTON_SELECT,
  l: null,
  r: null,
};

export type EngineHooks = {
  onFrame: (pixels: Uint8ClampedArray, width: number, height: number) => void;
  onAudioSample?: (left: number, right: number) => void;
};

export class NesEngine {
  private nes: NES;
  private running = false;
  private raf = 0;
  readonly width = 256;
  readonly height = 240;
  readonly supportsSaveState = true;

  constructor(hooks: EngineHooks) {
    this.nes = new NES({
      onFrame: (frameBuffer) => {
        const rgba = new Uint8ClampedArray(this.width * this.height * 4);
        for (let i = 0; i < this.width * this.height; i += 1) {
          const color = frameBuffer[i] ?? 0;
          const o = i * 4;
          rgba[o] = color & 0xff;
          rgba[o + 1] = (color >> 8) & 0xff;
          rgba[o + 2] = (color >> 16) & 0xff;
          rgba[o + 3] = 255;
        }
        hooks.onFrame(rgba, this.width, this.height);
      },
      onAudioSample: hooks.onAudioSample,
    });
  }

  load(rom: ArrayBuffer): void {
    this.nes.loadROM(bufferToBinaryString(rom));
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.nes.frame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setButton(button: PadButton, pressed: boolean): void {
    const mapped = NES_BUTTON[button];
    if (mapped === null) return;
    if (pressed) this.nes.buttonDown(1, mapped);
    else this.nes.buttonUp(1, mapped);
  }

  captureState(): unknown {
    return this.nes.toJSON();
  }

  restoreState(state: unknown): void {
    this.nes.fromJSON(state);
  }
}
