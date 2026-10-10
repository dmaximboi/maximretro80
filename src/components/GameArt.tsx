import { useMemo } from "react";
import type { LibraryGame } from "../games/gameTypes";

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function GameArt({ game, className = "" }: { game: LibraryGame; className?: string }) {
  const art = useMemo(() => {
    const h = hashSeed(game.artworkSeed);
    const hues = [120, 38, 205, 280, 0, 190, 90];
    const hue = hues[h % hues.length] ?? 120;
    const cells = Array.from({ length: 64 }, (_, i) => ((h >>> (i % 24)) ^ (i * 17 + game.catalogIndex)) & 3);
    return { hue, cells };
  }, [game.artworkSeed, game.catalogIndex]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `hsl(${art.hue} 30% 8%)` }}>
      <div
        className="absolute inset-0 grid grid-cols-8 grid-rows-8"
        style={{ imageRendering: "pixelated" }}
      >
        {art.cells.map((cell, i) => (
          <div
            key={`${game.id}-${i}`}
            style={{
              background:
                cell === 0
                  ? "transparent"
                  : cell === 1
                    ? `hsl(${art.hue} 70% 42%)`
                    : cell === 2
                      ? `hsl(${(art.hue + 40) % 360} 55% 28%)`
                      : "#0008",
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-[#0009] px-1 py-0.5 text-center font-['Press_Start_2P'] text-[7px] leading-3">
        {game.platform}
      </div>
    </div>
  );
}
