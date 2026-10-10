import { DEFAULT_UI_SETTINGS, type ConsoleTheme, type ThemeId, type UiSettings } from "./themeTypes";
import { THEME_PRESETS } from "./themePresets";

export function resolveTheme(id: ThemeId, custom: ConsoleTheme): ConsoleTheme {
  if (id === "custom") return { ...custom, id: "custom", name: "Custom" };
  return THEME_PRESETS[id];
}

export function applyThemeToDocument(theme: ConsoleTheme, ui: UiSettings): void {
  const root = document.documentElement;
  root.style.setProperty("--mr-primary", theme.primary);
  root.style.setProperty("--mr-secondary", theme.secondary);
  root.style.setProperty("--mr-accent", theme.accent);
  root.style.setProperty("--mr-bg", theme.background);
  root.style.setProperty("--mr-screen", theme.screen);
  root.style.setProperty("--mr-text", theme.text);
  root.style.setProperty("--mr-button", theme.button);
  root.style.setProperty("--mr-selected", theme.selected);
  root.style.setProperty("--mr-danger", theme.danger);
  root.style.setProperty("--mr-success", theme.success);
  root.style.setProperty("--mr-glow", theme.crtGlow);
  root.style.setProperty("--mr-scale", String(ui.uiScale));
  root.style.setProperty("--mr-pixel", String(ui.pixelDensity));
  root.style.setProperty("--mr-border", `${ui.borderThickness}px`);
  root.style.setProperty("--mr-radius", `${ui.cornerRadius}px`);
  root.style.setProperty("--mr-crt", String(ui.crtIntensity));
  root.style.setProperty("--mr-scan", String(ui.scanlineIntensity));
  root.style.setProperty("--mr-curve", String(ui.screenCurvature));
  root.style.setProperty("--mr-glow-i", String(ui.glowIntensity));
  root.style.setProperty("--mr-anim", ui.reducedMotion ? "0" : String(ui.animationIntensity));
  root.style.setProperty("--mr-bright", String(ui.brightness));
  root.style.setProperty("--mr-contrast", String(ui.contrast));
  root.style.setProperty("--mr-sat", String(ui.saturation));
  root.dataset.font = ui.fontStyle;
  root.dataset.pattern = ui.backgroundPattern;
  root.dataset.card = ui.gameCardStyle;
  root.dataset.button = ui.buttonStyle;
  root.dataset.contrast = ui.highContrast ? "high" : "normal";
  root.dataset.motion = ui.reducedMotion ? "reduce" : "full";
}

export function applyCrtPreset(preset: UiSettings["crtPreset"], current: UiSettings): UiSettings {
  if (preset === "off") {
    return { ...current, crtPreset: preset, crtIntensity: 0, scanlineIntensity: 0, screenCurvature: 0, glowIntensity: 0, flicker: false };
  }
  if (preset === "low") {
    return { ...current, crtPreset: preset, crtIntensity: 0.18, scanlineIntensity: 0.1, screenCurvature: 0.08, glowIntensity: 0.12 };
  }
  if (preset === "high") {
    return { ...current, crtPreset: preset, crtIntensity: 0.55, scanlineIntensity: 0.32, screenCurvature: 0.28, glowIntensity: 0.42 };
  }
  return { ...current, crtPreset: preset, crtIntensity: 0.35, scanlineIntensity: 0.22, screenCurvature: 0.18, glowIntensity: 0.28 };
}

export { DEFAULT_UI_SETTINGS };
