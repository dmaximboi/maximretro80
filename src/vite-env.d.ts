/// <reference types="vite/client" />

declare module "jsnes" {
  export interface NesOptions {
    onFrame: (frameBuffer: Uint32Array | number[]) => void;
    onAudioSample?: (left: number, right: number) => void;
  }

  export class NES {
    constructor(options: NesOptions);
    loadROM(romData: string): void;
    frame(): void;
    buttonDown(player: number, button: number): void;
    buttonUp(player: number, button: number): void;
    toJSON(): unknown;
    fromJSON(state: unknown): void;
  }

  export const Controller: {
    BUTTON_A: number;
    BUTTON_B: number;
    BUTTON_SELECT: number;
    BUTTON_START: number;
    BUTTON_UP: number;
    BUTTON_DOWN: number;
    BUTTON_LEFT: number;
    BUTTON_RIGHT: number;
  };
}
