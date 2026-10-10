import type { ReactNode } from "react";
import { useConsole } from "../app/ConsoleProvider";

export function CrtBezel({
  children,
  className = "",
  showChrome = true,
}: {
  children: ReactNode;
  className?: string;
  showChrome?: boolean;
}) {
  const { settings } = useConsole();
  const ui = settings.ui;
  return (
    <div className={`crt-bezel ${className}`}>
      {showChrome ? (
        <div className="flex items-center justify-between px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--mr-accent)]">
          <span>MAXIM RETRO</span>
          <span>CRT //{ui.crtPreset.toUpperCase()}</span>
        </div>
      ) : null}
      <div className="crt-screen min-h-[160px]">
        {children}
        <div className="crt-glass" />
        <div className="crt-curve" />
        {ui.vignette ? <div className="crt-vignette" /> : null}
        {ui.flicker && ui.crtPreset !== "off" ? <div className="crt-flicker" /> : null}
      </div>
    </div>
  );
}
