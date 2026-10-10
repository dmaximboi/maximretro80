import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PixelTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`pixel-title ${className}`}>{children}</h1>;
}

export function PixelLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`pixel-label ${className}`}>{children}</div>;
}

export function ArcadePanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`arcade-panel ${className}`}>{children}</section>;
}

export function ArcadeButton({
  children,
  className = "",
  active = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button type="button" className={`arcade-btn ${active ? "is-active" : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function StatusBadge({
  tone,
  label,
}: {
  tone: "ok" | "warn" | "info";
  label: string;
}) {
  const color = tone === "ok" ? "var(--mr-success)" : tone === "warn" ? "var(--mr-danger)" : "var(--mr-accent)";
  return (
    <span className="inline-flex items-center gap-2 pixel-label">
      <span className="status-dot inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <ArcadePanel className="p-6 text-center">
      <PixelLabel className="mb-3 text-[var(--mr-accent)]">{title}</PixelLabel>
      <p className="opacity-80">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </ArcadePanel>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="arcade-panel p-3" style={{ borderColor: "var(--mr-danger)" }}>
      <PixelLabel className="mb-1 text-[var(--mr-danger)]">ERROR</PixelLabel>
      <p>{message}</p>
    </div>
  );
}

export function LoadingState({ label = "BOOTING CABINET..." }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="text-center">
        <PixelTitle className="mb-4">{label}</PixelTitle>
        <div className="mx-auto h-2 w-48 overflow-hidden border border-[var(--mr-accent)]">
          <div className="h-full w-1/2 animate-pulse bg-[var(--mr-accent)]" />
        </div>
      </div>
    </div>
  );
}
