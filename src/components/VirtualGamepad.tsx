import type { PadButton } from "../controllers/controllerTypes";
import { useConsole } from "../app/ConsoleProvider";
import { ArcadeButton } from "./ui";

function PadKey({
  label,
  button,
  wide = false,
}: {
  label: string;
  button: PadButton;
  wide?: boolean;
}) {
  const { input, settings } = useConsole();
  const size = 48 * settings.touch.size;
  return (
    <button
      type="button"
      className={`virt-pad rounded-sm border border-[var(--mr-accent)] bg-[#000a] font-['Press_Start_2P'] text-[8px] ${wide ? "px-4" : ""}`}
      style={{ width: wide ? size * 1.6 : size, height: size, opacity: settings.touch.opacity }}
      onPointerDown={(event) => {
        event.preventDefault();
        input.setTouch(button, true);
      }}
      onPointerUp={() => input.setTouch(button, false)}
      onPointerLeave={() => input.setTouch(button, false)}
      onPointerCancel={() => input.setTouch(button, false)}
    >
      {label}
    </button>
  );
}

export function VirtualGamepad() {
  const { settings, setSettings } = useConsole();
  if (!settings.touch.visible) {
    return (
      <div className="pointer-events-auto absolute bottom-3 right-3">
        <ArcadeButton className="text-[14px]" onClick={() => setSettings((s) => ({ ...s, touch: { ...s.touch, visible: true } }))}>
          SHOW CONTROLS
        </ArcadeButton>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
      <div className="pointer-events-auto grid grid-cols-3 gap-1">
        <span />
        <PadKey label="▲" button="up" />
        <span />
        <PadKey label="◄" button="left" />
        <PadKey label="▼" button="down" />
        <PadKey label="►" button="right" />
      </div>
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <ArcadeButton className="text-[12px] py-1" onClick={() => setSettings((s) => ({ ...s, touch: { ...s.touch, visible: false } }))}>
            HIDE
          </ArcadeButton>
        </div>
        <div className="flex gap-2">
          <PadKey label="SEL" button="select" wide />
          <PadKey label="ST" button="start" wide />
        </div>
        <div className="flex gap-3">
          <PadKey label="B" button="b" />
          <PadKey label="A" button="a" />
        </div>
      </div>
    </div>
  );
}
