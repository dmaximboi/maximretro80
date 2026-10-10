import type { GameCatalogEntry } from "../games/gameTypes";

export const BUILTIN_KINDS = ["snake", "dodge", "breakout", "invaders", "pong", "runner"] as const;
export type BuiltinKind = (typeof BUILTIN_KINDS)[number];

export type BuiltinConfig = {
  kind: BuiltinKind;
  title: string;
  speed: number;
  seed: number;
};

export function kindForCatalog(game: GameCatalogEntry): BuiltinKind {
  const tags = [...game.genres, ...game.categories].map((item) => item.toLowerCase());
  if (tags.some((tag) => tag.includes("puzzle"))) return "breakout";
  if (tags.some((tag) => tag.includes("racing") || tag.includes("flight"))) return "dodge";
  if (tags.some((tag) => tag.includes("shoot") || tag.includes("run & gun"))) return "invaders";
  if (tags.some((tag) => tag.includes("tennis") || tag.includes("sports") || tag.includes("football") || tag.includes("basket"))) {
    return "pong";
  }
  if (tags.some((tag) => tag.includes("platform") || tag.includes("adventure") || tag.includes("beat"))) return "runner";
  if (tags.some((tag) => tag.includes("fight") || tag.includes("wrestl") || tag.includes("action"))) return "dodge";
  return "snake";
}

export function configForCatalog(game: GameCatalogEntry): BuiltinConfig {
  return {
    kind: kindForCatalog(game),
    title: game.title,
    speed: 0.85 + (game.catalogIndex % 8) * 0.06,
    seed: game.catalogIndex * 97,
  };
}
