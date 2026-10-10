export type PadButton = "up" | "down" | "left" | "right" | "a" | "b" | "start" | "select" | "l" | "r";

export type ButtonState = Record<PadButton, boolean>;

export const EMPTY_BUTTONS: ButtonState = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  start: false,
  select: false,
  l: false,
  r: false,
};

export type InputListener = (button: PadButton, pressed: boolean, source: "keyboard" | "gamepad" | "touch") => void;
