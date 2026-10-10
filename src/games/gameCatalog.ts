import { CATALOG_SEEDS } from "./catalogSeeds";
import type { GameCatalogEntry } from "./gameTypes";
import { EXPECTED_GAME_COUNT } from "./gameTypes";

function padIndex(index: number): string {
  return String(index).padStart(3, "0");
}

export const GAME_CATALOG: readonly GameCatalogEntry[] = CATALOG_SEEDS.map((seed, offset) => {
  const catalogIndex = offset + 1;
  return {
    id: `mr80-${padIndex(catalogIndex)}`,
    catalogIndex,
    title: seed.title,
    platform: seed.platform,
    year: seed.year,
    genres: seed.genres,
    categories: seed.categories,
    developer: seed.developer,
    publisher: seed.publisher,
    description: seed.description,
    controls: seed.controls,
    engine: seed.engine,
    romRequired: true,
    romExtensions: seed.romExtensions,
    artworkSeed: `${seed.title}:${seed.platform}:${seed.year}:${catalogIndex}`,
  };
});

export function assertExactCatalogCount(): void {
  if (GAME_CATALOG.length !== EXPECTED_GAME_COUNT) {
    throw new Error(
      `CATALOGUE INTEGRITY FAILURE: expected ${EXPECTED_GAME_COUNT} records, found ${GAME_CATALOG.length}.`,
    );
  }

  const ids = new Set(GAME_CATALOG.map((game) => game.id));
  if (ids.size !== EXPECTED_GAME_COUNT) {
    throw new Error("CATALOGUE INTEGRITY FAILURE: duplicate internal IDs detected.");
  }

  const indexes = new Set(GAME_CATALOG.map((game) => game.catalogIndex));
  if (indexes.size !== EXPECTED_GAME_COUNT) {
    throw new Error("CATALOGUE INTEGRITY FAILURE: duplicate catalogue indexes detected.");
  }
}

assertExactCatalogCount();
