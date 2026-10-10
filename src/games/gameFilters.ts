import type { Category, LibraryGame, SortMode } from "./gameTypes";

export function normaliseQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function gameMatchesQuery(game: LibraryGame, rawQuery: string): boolean {
  const query = normaliseQuery(rawQuery);
  if (!query) return true;

  const haystack = [
    game.title,
    game.platform,
    game.year.toString(),
    game.developer,
    game.publisher,
    game.engine,
    ...game.genres,
    ...game.categories,
  ]
    .join(" ")
    .toLowerCase();

  return query.split(/\s+/).every((token) => haystack.includes(token));
}

export function filterByCategory(games: readonly LibraryGame[], category: Category | "all"): LibraryGame[] {
  if (category === "all") return [...games];
  return games.filter((game) => game.categories.includes(category));
}

export function sortGames(games: readonly LibraryGame[], mode: SortMode): LibraryGame[] {
  const next = [...games];
  switch (mode) {
    case "az":
      return next.sort((a, b) => a.title.localeCompare(b.title) || a.catalogIndex - b.catalogIndex);
    case "za":
      return next.sort((a, b) => b.title.localeCompare(a.title) || a.catalogIndex - b.catalogIndex);
    case "year":
      return next.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
    case "platform":
      return next.sort((a, b) => a.platform.localeCompare(b.platform) || a.title.localeCompare(b.title));
    case "genre":
      return next.sort((a, b) => (a.genres[0] ?? "").localeCompare(b.genres[0] ?? "") || a.title.localeCompare(b.title));
    case "mostPlayed":
      return next.sort((a, b) => b.playCount - a.playCount || a.title.localeCompare(b.title));
    case "recentlyPlayed":
      return next.sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0) || a.title.localeCompare(b.title));
    case "favourites":
      return next.sort((a, b) => Number(b.favourite) - Number(a.favourite) || a.title.localeCompare(b.title));
    default:
      return next;
  }
}

export function favouriteSort(
  games: readonly LibraryGame[],
  mode: "recentlyAdded" | "az" | "mostPlayed",
): LibraryGame[] {
  const favs = games.filter((game) => game.favourite);
  if (mode === "az") return sortGames(favs, "az");
  if (mode === "mostPlayed") return sortGames(favs, "mostPlayed");
  return favs.sort((a, b) => (b.favouriteAddedAt ?? 0) - (a.favouriteAddedAt ?? 0));
}
