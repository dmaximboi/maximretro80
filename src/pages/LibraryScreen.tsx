import { useMemo, useRef } from "react";
import { useConsole } from "../app/ConsoleProvider";
import { GameCard } from "../components/GameCard";
import { ArcadeButton, ArcadePanel, EmptyState, PixelLabel } from "../components/ui";
import { CATEGORIES, type LibraryViewMode, type SortMode } from "../games/gameTypes";
import { favouriteSort, filterByCategory, gameMatchesQuery, sortGames } from "../games/gameFilters";
import type { Category, LibraryGame } from "../games/gameTypes";

const SORTS: { id: SortMode; label: string }[] = [
  { id: "az", label: "A-Z" },
  { id: "za", label: "Z-A" },
  { id: "year", label: "YEAR" },
  { id: "platform", label: "PLATFORM" },
  { id: "genre", label: "GENRE" },
  { id: "mostPlayed", label: "MOST PLAYED" },
  { id: "recentlyPlayed", label: "RECENT" },
  { id: "favourites", label: "FAVOURITES" },
];

const VIEWS: { id: LibraryViewMode; label: string }[] = [
  { id: "grid", label: "GRID" },
  { id: "list", label: "LIST" },
  { id: "carousel", label: "CAROUSEL" },
  { id: "arcade", label: "ARCADE WALL" },
];

export function LibraryScreen({ mode = "library" }: { mode?: "library" | "favourites" | "recent" | "search" | "categories" }) {
  const {
    games,
    query,
    setQuery,
    category,
    setCategory,
    settings,
    setLibraryView,
    setSortMode,
    selectGame,
    setView,
    toggleFavourite,
  } = useConsole();

  const open = (game: LibraryGame) => {
    selectGame(game.id);
    setView("play");
  };

  const filtered = useMemo(() => {
    let list = games.filter((game) => gameMatchesQuery(game, query));
    if (mode === "favourites") list = favouriteSort(list, "recentlyAdded");
    else if (mode === "recent") list = sortGames(list.filter((g) => g.lastPlayed), "recentlyPlayed").slice(0, 40);
    else if (mode === "categories") list = filterByCategory(list, category as Category | "all");
    else list = sortGames(list, settings.sortMode);
    return list;
  }, [games, query, mode, category, settings.sortMode]);

  return (
    <div className="grid gap-3">
      <ArcadePanel className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <PixelLabel className="mb-1">SEARCH</PixelLabel>
            <input
              type="search"
              value={query}
              placeholder="MAR — Mario Kart, Mario Tennis..."
              onChange={(event) => setQuery(event.target.value)}
              className="w-full"
            />
          </div>
          {mode === "categories" ? (
            <div>
              <PixelLabel className="mb-1">CATEGORY</PixelLabel>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">ALL</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {mode === "library" ? (
            <div>
              <PixelLabel className="mb-1">SORT</PixelLabel>
              <select value={settings.sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                {SORTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1">
            {VIEWS.map((item) => (
              <ArcadeButton key={item.id} active={settings.libraryView === item.id} onClick={() => setLibraryView(item.id)}>
                {item.label}
              </ArcadeButton>
            ))}
          </div>
        </div>
        <div className="mt-2 text-[15px] opacity-70">{filtered.length} TITLES</div>
      </ArcadePanel>

      {filtered.length === 0 ? (
        <EmptyState
          title={mode === "favourites" ? "NO FAVOURITES" : mode === "recent" ? "NO RECENT SESSIONS" : "NO MATCHES"}
          body={mode === "favourites" ? "Mark games with the star to build this list." : "Try another search token or category."}
        />
      ) : (
        <LibraryResults games={filtered} view={settings.libraryView} onOpen={open} onFavourite={(id) => void toggleFavourite(id)} />
      )}
    </div>
  );
}

function LibraryResults({
  games,
  view,
  onOpen,
  onFavourite,
}: {
  games: LibraryGame[];
  view: LibraryViewMode;
  onOpen: (game: LibraryGame) => void;
  onFavourite: (id: string) => void;
}) {
  if (view === "list") {
    return (
      <ArcadePanel className="divide-y divide-black overflow-hidden">
        {games.map((game) => (
          <button
            key={game.id}
            type="button"
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#0004]"
            onClick={() => onOpen(game)}
          >
            <span className="w-10 opacity-50">{String(game.catalogIndex).padStart(3, "0")}</span>
            <span className="flex-1 truncate">{game.title}</span>
            <span className="hidden sm:inline">{game.year}</span>
            <span className="hidden md:inline">{game.platform}</span>
            <span className="hidden lg:inline">{game.genres[0]}</span>
            <span>{game.romInstalled ? "●" : "○"}</span>
            <span>{game.favourite ? "★" : "☆"}</span>
          </button>
        ))}
      </ArcadePanel>
    );
  }

  if (view === "carousel") {
    return (
      <div className="flex gap-3 overflow-x-auto pb-3">
        {games.map((game) => (
          <div key={game.id} className="w-[220px] shrink-0">
            <GameCard game={game} onOpen={() => onOpen(game)} onFavourite={() => onFavourite(game.id)} />
          </div>
        ))}
      </div>
    );
  }

  return <VirtualGrid games={games} arcade={view === "arcade"} onOpen={onOpen} onFavourite={onFavourite} />;
}

function VirtualGrid({
  games,
  arcade,
  onOpen,
  onFavourite,
}: {
  games: LibraryGame[];
  arcade: boolean;
  onOpen: (game: LibraryGame) => void;
  onFavourite: (id: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const columns = arcade ? 2 : 1;
  const cardHeight = arcade ? 280 : 260;
  const pageSize = 36;
  const pages = Math.ceil(games.length / pageSize) || 1;

  return (
    <div ref={scroller} className="grid gap-3">
      {Array.from({ length: pages }, (_, page) => {
        const slice = games.slice(page * pageSize, page * pageSize + pageSize);
        return (
          <div
            key={page}
            className={`grid gap-3 ${arcade ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}
            style={{ minHeight: Math.ceil(slice.length / Math.max(columns, 2)) * (cardHeight / 2) }}
          >
            {slice.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                compact={arcade}
                onOpen={() => onOpen(game)}
                onFavourite={() => onFavourite(game.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
