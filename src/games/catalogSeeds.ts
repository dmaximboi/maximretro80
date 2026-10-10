import type { Category, EngineId, Platform } from "./gameTypes";

export type CatalogSeed = {
  mode: string;
  title: string;
  platform: Platform;
  year: number;
  genres: readonly string[];
  categories: readonly Category[];
  developer: string;
  publisher: string;
  engine: EngineId;
  romExtensions: readonly string[];
  description: string;
  controls: string;
};

const NONE = [] as const;

export const CATALOG_SEEDS: readonly CatalogSeed[] = [
  { mode: "snake", title: "SNAKE", platform: "Arcade", year: 2026, genres: ["Action"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Steer a growing snake. Eat food. Do not hit walls or yourself.", controls: "D-pad steer." },
  { mode: "bricks", title: "BREAKOUT", platform: "Arcade", year: 2026, genres: ["Arcade"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Bounce the ball and break every brick.", controls: "Left/right paddle. A launch." },
  { mode: "dodge", title: "DODGE", platform: "Arcade", year: 2026, genres: ["Action"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Slide left and right. Survive falling blocks until the goal fills.", controls: "Left/right move." },
  { mode: "coins", title: "COIN HUNT", platform: "Arcade", year: 2026, genres: ["Adventure"], categories: ["Adventure", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Walk the room, collect every coin, and avoid hunters.", controls: "D-pad walk." },
  { mode: "race", title: "RACE", platform: "Arcade", year: 2026, genres: ["Racing"], categories: ["Racing"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Four-lane box-car race. Change lanes, gas, brake, finish the track.", controls: "Left/right lane. Up gas. Down brake." },
  { mode: "climb", title: "CLIMB", platform: "Arcade", year: 2026, genres: ["Platformer"], categories: ["Platformer", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Jump platforms and reach the flag enough times to clear the stage.", controls: "Left/right. Up or A jump." },
  { mode: "cross", title: "FROGGER", platform: "Arcade", year: 2026, genres: ["Action"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Hop across traffic lanes. Reach the top several times.", controls: "D-pad hop." },
  { mode: "invaders", title: "INVADERS", platform: "Arcade", year: 2026, genres: ["Shooter"], categories: ["Arcade", "Shooter", "Shooting"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Move under a formation and shoot every invader.", controls: "Left/right. A shoot." },
  { mode: "stack", title: "STACK", platform: "Arcade", year: 2026, genres: ["Puzzle"], categories: ["Puzzle", "Arcade"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Drop the sliding bar onto the stack. Keep the tower going.", controls: "A drop." },
  { mode: "jump", title: "JUMP", platform: "Arcade", year: 2026, genres: ["Action"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Jump over incoming boxes until the goal is met.", controls: "A or Up jump." },
  { mode: "catch", title: "CATCH", platform: "Arcade", year: 2026, genres: ["Action"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Catch falling coins. Avoid bombs.", controls: "Left/right move." },
  { mode: "pong", title: "TENNIS", platform: "Arcade", year: 2026, genres: ["Sports", "Tennis"], categories: ["Sports", "Tennis"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Paddle vs paddle. Score enough points to win the set.", controls: "Up/down paddle." },
  { mode: "tetris", title: "TETRIS", platform: "Arcade", year: 2026, genres: ["Puzzle"], categories: ["Puzzle"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Rotate and drop pieces. Clear the line goal.", controls: "Left/right move. Up or A rotate. Down drop." },
  { mode: "maze", title: "MAZE", platform: "Arcade", year: 2026, genres: ["Arcade"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Eat every pellet. Avoid the hunter.", controls: "D-pad walk." },
  { mode: "flap", title: "FLAP", platform: "Arcade", year: 2026, genres: ["Action"], categories: ["Arcade", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Flap through gaps without hitting pipes.", controls: "Up or A flap." },
  { mode: "memory", title: "MEMORY", platform: "Arcade", year: 2026, genres: ["Puzzle"], categories: ["Puzzle"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Flip tiles and match every pair.", controls: "Left/right. A flip." },
  { mode: "barrel", title: "BARRELS", platform: "Arcade", year: 2026, genres: ["Platformer"], categories: ["Platformer", "Arcade"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Climb girders, jump rolling barrels, reach the top.", controls: "Left/right. Up or A jump." },
  { mode: "dungeon", title: "DUNGEON", platform: "Arcade", year: 2026, genres: ["Adventure"], categories: ["Adventure", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Collect keys, swing the sword, clear the room.", controls: "D-pad walk. A swing." },
  { mode: "rail", title: "RAIL", platform: "Arcade", year: 2026, genres: ["Shooter", "Flight"], categories: ["Shooter", "Flight"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Aim the ship on a rail and shoot incoming foes.", controls: "D-pad aim. A fire." },
  { mode: "boxer", title: "BOXER", platform: "Arcade", year: 2026, genres: ["Fighting"], categories: ["Fighting", "Sports"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Read the tell, dodge, then punch. Land enough hits.", controls: "Dodge left/right/up. A punch." },
  { mode: "missile", title: "MISSILE", platform: "Arcade", year: 2026, genres: ["Shooter", "Strategy"], categories: ["Shooter", "Strategy"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Move the cursor and burst warheads before they hit cities.", controls: "D-pad aim. A burst." },
  { mode: "bombman", title: "BOMBS", platform: "Arcade", year: 2026, genres: ["Puzzle", "Action"], categories: ["Puzzle", "Action", "Strategy"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Walk the grid, drop bombs, blast hunters.", controls: "D-pad walk. A bomb." },
  { mode: "rungun", title: "RUN GUN", platform: "Arcade", year: 2026, genres: ["Run & Gun"], categories: ["Run & Gun", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Run, jump, and shoot enough raiders to clear the stage.", controls: "Move/jump. A shoot." },
  { mode: "brawler", title: "BRAWLER", platform: "Arcade", year: 2026, genres: ["Beat 'em Up"], categories: ["Beat 'em Up", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Walk the street and punch thugs until the goal is done.", controls: "D-pad walk. A punch." },
  { mode: "rocks", title: "ROCKS", platform: "Arcade", year: 2026, genres: ["Shooter"], categories: ["Arcade", "Shooter"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Rotate, thrust, and break every rock.", controls: "Left/right rotate. Up thrust. A fire." },
  { mode: "soccer", title: "SOCCER", platform: "Arcade", year: 2026, genres: ["Sports", "Football"], categories: ["Sports", "Football"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Dribble and kick the ball into the goal enough times.", controls: "D-pad move. A kick." },
  { mode: "hoop", title: "HOOPS", platform: "Arcade", year: 2026, genres: ["Sports", "Basketball"], categories: ["Sports", "Basketball"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Line up and shoot until you hit the hoop goal.", controls: "Left/right. A shoot." },
  { mode: "gun", title: "ZAPPER", platform: "Arcade", year: 2026, genres: ["Shooter"], categories: ["Shooting", "Arcade"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Move the sight and hit the right targets.", controls: "D-pad sight. A fire." },
  { mode: "vert", title: "VERT SHMUP", platform: "Arcade", year: 2026, genres: ["Shooter"], categories: ["Shooter", "Shooting"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Fly a vertical shooter and clear the wave.", controls: "D-pad move. A shoot." },
  { mode: "smash", title: "TRACK", platform: "Arcade", year: 2026, genres: ["Sports"], categories: ["Sports", "Action"], developer: "MAXIM RETRO", publisher: "MAXIM RETRO", engine: "arcade", romExtensions: NONE, description: "Mash A to run. Jump the bars. Beat the distance.", controls: "A run. Up or B jump." },
];
