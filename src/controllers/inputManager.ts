import type { KeyBinding } from "../storage/stores";
import { EMPTY_BUTTONS, type ButtonState, type InputListener, type PadButton } from "./controllerTypes";

const KEY_TO_BUTTON = (keys: KeyBinding): Record<string, PadButton> => ({
  [keys.up]: "up",
  [keys.down]: "down",
  [keys.left]: "left",
  [keys.right]: "right",
  [keys.a]: "a",
  [keys.b]: "b",
  [keys.start]: "start",
  [keys.select]: "select",
  [keys.l]: "l",
  [keys.r]: "r",
  KeyW: "up",
  KeyS: keys.r === "KeyS" ? "r" : "down",
  KeyA: keys.l === "KeyA" ? "l" : "left",
  KeyD: "right",
  Space: "a",
  Escape: "start",
});

const GAMEPAD_MAP: Record<number, PadButton> = {
  0: "a",
  1: "b",
  8: "select",
  9: "start",
  4: "l",
  5: "r",
  12: "up",
  13: "down",
  14: "left",
  15: "right",
};

export class InputManager {
  private listeners = new Set<InputListener>();
  private map: Record<string, PadButton>;
  private buttons: ButtonState = { ...EMPTY_BUTTONS };
  private gamepadIndex: number | null = null;
  private prevPad: Partial<Record<PadButton, boolean>> = {};
  private raf = 0;
  connected = false;
  padId = "";

  constructor(keys: KeyBinding) {
    this.map = KEY_TO_BUTTON(keys);
  }

  setKeys(keys: KeyBinding): void {
    this.map = KEY_TO_BUTTON(keys);
  }

  subscribe(listener: InputListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("gamepadconnected", this.onPadIn);
    window.addEventListener("gamepaddisconnected", this.onPadOut);
    this.poll();
  }

  stop(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("gamepadconnected", this.onPadIn);
    window.removeEventListener("gamepaddisconnected", this.onPadOut);
    cancelAnimationFrame(this.raf);
  }

  getState(): ButtonState {
    return { ...this.buttons };
  }

  setTouch(button: PadButton, pressed: boolean): void {
    this.emit(button, pressed, "touch");
  }

  private emit(button: PadButton, pressed: boolean, source: "keyboard" | "gamepad" | "touch"): void {
    if (this.buttons[button] === pressed) return;
    this.buttons[button] = pressed;
    for (const listener of this.listeners) listener(button, pressed, source);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const button = this.map[event.code];
    if (!button) return;
    if (event.repeat) return;
    event.preventDefault();
    this.emit(button, true, "keyboard");
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const button = this.map[event.code];
    if (!button) return;
    this.emit(button, false, "keyboard");
  };

  private onPadIn = (event: GamepadEvent): void => {
    this.gamepadIndex = event.gamepad.index;
    this.connected = true;
    this.padId = event.gamepad.id;
  };

  private onPadOut = (): void => {
    const pads = navigator.getGamepads();
    const still = pads.find((pad) => pad);
    if (still) {
      this.gamepadIndex = still.index;
      this.padId = still.id;
      this.connected = true;
      return;
    }
    this.gamepadIndex = null;
    this.connected = false;
    this.padId = "";
  };

  private poll = (): void => {
    const pads = navigator.getGamepads();
    const pad = this.gamepadIndex !== null ? pads[this.gamepadIndex] : pads.find((item) => item);
    if (pad) {
      this.connected = true;
      this.padId = pad.id;
      this.gamepadIndex = pad.index;
      const next: Partial<Record<PadButton, boolean>> = {};
      for (const [index, button] of Object.entries(GAMEPAD_MAP)) {
        next[button] = Boolean(pad.buttons[Number(index)]?.pressed);
      }
      const [lx, ly] = pad.axes;
      if (typeof lx === "number") {
        if (lx < -0.45) next.left = true;
        if (lx > 0.45) next.right = true;
      }
      if (typeof ly === "number") {
        if (ly < -0.45) next.up = true;
        if (ly > 0.45) next.down = true;
      }
      const names: PadButton[] = ["up", "down", "left", "right", "a", "b", "start", "select", "l", "r"];
      for (const name of names) {
        const pressed = Boolean(next[name]);
        if (pressed !== Boolean(this.prevPad[name])) {
          this.emit(name, pressed, "gamepad");
        }
      }
      this.prevPad = next;
    }
    this.raf = requestAnimationFrame(this.poll);
  };
}
