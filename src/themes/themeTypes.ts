export type ThemeId =
  | "classicGreen"
  | "amberCrt"
  | "blueCrt"
  | "purpleArcade"
  | "redArcade"
  | "monochrome"
  | "gameBoy"
  | "nes"
  | "snes"
  | "sega"
  | "neonArcade"
  | "blackGold"
  | "matrix"
  | "custom";

export type ConsoleTheme = {
  id: ThemeId;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  screen: string;
  text: string;
  button: string;
  selected: string;
  danger: string;
  success: string;
  crtGlow: string;
};

export type FontStyle = "pixel" | "terminal" | "hybrid";
export type MenuLayout = "cabinet" | "rail" | "grid";
export type GameCardStyle = "cabinet" | "cart" | "marquee";
export type BackgroundPattern = "none" | "grid" | "dots" | "scan" | "carbon";
export type ButtonStyle = "arcade" | "rect" | "capsule";
export type ControllerStyle = "nes" | "genesis" | "modern";
export type CrtPreset = "off" | "low" | "medium" | "high";

export type UiSettings = {
  uiScale: number;
  pixelDensity: number;
  borderThickness: number;
  cornerRadius: number;
  crtIntensity: number;
  scanlineIntensity: number;
  screenCurvature: number;
  glowIntensity: number;
  animationIntensity: number;
  fontStyle: FontStyle;
  menuLayout: MenuLayout;
  gameCardStyle: GameCardStyle;
  backgroundPattern: BackgroundPattern;
  buttonStyle: ButtonStyle;
  controllerStyle: ControllerStyle;
  crtPreset: CrtPreset;
  brightness: number;
  contrast: number;
  saturation: number;
  vignette: boolean;
  flicker: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  uiScale: 1,
  pixelDensity: 2,
  borderThickness: 2,
  cornerRadius: 2,
  crtIntensity: 0.35,
  scanlineIntensity: 0.22,
  screenCurvature: 0.18,
  glowIntensity: 0.28,
  animationIntensity: 0.7,
  fontStyle: "hybrid",
  menuLayout: "cabinet",
  gameCardStyle: "cabinet",
  backgroundPattern: "grid",
  buttonStyle: "arcade",
  controllerStyle: "nes",
  crtPreset: "medium",
  brightness: 1,
  contrast: 1.05,
  saturation: 1,
  vignette: true,
  flicker: false,
  reducedMotion: false,
  highContrast: false,
};
