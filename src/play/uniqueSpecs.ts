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

function titleOf(game: GameCatalogEntry): string {
  return game.title.toLowerCase();
}

function tagsOf(game: GameCatalogEntry): string {
  return [...game.genres, ...game.categories, game.title].join(" ").toLowerCase();
}

function modeForTitle(title: string, tags: string): UniqueMode | null {
  if (title.includes("tetris")) return "tetris";
  if (title.includes("dr. mario") || title.includes("columns") || title.includes("puyo")) return "tetris";
  if (title.includes("pac-man") || title.includes("pacman") || tags.includes("maze")) return "maze";
  if (title.includes("frogger")) return "cross";
  if (title === "donkey kong" || title.includes("donkey kong jr")) return "barrel";
  if (title.includes("zelda")) return "dungeon";
  if (title.includes("star fox") || title.includes("space harrier") || title.includes("after burner")) return "rail";
  if (title.includes("punch-out") || title.includes("street fighter") || title.includes("mortal kombat") || title.includes("tekken") || title.includes("soulcalibur") || title.includes("king of fighters") || title.includes("fatal fury") || title.includes("samurai") || title.includes("art of fighting") || title.includes("virtua fighter") || title.includes("wrestle") || title.includes("no mercy") || title.includes("wcw")) {
    return "boxer";
  }
  if (title.includes("missile command")) return "missile";
  if (title.includes("bomberman")) return "bombman";
  if (title.includes("asteroid")) return "rocks";
  if (title.includes("q*bert") || title.includes("qbert")) return "stack";
  if (title.includes("contra") || title.includes("super c") || title.includes("metal slug") || title.includes("sunset riders") || title.includes("mega man") || title.includes("metroid") || title.includes("castlevania") || title.includes("shinobi") || title.includes("shadow dancer")) {
    return "rungun";
  }
  if (title.includes("streets of rage") || title.includes("double dragon") || title.includes("final fight") || title.includes("golden axe") || title.includes("tmnt") || title.includes("turtle") || title.includes("battletoads") || title.includes("simpsons") || title.includes("x-men") || title.includes("punisher") || title.includes("captain commando") || title.includes("alien vs") || title.includes("cadillacs")) {
    return "brawler";
  }
  if (title.includes("kart") || title.includes("f-zero") || title.includes("ridge") || title.includes("out run") || title.includes("daytona") || title.includes("cruis") || title.includes("hydro") || title.includes("virtua racing") || title.includes("top gear") || title.includes("excite") || title.includes("road fighter") || title.includes("gran turismo") || title.includes("need for speed") || title.includes("wipeout") || title.includes("micro machines") || title.includes("road rash") || title.includes("crazy taxi") || title.includes("jet moto") || title.includes("spy hunter") || title.includes("twisted metal") || tags.includes("racing")) {
    return "race";
  }
  if (title.includes("fifa") || title.includes("superstar soccer") || title.includes("winning eleven") || title.includes("pro evolution") || title.includes("virtua striker") || title.includes("sensible soccer") || tags.includes("football") && !title.includes("tecmo")) {
    return "soccer";
  }
  if (title.includes("nba") || title.includes("basket")) return "hoop";
  if (title.includes("tennis") || title.includes("pong")) return "pong";
  if (title.includes("duck hunt") || title.includes("hogan") || title.includes("time crisis") || title.includes("house of the dead") || title.includes("virtua cop") || title.includes("operation wolf") || tags.includes("light gun")) {
    return "gun";
  }
  if (title.includes("raiden") || title.includes("1942") || title.includes("1943") || title.includes("1944") || title.includes("gradius") || title.includes("r-type") || title.includes("darius") || title.includes("xevious") || title.includes("twinbee") || title.includes("zero wing") || title.includes("aero fighters") || title.includes("star soldier") || title.includes("life force") || title.includes("galaga") || title.includes("galaxian") || title.includes("space invaders") || title.includes("centipede")) {
    return title.includes("r-type") || title.includes("gradius") || title.includes("darius") || title.includes("zero wing") ? "rungun" : "vert";
  }
  if (title.includes("track") || title.includes("olympic") || title.includes("california games") || title.includes("tony hawk") || title.includes("1080") || title.includes("cool boarders") || title.includes("ssx") || title.includes("golf")) {
    return "smash";
  }
  if (title.includes("doom") || title.includes("quake")) return "dungeon";
  if (title.includes("mario") || title.includes("sonic") || title.includes("kirby") || title.includes("ducktales") || title.includes("aladdin") || title.includes("lion king") || title.includes("jungle") || title.includes("hercules") || title.includes("earthworm") || title.includes("donkey kong country")) {
    return "rungun";
  }
  return null;
}

function poolFor(game: GameCatalogEntry): UniqueMode[] {
  const tags = tagsOf(game);
  const title = titleOf(game);
  const exact = modeForTitle(title, tags);
  if (exact) return [exact];
  if (tags.includes("puzzle")) return ["tetris", "memory", "bricks", "snake", "bombman"];
  if (tags.includes("shoot") || tags.includes("run & gun") || tags.includes("flight")) return ["vert", "rail", "rungun", "gun"];
  if (tags.includes("sports")) return ["soccer", "hoop", "pong", "smash"];
  if (tags.includes("platform") || tags.includes("adventure")) return ["rungun", "barrel", "dungeon", "climb"];
  if (tags.includes("fight") || tags.includes("beat")) return ["brawler", "boxer"];
  return UNIQUE_MODES.slice();
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
  const pool = poolFor(game);
  const mix = (game.catalogIndex * 13 + game.title.length * 5) % pool.length;
  const mode = pool[mix] ?? "snake";
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
