import type { KeyboardEvent } from "react";
import type { LibraryGame } from "../games/gameTypes";
import { specForGame } from "../play/uniqueSpecs";
import { GameArt } from "./GameArt";
import { ArcadeButton, StatusBadge } from "./ui";

export function GameCard({
  game,
  selected,
  onOpen,
  onFavourite,
  compact = false,
}: {
  game: LibraryGame;
  selected?: boolean;
  onOpen: () => void;
  onFavourite: () => void;
  compact?: boolean;
}) {
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      className={`game-card ${selected ? "is-selected" : ""} ${compact ? "p-2" : "p-2"}`}
    >
      <GameArt game={game} className={compact ? "aspect-[4/3]" : "aspect-[4/3]"} />
      <div className="mt-2 min-w-0">
        <div className="truncate font-['Press_Start_2P'] text-[8px] leading-4">{game.title}</div>
        <div className="mt-1 flex flex-wrap gap-x-2 text-[15px] opacity-80">
          <span>{game.year}</span>
          <span>{game.platform}</span>
          <span>{game.genres[0]}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusBadge tone="ok" label={specForGame(game).modeLabel} />
          <ArcadeButton
            className="px-2 py-1 text-[16px]"
            onClick={(event) => {
              event.stopPropagation();
              onFavourite();
            }}
            aria-label={game.favourite ? "Remove favourite" : "Add favourite"}
          >
            {game.favourite ? "★" : "☆"}
          </ArcadeButton>
        </div>
      </div>
    </div>
  );
}
