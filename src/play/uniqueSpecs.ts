import { GAME_CATALOG } from "../games/gameCatalog";
import type { GameCatalogEntry } from "../games/gameTypes";

export const UNIQUE_MODES = [
  "snake",
  "bricks",
  "dodge",
  "coins",
  "race",
  "climb",
  "cross",
  "invaders",
  "stack",
  "jump",
  "catch",
  "pong",
  "tetris",
  "maze",
  "flap",
  "memory",
  "barrel",
  "dungeon",
  "rail",
  "boxer",
  "missile",
  "bombman",
  "rungun",
  "brawler",
  "rocks",
  "soccer",
  "hoop",
  "gun",
  "vert",
  "smash",
] as const;

export type UniqueMode = (typeof UNIQUE_MODES)[number];
export type Difficulty = "simple" | "medium" | "hard" | "professor";

const TWISTS = ["NIGHT", "RAIN", "ICE", "NEON", "DUST", "FOG", "HEAT", "STORM"] as const;

export type UniqueSpec = {
  id: string;
  title: string;
  mode: UniqueMode;
  modeLabel: string;
  edition: string;
  scene: number;
  lanes: number;
  twist: string;
  howTo: string[];
};

export const MODE_LABEL: Record<UniqueMode, string> = {
  snake: "SNAKE",
  bricks: "BREAKOUT",
  dodge: "DODGE",
  coins: "COIN HUNT",
  race: "RACE",
  climb: "CLIMB",
  cross: "FROGGER",
  invaders: "INVADERS",
  stack: "STACK",
  jump: "JUMP",
  catch: "CATCH",
  pong: "TENNIS",
  tetris: "TETRIS",
  maze: "MAZE",
  flap: "FLAP",
  memory: "MEMORY",
  barrel: "BARRELS",
  dungeon: "DUNGEON",
  rail: "RAIL",
  boxer: "BOXER",
  missile: "MISSILE",
  bombman: "BOMBS",
  rungun: "RUN GUN",
  brawler: "BRAWLER",
  rocks: "ROCKS",
  soccer: "SOCCER",
  hoop: "HOOPS",
  gun: "ZAPPER",
  vert: "VERT SHMUP",
  smash: "TRACK",
};

export const HOW_TO: Record<UniqueMode, string[]> = {
  snake: ["D-pad steers the snake.", "Eat food to grow.", "Do not hit walls or yourself."],
  bricks: ["Left and right move the paddle.", "A launches the ball.", "Break every brick."],
  dodge: ["Left and right move you.", "Avoid falling blocks."],
  coins: ["D-pad walks.", "Collect every coin. Avoid hunters."],
  race: ["Four lanes. Left and right change lanes.", "Up gas. Down brake.", "Boxes are cars. Reach 100% without crashing."],
  climb: ["Left and right move. Up or A jumps.", "Climb to the flag."],
  cross: ["Hop with the D-pad.", "Avoid cars. Reach the top like Frogger."],
  invaders: ["Left and right move. A shoots.", "Clear the formation."],
  stack: ["Press A to drop the sliding bar."],
  jump: ["A or Up jumps over boxes."],
  catch: ["Catch coins. Avoid bombs."],
  pong: ["Up and down move the paddle.", "Score to clear the set."],
  tetris: ["Left and right move.", "Up or A rotates. Down drops.", "Clear the line GOAL."],
  maze: ["Walk the maze. Eat pellets. Avoid the hunter."],
  flap: ["Up or A flaps through gaps."],
  memory: ["Left and right move. A flips pairs."],
  barrel: ["Climb girders. Jump barrels.", "Reach the top like Donkey Kong."],
  dungeon: ["Walk the room. A swings the sword.", "Collect keys and exit."],
  rail: ["D-pad aims the ship. A fires.", "Survive the rail corridor."],
  boxer: ["Dodge left, right, or up on the tell.", "A punches. Land enough hits."],
  missile: ["Move the cursor. A bursts.", "Stop the warheads before they hit cities."],
  bombman: ["Walk the grid. A drops a bomb.", "Blast walls and hunters."],
  rungun: ["Move and jump. A shoots forward.", "Reach the end of the raid."],
  brawler: ["Walk the street. A punches.", "Clear thugs and reach the exit."],
  rocks: ["Left/right rotate. Up thrusts. A fires.", "Break every rock."],
  soccer: ["D-pad moves the striker.", "A kicks at the goal."],
  hoop: ["Left and right set the shot.", "A shoots for the hoop."],
  gun: ["Move the sight. A fires.", "Hit targets, spare the rest."],
  vert: ["Move the ship. A shoots up.", "Clear the wave."],
  smash: ["Mash A to run. Up or B jumps the bar.", "Beat the distance GOAL."],
};

export const DIFFICULTY_SCALE: Record<Difficulty, { speed: number; size: number; lives: number; label: string }> = {
  simple: { speed: 0.7, size: 1.3, lives: 5, label: "SIMPLE" },
  medium: { speed: 0.95, size: 1, lives: 3, label: "MEDIUM" },
  hard: { speed: 1.2, size: 0.9, lives: 2, label: "HARD" },
  professor: { speed: 1.45, size: 0.8, lives: 1, label: "PROFESSOR" },
};

function modeOf(game: GameCatalogEntry): UniqueMode {
  return (UNIQUE_MODES as readonly string[]).includes(game.mode) ? (game.mode as UniqueMode) : "dodge";
}

function editionFor(mode: UniqueMode, scene: number): string {
  const n = String(((scene * 17) % 48) + 1).padStart(2, "0");
  if (mode === "race") return `TRACK ${n}`;
  if (mode === "tetris") return `WELL ${n}`;
  if (mode === "bricks") return `WALL ${n}`;
  if (mode === "climb" || mode === "barrel") return `TOWER ${n}`;
  if (mode === "invaders" || mode === "vert") return `WAVE ${n}`;
  if (mode === "maze") return `LAB ${n}`;
  if (mode === "dungeon") return `CRYPT ${n}`;
  if (mode === "boxer") return `BOUT ${n}`;
  return `STAGE ${n}`;
}

export function specForGame(game: GameCatalogEntry): UniqueSpec {
  const mode = modeOf(game);
  const twist = TWISTS[game.catalogIndex % TWISTS.length] ?? "NIGHT";
  return {
    id: game.id,
    title: game.title,
    mode,
    modeLabel: MODE_LABEL[mode],
    edition: `${editionFor(mode, game.catalogIndex)} ${twist}`,
    scene: game.catalogIndex,
    lanes: mode === "race" ? 4 : 3 + (game.catalogIndex % 2),
    twist,
    howTo: HOW_TO[mode],
  };
}

export const UNIQUE_SPECS: readonly UniqueSpec[] = GAME_CATALOG.map(specForGame);

export function specFromMode(mode: UniqueMode, title: string): UniqueSpec {
  return {
    id: `mode-${mode}`,
    title,
    mode,
    modeLabel: MODE_LABEL[mode],
    edition: `${editionFor(mode, 1)} NEON`,
    scene: 1,
    lanes: mode === "race" ? 4 : 3,
    twist: "NEON",
    howTo: HOW_TO[mode],
  };
}

export function rankFor(score: number, par: number, hits: number): "PERFECT" | "S" | "A" | "B" | "C" {
  if (hits === 0 && score >= par) return "PERFECT";
  const ratio = score / Math.max(1, par);
  if (ratio >= 1.2) return "S";
  if (ratio >= 1) return "A";
  if (ratio >= 0.7) return "B";
  return "C";
}
