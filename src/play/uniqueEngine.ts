import type { SfxKind } from "./sfx";
import { DIFFICULTY_SCALE, rankFor, type Difficulty, type UniqueSpec } from "./uniqueSpecs";

export type GameHooks = {
  onScore: (score: number) => void;
  onStatus: (status: string) => void;
  onHud: (info: { level: number; lives: number; progress: number; place: number; goal: string }) => void;
  onLevelClear: (info: { level: number; rank: string; score: number }) => void;
  onOver: () => void;
  onSfx: (kind: SfxKind) => void;
};

export type PlayableGame = {
  start: () => void;
  stop: () => void;
  restart: () => void;
  pause: () => void;
  resume: () => void;
  press: (code: string, down: boolean) => void;
};

type Rect = { x: number; y: number; w: number; h: number; mark?: number };

function pace(level: number): number {
  return 1 + Math.max(0, level - 1) * 0.22;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function hits(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function stageNeed(level: number, start: number, grow: number): number {
  const lv = Math.max(1, level);
  const base = start + (lv - 1) * grow + (lv * lv - 1) * grow * 0.32;
  return Math.max(1, Math.round(base * 2.5));
}

function seedRng(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createUniqueGame(
  canvas: HTMLCanvasElement,
  spec: UniqueSpec,
  difficulty: Difficulty,
  hooks: GameHooks,
): PlayableGame {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable.");
  const W = 360;
  const H = 280;
  canvas.width = W;
  canvas.height = H;

  const keys = new Set<string>();
  const scale = DIFFICULTY_SCALE[difficulty];
  let raf = 0;
  let running = false;
  let paused = false;
  let over = false;
  let score = 0;
  let level = 1;
  let lives = scale.lives;
  let hitsTaken = 0;
  let acc = 0;
  let last = 0;
  let tick = 0;
  let objective = 0;
  let target = 8;
  let waveSize = 1;
  let launched = false;
  let dropLock = false;
  let progress = 0;
  let place = 1;
  let goalText = "GOAL";
  let playerLane = 1;
  let carSpeed = 1.6;
  let distance = 0;
  let trackLen = 1200;
  let holdL = false;
  let holdR = false;
  let rotateLatch = false;
  let flapLatch = false;
  const rivals: Array<{ lane: number; y: number; spd: number; dist: number }> = [];
  const COLS = 10;
  const ROWS = 16;
  let board: number[][] = [];
  let piece: { cells: Array<{ x: number; y: number }>; x: number; y: number } | null = null;
  let dropTimer = 0;
  let linesCleared = 0;
  const MW = 20;
  const MH = 13;
  let maze: number[][] = [];
  const pellets: Array<{ x: number; y: number }> = [];
  const tiles: Array<{ v: number; open: boolean; done: boolean }> = [];
  let cursor = 0;
  let pickA = -1;
  let pickB = -1;
  let pickLock = 0;
  let angle = 0;
  let tell = 0;
  let bombT = 0;
  const bBtn = () => keys.has("KeyX");

  const player = { x: 150, y: 180, w: 16, h: 14, vx: 0, vy: 0 };
  const ball = { x: 160, y: 120, vx: 2, vy: -2 };
  const items: Rect[] = [];
  const foes: Array<Rect & { vx: number; vy: number; kind: number }> = [];
  const body: Array<{ x: number; y: number }> = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 10, y: 6 };
  let stackX = 80;
  let stackDir = 2.4;
  let stackY = 196;
  let stackW = 90;

  const GREEN = "#3cff6e";
  const LIME = "#9fff7a";
  const RED = "#ff5a4a";

  const setScore = (value: number) => {
    score = value;
    hooks.onScore(score);
  };

  const hud = () => hooks.onHud({ level, lives, progress, place, goal: goalText });

  const fail = () => {
    hooks.onSfx("fail");
    hitsTaken += 1;
    lives -= 1;
    hud();
    if (lives <= 0) {
      over = true;
      running = false;
      hooks.onStatus("GAME OVER");
      hooks.onOver();
      return;
    }
    hooks.onStatus("TRY AGAIN");
    setupLevel();
  };

  const clearLevel = () => {
    const par = target * 10;
    const rank = rankFor(score, par * level, hitsTaken);
    hooks.onSfx("success");
    hooks.onSfx("level");
    level += 1;
    hooks.onLevelClear({ level, rank, score });
    setupLevel();
    hooks.onStatus("LEVEL " + String(level).padStart(2, "0"));
  };

  const left = () => keys.has("ArrowLeft") || keys.has("KeyA");
  const right = () => keys.has("ArrowRight") || keys.has("KeyD");
  const up = () => keys.has("ArrowUp") || keys.has("KeyW");
  const down = () => keys.has("ArrowDown") || keys.has("KeyS");
  const action = () => keys.has("KeyZ") || keys.has("Space");

  const SHAPES = [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  ];

  const collide = (cells: Array<{ x: number; y: number }>, ox: number, oy: number): boolean => {
    return cells.some((cell) => {
      const x = ox + cell.x;
      const y = oy + cell.y;
      return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y]?.[x] === 1);
    });
  };

  const spawnPiece = () => {
    const cells = SHAPES[Math.floor(Math.random() * SHAPES.length)] ?? [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }];
    piece = { cells: cells.map((cell) => ({ ...cell })), x: 3, y: 0 };
    if (piece && collide(piece.cells, piece.x, piece.y)) fail();
  };

  const rotatePiece = () => {
    if (!piece) return;
    const rotated = piece.cells.map((cell) => ({ x: -cell.y, y: cell.x }));
    const minX = Math.min(...rotated.map((cell) => cell.x));
    const normalized = rotated.map((cell) => ({ x: cell.x - minX, y: cell.y }));
    if (!collide(normalized, piece.x, piece.y)) piece.cells = normalized;
  };

  const fillBricks = () => {
    items.length = 0;
    const cols = 7 + (level % 3);
    const rows = 5 + Math.min(6, level + 1);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if ((c + r + spec.scene + level + objective) % 7 === 0) continue;
        items.push({ x: 10 + c * ((W - 20) / cols), y: 18 + r * 14, w: (W - 20) / cols - 4, h: 10 });
      }
    }
    waveSize = Math.max(1, items.length);
  };

  const fillInvaders = () => {
    foes.length = 0;
    const spd = scale.speed * pace(level);
    const cols = 6 + Math.min(4, level);
    const rows = 3 + Math.min(4, level);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        foes.push({ x: 24 + c * 34, y: 18 + r * 18, w: 16, h: 10, vx: 0.55 * spd, vy: 0, kind: 0 });
      }
    }
    waveSize = Math.max(1, foes.length);
  };

  const setupLevel = () => {
    const rnd = seedRng(spec.scene * 97 + level * 13);
    items.length = 0;
    foes.length = 0;
    body.length = 0;
    launched = false;
    dropLock = false;
    tick = 0;
    objective = 0;
    player.vx = 0;
    player.vy = 0;
    const spd = scale.speed * pace(level);
    target = stageNeed(level, 24, 16);
    player.w = Math.round(14 * scale.size);
    player.h = Math.round(12 * scale.size);

    if (spec.mode === "snake") {
      body.push({ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 });
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      food = { x: 3 + Math.floor(rnd() * 14), y: 2 + Math.floor(rnd() * 10) };
      target = stageNeed(level, 18, 12);
    }
    if (spec.mode === "bricks") {
      player.x = 130;
      player.y = 200;
      player.w = Math.round(56 * scale.size);
      player.h = 8;
      ball.x = 160;
      ball.y = 170;
      ball.vx = 2 * spd;
      ball.vy = -2.2 * spd;
      fillBricks();
      target = stageNeed(level, 2, 1);
    }
    if (spec.mode === "dodge" || spec.mode === "catch") {
      player.x = 150;
      player.y = 196;
      target = spec.mode === "dodge" ? stageNeed(level, 42, 26) : stageNeed(level, 24, 16);
    }
    if (spec.mode === "coins") {
      player.x = 20;
      player.y = 180;
      for (let i = 0; i < stageNeed(level, 16, 10); i += 1) {
        items.push({ x: 16 + rnd() * 280, y: 16 + rnd() * 170, w: 10, h: 10 });
      }
      for (let i = 0; i < Math.min(1 + Math.floor(level / 2), 3); i += 1) {
        foes.push({ x: 80 + rnd() * 160, y: 20 + rnd() * 80, w: 12, h: 12, vx: (rnd() > 0.5 ? 1 : -1) * 0.7 * spd, vy: 0, kind: 0 });
      }
    }
    if (spec.mode === "race") {
      playerLane = 1;
      carSpeed = 1.4 * scale.speed * pace(level);
      distance = 0;
      trackLen = stageNeed(level, 16000, 10000) + (spec.scene % 7) * 280;
      progress = 0;
      place = 3;
      goalText = "0%";
      rivals.length = 0;
      const count = 3 + Math.min(5, level);
      for (let i = 0; i < count; i += 1) {
        rivals.push({
          lane: i % 4,
          y: 20 + i * 36,
          spd: (0.85 + rnd() * 1.25 + (spec.twist === "HEAT" ? 0.3 : 0)) * pace(level),
          dist: 90 + i * 130 + (spec.scene % 50),
        });
      }
    }
    if (spec.mode === "tetris") {
      board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));
      linesCleared = 0;
      dropTimer = 0;
      target = stageNeed(level, 24, 16);
      goalText = `0/${target}`;
      progress = 0;
      spawnPiece();
    }
    if (spec.mode === "climb") {
      player.x = 40;
      player.y = 168;
      player.w = Math.round(12 * scale.size);
      player.h = 14;
      target = stageNeed(level, 3, 2);
      const plats = 10 + Math.min(6, level);
      for (let i = 0; i < plats; i += 1) {
        const w = 50 + (i % 3) * 10;
        items.push({ x: 16 + ((i * 53 + spec.scene * 11 + level * 7) % (W - w - 20)), y: 196 - i * (168 / plats), w, h: 8 });
      }
      items.push({ x: 140, y: 10, w: 36, h: 10 });
      player.x = items[0]?.x ?? 40;
      player.y = (items[0]?.y ?? 180) - 16;
    }
    if (spec.mode === "cross") {
      player.x = 152;
      player.y = 198;
      player.w = Math.round(12 * scale.size);
      player.h = 12;
      target = stageNeed(level, 3, 2);
      for (let lane = 0; lane < 5; lane += 1) {
        const count = difficulty === "simple" ? 1 : 1 + (lane % 2);
        for (let i = 0; i < count; i += 1) {
          foes.push({
            x: rnd() * W,
            y: 34 + lane * 30,
            w: 26,
            h: 14,
            vx: (lane % 2 ? 1 : -1) * (0.8 + lane * 0.15) * spd,
            vy: 0,
            kind: 0,
          });
        }
      }
    }
    if (spec.mode === "invaders") {
      player.x = 148;
      player.y = 200;
      player.w = 18;
      player.h = 8;
      fillInvaders();
      target = stageNeed(level, 2, 1);
    }
    if (spec.mode === "stack") {
      stackX = 40;
      stackDir = 2.2 * scale.speed;
      stackY = 196;
      stackW = 100 * scale.size;
      items.length = 0;
      items.push({ x: 110, y: 206, w: 100, h: 10 });
      target = stageNeed(level, 14, 8);
    }
    if (spec.mode === "jump") {
      player.x = 36;
      player.y = 168;
      player.w = Math.round(14 * scale.size);
      player.h = 16;
      target = stageNeed(level, 22, 14);
    }
    if (spec.mode === "maze") {
      maze = Array.from({ length: MH }, (_, y) =>
        Array.from({ length: MW }, (_, x) => {
          if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) return 1;
          if (x === 1 && y === 1) return 0;
          return (x * 7 + y * 11 + spec.scene + level) % 5 === 0 ? 1 : 0;
        }),
      );
      pellets.length = 0;
      for (let y = 1; y < MH - 1; y += 1) {
        for (let x = 1; x < MW - 1; x += 1) {
          if (maze[y]?.[x] === 0 && !(x === 1 && y === 1)) pellets.push({ x, y });
        }
      }
      player.x = 1;
      player.y = 1;
      foes.length = 0;
      foes.push({ x: MW - 2, y: MH - 2, w: 1, h: 1, vx: 0, vy: 0, kind: 0 });
      target = pellets.length;
    }
    if (spec.mode === "flap") {
      player.x = 70;
      player.y = 110;
      player.w = 14;
      player.h = 12;
      player.vy = 0;
      target = stageNeed(level, 18, 12);
    }
    if (spec.mode === "memory") {
      tiles.length = 0;
      const pairs = Math.min(8, 4 + level);
      const bag: number[] = [];
      for (let i = 0; i < pairs; i += 1) bag.push(i, i);
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rnd() * (i + 1));
        const a = bag[i] ?? 0;
        bag[i] = bag[j] ?? 0;
        bag[j] = a;
      }
      for (const v of bag) tiles.push({ v, open: false, done: false });
      cursor = 0;
      pickA = -1;
      pickB = -1;
      pickLock = 0;
      target = pairs;
    }
    if (spec.mode === "pong") {
      player.x = 10;
      player.y = 90;
      player.w = 6;
      player.h = Math.round(40 * scale.size);
      ball.x = 160;
      ball.y = 110;
      ball.vx = 2.2 * spd;
      ball.vy = 1.4 * spd;
      foes.push({ x: 304, y: 90, w: 6, h: 40, vx: 0, vy: 0, kind: 0 });
      target = stageNeed(level, 8, 5);
    }
    if (spec.mode === "barrel") {
      player.x = 24;
      player.y = 250;
      player.w = 12;
      player.h = 14;
      target = stageNeed(level, 3, 2);
      for (let i = 0; i < 6; i += 1) items.push({ x: i % 2 ? 40 : 8, y: 250 - i * 40, w: 280, h: 8 });
      items.push({ x: 150, y: 12, w: 28, h: 10 });
    }
    if (spec.mode === "dungeon") {
      player.x = 20;
      player.y = 140;
      for (let i = 0; i < stageNeed(level, 14, 8); i += 1) items.push({ x: 40 + rnd() * 280, y: 40 + rnd() * 180, w: 8, h: 8 });
      foes.push({ x: 200, y: 80, w: 12, h: 12, vx: 0.7 * spd, vy: 0.5 * spd, kind: 0 });
      target = items.length;
    }
    if (spec.mode === "rail") {
      player.x = 160;
      player.y = 200;
      player.w = 16;
      player.h = 12;
      target = stageNeed(level, 28, 18);
    }
    if (spec.mode === "boxer") {
      player.x = 150;
      player.y = 200;
      tell = 40;
      target = stageNeed(level, 16, 12);
    }
    if (spec.mode === "missile") {
      player.x = 180;
      player.y = 120;
      player.w = 8;
      player.h = 8;
      for (let i = 0; i < 4; i += 1) items.push({ x: 20 + i * 90, y: 250, w: 36, h: 14 });
      target = stageNeed(level, 22, 14);
    }
    if (spec.mode === "bombman") {
      player.x = 1;
      player.y = 1;
      maze = Array.from({ length: MH }, (_, y) =>
        Array.from({ length: MW }, (_, x) => (x % 2 === 0 && y % 2 === 0 ? 1 : 0)),
      );
      foes.push({ x: 10, y: 8, w: 1, h: 1, vx: 0, vy: 0, kind: 0 });
      target = stageNeed(level, 10, 6);
    }
    if (spec.mode === "rungun") {
      player.x = 30;
      player.y = 220;
      player.w = 12;
      player.h = 16;
      target = stageNeed(level, 20, 14);
    }
    if (spec.mode === "brawler") {
      player.x = 24;
      player.y = 200;
      player.w = 14;
      player.h = 18;
      target = stageNeed(level, 22, 14);
    }
    if (spec.mode === "rocks") {
      player.x = 180;
      player.y = 140;
      angle = 0;
      for (let i = 0; i < stageNeed(level, 10, 6); i += 1) {
        foes.push({ x: rnd() * 320, y: rnd() * 240, w: 18, h: 18, vx: (rnd() - 0.5) * 2, vy: (rnd() - 0.5) * 2, kind: 2 });
      }
      target = foes.length;
    }
    if (spec.mode === "soccer") {
      player.x = 40;
      player.y = 140;
      ball.x = 80;
      ball.y = 150;
      ball.vx = 0;
      ball.vy = 0;
      items.push({ x: 320, y: 90, w: 10, h: 90 });
      target = stageNeed(level, 6, 4);
    }
    if (spec.mode === "hoop") {
      player.x = 160;
      player.y = 230;
      items.push({ x: 150, y: 36, w: 60, h: 8 });
      target = stageNeed(level, 10, 6);
    }
    if (spec.mode === "gun") {
      player.x = 180;
      player.y = 140;
      target = stageNeed(level, 22, 14);
    }
    if (spec.mode === "vert") {
      player.x = 170;
      player.y = 240;
      player.w = 14;
      player.h = 12;
      target = stageNeed(level, 24, 16);
    }
    if (spec.mode === "smash") {
      player.x = 20;
      player.y = 220;
      target = stageNeed(level, 720, 420);
    }
    if (spec.mode === "coins") target = Math.max(1, items.length);
    progress = spec.mode === "race" ? 0 : 0;
    if (spec.mode === "race") goalText = "0%";
    else if (spec.mode === "tetris") goalText = "0 LINES";
    else goalText = `0/${target}`;
    hud();
  };

  const step = () => {
    tick += 1;
    const spd = scale.speed * pace(level);

    if (spec.mode === "snake") {
      if (up() && dir.y !== 1) nextDir = { x: 0, y: -1 };
      if (down() && dir.y !== -1) nextDir = { x: 0, y: 1 };
      if (left() && dir.x !== 1) nextDir = { x: -1, y: 0 };
      if (right() && dir.x !== -1) nextDir = { x: 1, y: 0 };
      if (tick % Math.max(5, Math.round(11 / spd)) !== 0) return;
      dir = nextDir;
      const head = body[0];
      if (!head) return;
      const nx = head.x + dir.x;
      const ny = head.y + dir.y;
      if (nx < 0 || ny < 0 || nx > 19 || ny > 13 || body.some((p) => p.x === nx && p.y === ny)) {
        fail();
        return;
      }
      body.unshift({ x: nx, y: ny });
      if (nx === food.x && ny === food.y) {
        setScore(score + 10);
        hooks.onSfx("pickup");
        objective += 1;
        food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 14) };
        progress = Math.round((objective / target) * 100);
        goalText = `${objective}/${target}`;
        hud();
        if (objective >= target) clearLevel();
      } else body.pop();
    }

    if (spec.mode === "bricks") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 4.2 * spd, 4, W - player.w - 4);
      if (!launched) {
        ball.x = player.x + player.w / 2;
        ball.y = player.y - 10;
        if (action()) {
          launched = true;
          hooks.onSfx("action");
        }
        return;
      }
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.x < 2 || ball.x > W - 6) ball.vx *= -1;
      if (ball.y < 2) ball.vy *= -1;
      if (ball.y > H) {
        fail();
        return;
      }
      if (hits({ x: ball.x, y: ball.y, w: 5, h: 5 }, { ...player }) && ball.vy > 0) {
        ball.vy *= -1;
        hooks.onSfx("action");
      }
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const brick = items[i];
        if (brick && hits({ x: ball.x, y: ball.y, w: 5, h: 5 }, brick)) {
          items.splice(i, 1);
          ball.vy *= -1;
          setScore(score + 12);
          hooks.onSfx("pickup");
        }
      }
      if (items.length === 0) {
        objective += 1;
        if (objective >= target) clearLevel();
        else {
          launched = false;
          fillBricks();
        }
      }
    }

    if (spec.mode === "dodge" || spec.mode === "catch") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 3.4 * spd, 4, W - player.w - 4);
      if (tick % Math.max(14, Math.round(36 / spd)) === 0) {
        const good = spec.mode === "catch" && Math.random() > 0.4;
        foes.push({
          x: 8 + Math.random() * 280,
          y: -16,
          w: good ? 12 : 16,
          h: good ? 12 : 12,
          vx: 0,
          vy: 1.6 * spd,
          kind: good ? 1 : 0,
        });
      }
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const drop = foes[i];
        if (!drop) continue;
        drop.y += drop.vy;
        if (hits({ ...player }, drop)) {
          if (spec.mode === "catch" && drop.kind === 1) {
            setScore(score + 8);
            objective += 1;
            hooks.onSfx("pickup");
            foes.splice(i, 1);
            if (objective >= target) clearLevel();
          } else {
            fail();
            return;
          }
        } else if (drop.y > H) {
          if (spec.mode === "dodge") {
            setScore(score + 1);
            objective += 1;
            if (objective >= target) clearLevel();
          }
          foes.splice(i, 1);
        }
      }
    }

    if (spec.mode === "coins") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.6 * spd, 4, W - 16);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 2.6 * spd, 4, H - 16);
      for (const foe of foes) {
        foe.x += foe.vx;
        if (foe.x < 8 || foe.x > 300) foe.vx *= -1;
        if (hits({ ...player }, foe)) {
          fail();
          return;
        }
      }
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const coin = items[i];
        if (coin && hits({ ...player }, coin)) {
          items.splice(i, 1);
          setScore(score + 10);
          hooks.onSfx("pickup");
        }
      }
      if (items.length === 0) clearLevel();
    }

    if (spec.mode === "race") {
      if (left()) {
        if (!holdL) playerLane = Math.max(0, playerLane - 1);
        holdL = true;
      } else holdL = false;
      if (right()) {
        if (!holdR) playerLane = Math.min(3, playerLane + 1);
        holdR = true;
      } else holdR = false;
      if (up()) carSpeed = Math.min(3.8 * scale.speed, carSpeed + 0.055);
      else if (down()) carSpeed = Math.max(0.45, carSpeed - 0.08);
      else carSpeed += (1.55 * scale.speed - carSpeed) * 0.02;
      distance += carSpeed * 2.5;
      progress = Math.min(100, Math.round((distance / trackLen) * 100));
      goalText = `${progress}%`;
      for (const car of rivals) {
        car.dist += car.spd * 2.15;
        car.y = 210 - (car.dist - distance) * 0.2;
        if (car.y > 230) {
          car.dist = distance + 240 + Math.random() * 180;
          car.lane = Math.floor(Math.random() * 4);
        }
        if (car.y < -40 && car.dist < distance) {
          car.dist = distance + 280 + Math.random() * 120;
          car.lane = Math.floor(Math.random() * 4);
        }
        if (Math.abs(car.dist - distance) < 22 && car.lane === playerLane && car.y > 188 && car.y < 232) {
          fail();
          return;
        }
      }
      place = 1 + rivals.filter((car) => car.dist > distance).length;
      if (tick % 18 === 0) setScore(score + Math.round(carSpeed * 2));
      hud();
      if (distance >= trackLen) {
        setScore(score + (5 - Math.min(4, place - 1)) * 90);
        clearLevel();
      }
    }

    if (spec.mode === "tetris" && piece) {
      if (tick % 6 === 0) {
        if (left() && !collide(piece.cells, piece.x - 1, piece.y)) piece.x -= 1;
        if (right() && !collide(piece.cells, piece.x + 1, piece.y)) piece.x += 1;
      }
      if ((up() || action()) && !rotateLatch) {
        rotatePiece();
        rotateLatch = true;
        hooks.onSfx("action");
      }
      if (!up() && !action()) rotateLatch = false;
      dropTimer += down() ? 3 : 1;
      const gravity = Math.max(8, 28 - level * 2 - scale.speed * 6);
      if (dropTimer >= gravity) {
        dropTimer = 0;
        if (!collide(piece.cells, piece.x, piece.y + 1)) piece.y += 1;
        else {
          for (const cell of piece.cells) {
            const y = piece.y + cell.y;
            const x = piece.x + cell.x;
            if (y >= 0 && board[y]) board[y][x] = 1;
          }
          let cleared = 0;
          board = board.filter((row) => {
            const full = row.every((cell) => cell === 1);
            if (full) cleared += 1;
            return !full;
          });
          while (board.length < ROWS) board.unshift(Array.from({ length: COLS }, () => 0));
          if (cleared) {
            linesCleared += cleared;
            setScore(score + [0, 40, 100, 300, 1200][cleared] * level);
            hooks.onSfx("pickup");
            progress = Math.min(100, Math.round(((linesCleared % 10) / 10) * 100));
            goalText = `${linesCleared} LINES`;
            hud();
            if (linesCleared >= target) clearLevel();
          }
          spawnPiece();
        }
      }
      progress = Math.min(100, Math.round((linesCleared / Math.max(1, target)) * 100));
      goalText = `${linesCleared}/${target}`;
      hud();
    }

    if (spec.mode === "climb") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.6, 4, 304);
      if ((action() || up()) && player.vy === 0) {
        player.vy = -6.8 / Math.max(0.75, scale.speed);
        hooks.onSfx("action");
      }
      player.vy += 0.28;
      player.y += player.vy;
      let grounded = false;
      const flag = items[items.length - 1];
      for (let i = 0; i < items.length - 1; i += 1) {
        const plat = items[i];
        if (!plat) continue;
        if (
          player.vy >= 0 &&
          player.x + player.w > plat.x &&
          player.x < plat.x + plat.w &&
          player.y + player.h >= plat.y &&
          player.y + player.h <= plat.y + 12
        ) {
          player.y = plat.y - player.h;
          player.vy = 0;
          grounded = true;
        }
      }
      if (flag && hits({ ...player }, flag)) {
        objective += 1;
        setScore(score + 40);
        if (objective >= target) {
          clearLevel();
          return;
        }
        player.x = items[0]?.x ?? 40;
        player.y = (items[0]?.y ?? 180) - 16;
        player.vy = 0;
      }
      if (player.y > H) fail();
      void grounded;
    }

    if (spec.mode === "cross") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.1, 4, 304);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 2.1, 4, 204);
      for (const car of foes) {
        car.x += car.vx;
        if (car.x > W + 28) car.x = -28;
        if (car.x < -28) car.x = W + 28;
        if (hits({ ...player }, car)) {
          fail();
          return;
        }
      }
      if (player.y < 18) {
        objective += 1;
        setScore(score + 25);
        if (objective >= target) clearLevel();
        else {
          player.x = 152;
          player.y = 198;
        }
      }
    }

    if (spec.mode === "invaders") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 3 * spd, 4, 298);
      if (action() && tick % 10 === 0) {
        items.push({ x: player.x + 7, y: player.y - 8, w: 3, h: 8 });
        hooks.onSfx("action");
      }
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const shot = items[i];
        if (!shot) continue;
        shot.y -= 5;
        if (shot.y < 0) items.splice(i, 1);
      }
      let bounce = false;
      for (const alien of foes) {
        alien.x += alien.vx;
        if (alien.x < 6 || alien.x > 300) bounce = true;
        if (alien.y > 188) {
          fail();
          return;
        }
        for (let i = items.length - 1; i >= 0; i -= 1) {
          const shot = items[i];
          if (shot && hits(shot, alien)) {
            alien.y = -80;
            items.splice(i, 1);
            setScore(score + 20);
            hooks.onSfx("pickup");
          }
        }
      }
      if (bounce) {
        for (const alien of foes) {
          alien.vx *= -1;
          alien.y += 8;
        }
      }
      if (foes.every((alien) => alien.y < 0)) {
        objective += 1;
        if (objective >= target) clearLevel();
        else fillInvaders();
      }
    }

    if (spec.mode === "stack") {
      stackX += stackDir;
      if (stackX < 8 || stackX > W - stackW) stackDir *= -1;
      if (action() && !dropLock) {
        dropLock = true;
        const lastBlock = items[items.length - 1];
        const placed = { x: stackX, y: stackY, w: stackW, h: 10 };
        if (lastBlock) {
          const overlap = Math.min(placed.x + placed.w, lastBlock.x + lastBlock.w) - Math.max(placed.x, lastBlock.x);
          if (overlap < 16) {
            fail();
            return;
          }
          stackW = Math.max(24, overlap);
          placed.w = stackW;
          placed.x = Math.max(placed.x, lastBlock.x);
        }
        items.push(placed);
        stackY -= 12;
        setScore(score + 10);
        hooks.onSfx("pickup");
        if (items.length - 1 >= target) clearLevel();
      }
      if (!action()) dropLock = false;
    }

    if (spec.mode === "jump") {
      if ((action() || up()) && player.y >= 168) {
        player.vy = -7.4;
        hooks.onSfx("action");
      }
      player.vy += 0.38;
      player.y = Math.min(168, player.y + player.vy);
      if (player.y >= 168) player.vy = 0;
      if (tick % Math.max(36, Math.round(70 / spd)) === 0) {
        foes.push({ x: 330, y: 174, w: 16, h: 16, vx: -2.6 * spd, vy: 0, kind: 0 });
      }
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const box = foes[i];
        if (!box) continue;
        box.x += box.vx;
        if (hits({ ...player }, box)) {
          fail();
          return;
        }
        if (box.x < -20) {
          foes.splice(i, 1);
          setScore(score + 5);
          objective += 1;
          hooks.onSfx("pickup");
          if (objective >= target) clearLevel();
        }
      }
    }

    if (spec.mode === "pong") {
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 3.2 * spd, 8, H - player.h - 8);
      const cpu = foes[0];
      if (cpu) cpu.y = clamp(cpu.y + clamp(ball.y - cpu.y - 16, -2.4 * spd, 2.4 * spd), 8, 176);
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.y < 4 || ball.y > 210) ball.vy *= -1;
      if (hits({ x: ball.x, y: ball.y, w: 5, h: 5 }, { ...player }) && ball.vx < 0) {
        ball.vx *= -1;
        hooks.onSfx("action");
      }
      if (cpu && hits({ x: ball.x, y: ball.y, w: 5, h: 5 }, cpu) && ball.vx > 0) ball.vx *= -1;
      if (ball.x < -6) {
        fail();
        return;
      }
      if (ball.x > W + 6) {
        setScore(score + 10);
        objective += 1;
        hooks.onSfx("pickup");
        ball.x = 160;
        ball.y = 110;
        if (objective >= target) clearLevel();
      }
    }

    if (spec.mode === "maze") {
      if (tick % Math.max(6, Math.round(10 / spd)) === 0) {
        const nx = player.x + (Number(right()) - Number(left()));
        const ny = player.y + (Number(down()) - Number(up()));
        if (maze[ny]?.[nx] === 0) {
          player.x = nx;
          player.y = ny;
        }
      }
      for (let i = pellets.length - 1; i >= 0; i -= 1) {
        const pellet = pellets[i];
        if (pellet && pellet.x === player.x && pellet.y === player.y) {
          pellets.splice(i, 1);
          setScore(score + 5);
          objective += 1;
          hooks.onSfx("pickup");
        }
      }
      const ghost = foes[0];
      if (ghost && tick % Math.max(8, Math.round(14 / spd)) === 0) {
        const gx = ghost.x + Math.sign(player.x - ghost.x);
        const gy = ghost.y + Math.sign(player.y - ghost.y);
        if (maze[ghost.y]?.[gx] === 0) ghost.x = gx;
        else if (maze[gy]?.[ghost.x] === 0) ghost.y = gy;
      }
      if (ghost && ghost.x === player.x && ghost.y === player.y) {
        fail();
        return;
      }
      if (pellets.length === 0) clearLevel();
    }

    if (spec.mode === "flap") {
      if ((up() || action()) && !flapLatch) {
        player.vy = -4.2;
        flapLatch = true;
        hooks.onSfx("action");
      }
      if (!up() && !action()) flapLatch = false;
      player.vy += 0.22 * scale.speed;
      player.y += player.vy;
      if (player.y < 4 || player.y > H - 16) {
        fail();
        return;
      }
      if (tick % Math.max(48, Math.round(78 / spd)) === 0) {
        const gap = 52 + (spec.scene % 18);
        const top = 20 + Math.random() * 80;
        items.push({ x: W + 8, y: 0, w: 22, h: top });
        items.push({ x: W + 8, y: top + gap, w: 22, h: H });
      }
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const pipe = items[i];
        if (!pipe) continue;
        pipe.x -= 2.1 * spd;
        if (hits({ ...player }, pipe)) {
          fail();
          return;
        }
        if (!pipe.mark && pipe.y === 0 && pipe.x + pipe.w < player.x) {
          pipe.mark = 1;
          setScore(score + 15);
          objective += 1;
          hooks.onSfx("pickup");
          if (objective >= target) clearLevel();
        }
        if (pipe.x < -30) items.splice(i, 1);
      }
    }

    if (spec.mode === "memory") {
      if (left() && !holdL) {
        cursor = (cursor + tiles.length - 1) % Math.max(1, tiles.length);
        holdL = true;
      }
      if (!left()) holdL = false;
      if (right() && !holdR) {
        cursor = (cursor + 1) % Math.max(1, tiles.length);
        holdR = true;
      }
      if (!right()) holdR = false;
      if (pickLock > 0) {
        pickLock -= 1;
        if (pickLock === 0 && pickA >= 0 && pickB >= 0) {
          const a = tiles[pickA];
          const b = tiles[pickB];
          if (a && b) {
            a.open = false;
            b.open = false;
          }
          pickA = -1;
          pickB = -1;
        }
      }
      if (action() && !rotateLatch && pickLock === 0) {
        rotateLatch = true;
        const tile = tiles[cursor];
        if (tile && !tile.done && !tile.open) {
          tile.open = true;
          hooks.onSfx("action");
          if (pickA < 0) pickA = cursor;
          else {
            const first = tiles[pickA];
            if (first && first.v === tile.v) {
              first.done = true;
              tile.done = true;
              pickA = -1;
              pickB = -1;
              setScore(score + 20);
              objective += 1;
              hooks.onSfx("pickup");
              if (objective >= target) clearLevel();
            } else {
              pickB = cursor;
              pickLock = 28;
            }
          }
        }
      }
      if (!action()) rotateLatch = false;
    }

    if (spec.mode === "barrel") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.4, 4, W - 16);
      if ((action() || up()) && player.vy === 0) player.vy = -6.4;
      player.vy += 0.28;
      player.y += player.vy;
      for (const plat of items) {
        if (player.vy >= 0 && player.x + 12 > plat.x && player.x < plat.x + plat.w && player.y + 14 >= plat.y && player.y + 14 <= plat.y + 12) {
          player.y = plat.y - 14;
          player.vy = 0;
        }
      }
      if (tick % Math.max(22, Math.round(40 / spd)) === 0) foes.push({ x: 8 + Math.random() * 300, y: 20, w: 14, h: 10, vx: (Math.random() > 0.5 ? 1 : -1) * 1.6 * spd, vy: 1.1 * spd, kind: 0 });
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const barrel = foes[i];
        if (!barrel) continue;
        barrel.x += barrel.vx;
        barrel.y += barrel.vy;
        if (barrel.x < 4 || barrel.x > W - 16) barrel.vx *= -1;
        if (hits({ ...player }, barrel)) {
          fail();
          return;
        }
        if (barrel.y > H) foes.splice(i, 1);
      }
      const flag = items[items.length - 1];
      if (flag && hits({ ...player }, flag)) {
        objective += 1;
        setScore(score + 50);
        if (objective >= target) clearLevel();
        else {
          player.x = 24;
          player.y = 250;
          player.vy = 0;
        }
      }
      if (player.y > H) fail();
    }

    if (spec.mode === "dungeon") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.4, 4, W - 16);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 2.4, 24, H - 16);
      for (const foe of foes) {
        foe.x += foe.vx;
        foe.y += foe.vy;
        if (foe.x < 8 || foe.x > W - 16) foe.vx *= -1;
        if (foe.y < 24 || foe.y > H - 16) foe.vy *= -1;
        if (hits({ ...player }, foe)) {
          if (action()) {
            foe.x = 8 + Math.random() * 300;
            setScore(score + 15);
            hooks.onSfx("pickup");
          } else {
            fail();
            return;
          }
        }
      }
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const key = items[i];
        if (key && hits({ ...player }, key)) {
          items.splice(i, 1);
          setScore(score + 12);
          hooks.onSfx("pickup");
        }
      }
      if (items.length === 0) clearLevel();
    }

    if (spec.mode === "rail") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 3.2, 20, W - 30);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 3.2, 80, H - 20);
      if (action() && tick % 7 === 0) items.push({ x: player.x + 6, y: player.y - 8, w: 3, h: 8 });
      if (tick % Math.max(16, Math.round(28 / spd)) === 0) foes.push({ x: 30 + Math.random() * 280, y: 10, w: 16, h: 10, vx: 0, vy: 1.8 * spd, kind: 0 });
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const shot = items[i];
        if (!shot) continue;
        shot.y -= 6;
        if (shot.y < 0) items.splice(i, 1);
      }
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const foe = foes[i];
        if (!foe) continue;
        foe.y += foe.vy;
        if (hits({ ...player }, foe)) {
          fail();
          return;
        }
        for (let s = items.length - 1; s >= 0; s -= 1) {
          const shot = items[s];
          if (shot && hits(shot, foe)) {
            foes.splice(i, 1);
            items.splice(s, 1);
            setScore(score + 12);
            objective += 1;
            hooks.onSfx("pickup");
            break;
          }
        }
        if (foe.y > H) foes.splice(i, 1);
      }
      if (objective >= target) clearLevel();
    }

    if (spec.mode === "boxer") {
      tell -= 1;
      if (tell <= 0) {
        tell = 50 - level * 2;
        foes[0] = { x: 140, y: 80, w: 40, h: 50, vx: 0, vy: 0, kind: 1 + Math.floor(Math.random() * 3) };
      }
      const foe = foes[0];
      const dodgeOk = (foe?.kind === 1 && left()) || (foe?.kind === 2 && right()) || (foe?.kind === 3 && up());
      if (foe && foe.kind && tell < 18 && !dodgeOk && tell === 8) {
        fail();
        return;
      }
      if (action() && !rotateLatch && foe && tell < 22 && dodgeOk) {
        rotateLatch = true;
        setScore(score + 20);
        objective += 1;
        hooks.onSfx("pickup");
        foe.kind = 0;
        if (objective >= target) clearLevel();
      }
      if (!action()) rotateLatch = false;
    }

    if (spec.mode === "missile") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 3.6, 8, W - 12);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 3.6, 8, 200);
      if (tick % Math.max(20, Math.round(36 / spd)) === 0) foes.push({ x: 10 + Math.random() * 330, y: 0, w: 4, h: 8, vx: (Math.random() - 0.5) * 0.6, vy: 1.4 * spd, kind: 0 });
      if (action() && !rotateLatch) {
        rotateLatch = true;
        items.push({ x: player.x - 10, y: player.y - 10, w: 28, h: 28 });
        hooks.onSfx("action");
      }
      if (!action()) rotateLatch = false;
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const burst = items[i];
        if (!burst || burst.y > 230) continue;
        burst.w += 1.2;
        burst.h += 1.2;
        burst.x -= 0.6;
        burst.y -= 0.6;
        if (burst.w > 46) items.splice(i, 1);
      }
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const nuke = foes[i];
        if (!nuke) continue;
        nuke.x += nuke.vx;
        nuke.y += nuke.vy;
        if (items.some((burst) => burst.y < 230 && hits(burst, nuke))) {
          foes.splice(i, 1);
          setScore(score + 10);
          objective += 1;
          hooks.onSfx("pickup");
          continue;
        }
        if (nuke.y > 248) {
          fail();
          return;
        }
      }
      if (objective >= target) clearLevel();
    }

    if (spec.mode === "bombman") {
      if (tick % 7 === 0) {
        const nx = player.x + (Number(right()) - Number(left()));
        const ny = player.y + (Number(down()) - Number(up()));
        if (maze[ny]?.[nx] === 0) {
          player.x = nx;
          player.y = ny;
        }
      }
      if (action() && bombT <= 0) {
        bombT = 50;
        items.push({ x: player.x, y: player.y, w: 1, h: 1 });
        hooks.onSfx("action");
      }
      if (bombT > 0) bombT -= 1;
      if (bombT === 1 && items[0]) {
        const bomb = items[0];
        const ghost = foes[0];
        if (ghost && Math.abs(ghost.x - bomb.x) + Math.abs(ghost.y - bomb.y) <= 2) {
          setScore(score + 25);
          objective += 1;
          ghost.x = 12;
          ghost.y = 10;
          hooks.onSfx("pickup");
          if (objective >= target) clearLevel();
        }
        if (Math.abs(player.x - bomb.x) + Math.abs(player.y - bomb.y) <= 1) fail();
        items.length = 0;
      }
      const ghost = foes[0];
      if (ghost && tick % 10 === 0) {
        ghost.x += Math.sign(player.x - ghost.x);
        if (ghost.x === player.x && ghost.y === player.y) fail();
      }
    }

    if (spec.mode === "rungun") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.8 * spd, 8, W - 20);
      if (up() && player.y >= 220) player.vy = -7;
      player.vy += 0.36;
      player.y = Math.min(220, player.y + player.vy);
      if (player.y >= 220) player.vy = 0;
      if ((action() || bBtn()) && tick % 8 === 0) items.push({ x: player.x + 12, y: player.y + 4, w: 8, h: 3 });
      if (tick % Math.max(24, Math.round(44 / spd)) === 0) foes.push({ x: W + 8, y: 220, w: 14, h: 16, vx: -2 * spd, vy: 0, kind: 0 });
      for (const shot of items) shot.x += 6;
      for (let i = items.length - 1; i >= 0; i -= 1) if ((items[i]?.x ?? 0) > W) items.splice(i, 1);
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const foe = foes[i];
        if (!foe) continue;
        foe.x += foe.vx;
        if (hits({ ...player }, foe)) {
          fail();
          return;
        }
        const hitShot = items.findIndex((shot) => hits(shot, foe));
        if (hitShot >= 0) {
          items.splice(hitShot, 1);
          foes.splice(i, 1);
          setScore(score + 10);
          objective += 1;
          hooks.onSfx("pickup");
        }
      }
      if (objective >= target) {
        setScore(score + 40);
        clearLevel();
      }
    }

    if (spec.mode === "brawler") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.6, 8, W - 20);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 2.2, 160, 240);
      if (tick % Math.max(28, Math.round(50 / spd)) === 0) foes.push({ x: W, y: 170 + Math.random() * 60, w: 14, h: 18, vx: -1.4 * spd, vy: 0, kind: 0 });
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const thug = foes[i];
        if (!thug) continue;
        thug.x += thug.vx;
        if (hits({ ...player }, thug)) {
          if (action()) {
            foes.splice(i, 1);
            setScore(score + 12);
            objective += 1;
            hooks.onSfx("pickup");
          } else {
            fail();
            return;
          }
        }
      }
      if (objective >= target) clearLevel();
    }

    if (spec.mode === "rocks") {
      if (left()) angle -= 0.08;
      if (right()) angle += 0.08;
      if (up()) {
        player.x += Math.cos(angle) * 2.4;
        player.y += Math.sin(angle) * 2.4;
      }
      player.x = (player.x + W) % W;
      player.y = (player.y + H) % H;
      if (action() && tick % 8 === 0) items.push({ x: player.x, y: player.y, w: 3, h: 3 });
      for (const shot of items) {
        shot.x += Math.cos(angle) * 5;
        shot.y += Math.sin(angle) * 5;
      }
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const shot = items[i];
        if (!shot || shot.x < -10 || shot.x > W + 10) items.splice(i, 1);
      }
      for (const rock of foes) {
        rock.x = (rock.x + rock.vx + W) % W;
        rock.y = (rock.y + rock.vy + H) % H;
        if (hits({ x: player.x, y: player.y, w: 10, h: 10 }, rock)) {
          fail();
          return;
        }
      }
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const rock = foes[i];
        if (!rock) continue;
        if (items.some((shot) => hits(shot, rock))) {
          if (rock.kind > 1) {
            rock.kind -= 1;
            rock.w = 10;
            rock.h = 10;
          } else {
            foes.splice(i, 1);
            setScore(score + 15);
            hooks.onSfx("pickup");
          }
        }
      }
      if (foes.length === 0) clearLevel();
    }

    if (spec.mode === "soccer") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 2.8, 8, 220);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 2.8, 40, 240);
      if (action() && hits({ ...player }, { x: ball.x, y: ball.y, w: 8, h: 8 })) {
        ball.vx = 4.2;
        ball.vy = (player.y - 140) * 0.08;
        hooks.onSfx("action");
      }
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy *= 0.99;
      if (ball.y < 40 || ball.y > 240) ball.vy *= -1;
      const goal = items[0];
      if (goal && ball.x > goal.x && ball.y > goal.y && ball.y < goal.y + goal.h) {
        setScore(score + 20);
        objective += 1;
        ball.x = 80;
        ball.y = 150;
        ball.vx = 0;
        hooks.onSfx("pickup");
        if (objective >= target) clearLevel();
      }
      if (ball.x > W) {
        ball.x = 80;
        ball.vx = 0;
      }
    }

    if (spec.mode === "hoop") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 3.2, 20, 300);
      if (action() && !launched) {
        launched = true;
        ball.x = player.x;
        ball.y = player.y;
        ball.vx = 0;
        ball.vy = -6.4;
        hooks.onSfx("action");
      }
      if (launched) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.22;
        const rim = items[0];
        if (rim && hits({ x: ball.x, y: ball.y, w: 6, h: 6 }, rim)) {
          setScore(score + 20);
          objective += 1;
          launched = false;
          hooks.onSfx("pickup");
          if (objective >= target) clearLevel();
        }
        if (ball.y > H) launched = false;
      }
    }

    if (spec.mode === "gun") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 4, 10, W - 10);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 4, 20, H - 10);
      if (tick % Math.max(26, Math.round(48 / spd)) === 0) foes.push({ x: 20 + Math.random() * 300, y: 30 + Math.random() * 160, w: 16, h: 12, vx: 0, vy: 0, kind: Math.random() > 0.2 ? 0 : 1 });
      if (action() && !rotateLatch) {
        rotateLatch = true;
        const hit = foes.findIndex((foe) => Math.abs(foe.x + 8 - player.x) < 14 && Math.abs(foe.y + 6 - player.y) < 14);
        if (hit >= 0) {
          const mark = foes[hit];
          if (mark?.kind === 1) {
            fail();
            return;
          }
          foes.splice(hit, 1);
          setScore(score + 15);
          objective += 1;
          hooks.onSfx("pickup");
          if (objective >= target) clearLevel();
        }
      }
      if (!action()) rotateLatch = false;
      for (let i = foes.length - 1; i >= 0; i -= 1) if (tick % 90 === 0) foes.splice(i, 1);
    }

    if (spec.mode === "vert") {
      player.x = clamp(player.x + (Number(right()) - Number(left())) * 3.2, 8, W - 20);
      player.y = clamp(player.y + (Number(down()) - Number(up())) * 3.2, 40, H - 16);
      if (action() && tick % 6 === 0) items.push({ x: player.x + 6, y: player.y, w: 3, h: 8 });
      if (tick % Math.max(14, Math.round(24 / spd)) === 0) foes.push({ x: 16 + Math.random() * 320, y: -12, w: 14, h: 10, vx: 0, vy: 1.7 * spd, kind: 0 });
      for (const shot of items) shot.y -= 6;
      for (let i = items.length - 1; i >= 0; i -= 1) if ((items[i]?.y ?? 0) < 0) items.splice(i, 1);
      for (let i = foes.length - 1; i >= 0; i -= 1) {
        const foe = foes[i];
        if (!foe) continue;
        foe.y += foe.vy;
        if (hits({ ...player }, foe)) {
          fail();
          return;
        }
        const hitShot = items.findIndex((shot) => hits(shot, foe));
        if (hitShot >= 0) {
          items.splice(hitShot, 1);
          foes.splice(i, 1);
          setScore(score + 10);
          objective += 1;
          hooks.onSfx("pickup");
        } else if (foe.y > H) foes.splice(i, 1);
      }
      if (objective >= target) clearLevel();
    }

    if (spec.mode === "smash") {
      if (action() && tick % 2 === 0) player.x += 3.4 * spd;
      if (up() || bBtn()) player.y = 190;
      else player.y = 220;
      if (tick % 40 === 0) foes.push({ x: player.x + 80, y: 210, w: 18, h: 18, vx: 0, vy: 0, kind: 0 });
      for (const bar of foes) {
        if (hits({ ...player, h: 16 }, bar) && player.y > 200) {
          fail();
          return;
        }
      }
      if (player.x >= target) {
        setScore(score + 30);
        clearLevel();
      }
    }

    if (spec.mode !== "race" && spec.mode !== "tetris") {
      if (spec.mode === "bricks") {
        const wall = 1 - items.length / Math.max(1, waveSize);
        progress = Math.min(100, Math.round(((objective + wall) / Math.max(1, target)) * 100));
        goalText = `${objective}/${target}`;
      } else if (spec.mode === "coins" || spec.mode === "dungeon") {
        progress = Math.round((1 - items.length / Math.max(1, target)) * 100);
        goalText = `${target - items.length}/${target}`;
      } else if (spec.mode === "invaders") {
        const alive = foes.filter((foe) => foe.y >= 0).length;
        const wall = 1 - alive / Math.max(1, waveSize);
        progress = Math.min(100, Math.round(((objective + wall) / Math.max(1, target)) * 100));
        goalText = `${objective}/${target}`;
      } else if (spec.mode === "maze") {
        progress = Math.round((1 - pellets.length / Math.max(1, target)) * 100);
        goalText = `${target - pellets.length}/${target}`;
      } else if (spec.mode === "rocks") {
        progress = Math.round((1 - foes.length / Math.max(1, target)) * 100);
        goalText = `${target - foes.length}/${target}`;
      } else if (spec.mode === "stack") {
        const stacked = Math.max(0, items.length - 1);
        progress = Math.min(100, Math.round((stacked / Math.max(1, target)) * 100));
        goalText = `${stacked}/${target}`;
      } else if (spec.mode === "smash") {
        progress = Math.min(100, Math.round((player.x / Math.max(1, target)) * 100));
        goalText = `${Math.min(target, Math.round(player.x))}/${target}`;
      } else {
        progress = Math.min(100, Math.round((objective / Math.max(1, target)) * 100));
        goalText = `${objective}/${target}`;
      }
      hud();
    }
  };

  const draw = () => {
    ctx.fillStyle = "#031208";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(60,255,110,0.06)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = GREEN;
    ctx.font = "10px monospace";

    if (spec.mode === "snake") {
      for (const part of body) ctx.fillRect(part.x * 16, part.y * 16, 15, 15);
      ctx.fillStyle = LIME;
      ctx.fillRect(food.x * 16, food.y * 16, 15, 15);
    } else if (spec.mode === "race") {
      const lanes = 4;
      const leftEdge = 40;
      const roadW = 280;
      const laneW = roadW / lanes;
      ctx.fillStyle = "#061109";
      ctx.fillRect(0, 0, leftEdge, H);
      ctx.fillRect(leftEdge + roadW, 0, W, H);
      ctx.fillStyle = "#0a1f12";
      ctx.fillRect(leftEdge, 0, roadW, H);
      ctx.fillStyle = GREEN;
      ctx.fillRect(leftEdge, 0, 3, H);
      ctx.fillRect(leftEdge + roadW - 3, 0, 3, H);
      ctx.fillStyle = "rgba(60,255,110,0.35)";
      const scroll = (tick * Math.round(carSpeed * 4)) % 20;
      for (let lane = 1; lane < lanes; lane += 1) {
        const x = leftEdge + lane * laneW;
        for (let y = -scroll; y < H; y += 20) ctx.fillRect(x - 1, y, 3, 10);
      }
      const finishY = 200 - (trackLen - distance) * 0.2;
      if (finishY > -8 && finishY < H) {
        ctx.fillStyle = LIME;
        ctx.fillRect(leftEdge, finishY, roadW, 4);
        ctx.fillText("FINISH", leftEdge + 8, finishY - 4);
      }
      const box = 22;
      const drawBox = (lane: number, y: number, mine: boolean) => {
        const x = leftEdge + (lane + 0.5) * laneW - box / 2;
        ctx.fillStyle = mine ? LIME : GREEN;
        ctx.fillRect(x, y, box, box);
      };
      for (const car of rivals) {
        if (car.y < -24 || car.y > H) continue;
        drawBox(car.lane, car.y, false);
      }
      drawBox(playerLane, 210, true);
      ctx.fillStyle = GREEN;
      ctx.fillText(`${progress}%  PLACE ${place}`, 10, 16);
    } else if (spec.mode === "tetris") {
      const ox = 80;
      const oy = 16;
      ctx.strokeStyle = GREEN;
      ctx.strokeRect(ox, oy, COLS * 12, ROWS * 12);
      ctx.fillStyle = GREEN;
      board.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) ctx.fillRect(ox + x * 12, oy + y * 12, 11, 11);
        });
      });
      ctx.fillStyle = LIME;
      if (piece) {
        for (const cell of piece.cells) {
          ctx.fillRect(ox + (piece.x + cell.x) * 12, oy + (piece.y + cell.y) * 12, 11, 11);
        }
      }
      ctx.fillStyle = GREEN;
      ctx.fillText(goalText, 12, 18);
    } else if (spec.mode === "boxer") {
      ctx.fillStyle = GREEN;
      ctx.fillRect(130, 70, 90, 90);
      ctx.fillStyle = LIME;
      ctx.fillRect(player.x, player.y, 28, 28);
      const foe = foes[0];
      ctx.fillText(foe?.kind === 1 ? "DODGE LEFT" : foe?.kind === 2 ? "DODGE RIGHT" : foe?.kind === 3 ? "DUCK / UP" : "WAIT", 20, 30);
    } else if (spec.mode === "missile" || spec.mode === "gun") {
      ctx.fillStyle = GREEN;
      for (const city of items) ctx.fillRect(city.x, city.y, city.w, city.h);
      ctx.fillStyle = RED;
      for (const foe of foes) ctx.fillRect(foe.x, foe.y, foe.w, foe.h);
      ctx.fillStyle = LIME;
      ctx.strokeStyle = LIME;
      ctx.strokeRect(player.x - 6, player.y - 6, 14, 14);
      ctx.fillRect(player.x, player.y, 3, 3);
    } else if (spec.mode === "rocks") {
      ctx.fillStyle = GREEN;
      for (const rock of foes) ctx.fillRect(rock.x, rock.y, rock.w, rock.h);
      ctx.fillStyle = LIME;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(angle);
      ctx.fillRect(-6, -4, 14, 8);
      ctx.restore();
      for (const shot of items) ctx.fillRect(shot.x, shot.y, 3, 3);
    } else if (spec.mode === "soccer" || spec.mode === "hoop") {
      ctx.fillStyle = GREEN;
      for (const post of items) ctx.fillRect(post.x, post.y, post.w, post.h);
      ctx.fillRect(player.x, player.y, 16, 16);
      ctx.fillStyle = LIME;
      ctx.fillRect(ball.x, ball.y, 7, 7);
    } else if (spec.mode === "bombman") {
      const cell = 16;
      for (let y = 0; y < MH; y += 1) {
        for (let x = 0; x < MW; x += 1) {
          if (maze[y]?.[x] === 1) {
            ctx.fillStyle = GREEN;
            ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
          }
        }
      }
      ctx.fillStyle = LIME;
      ctx.fillRect(player.x * cell + 3, player.y * cell + 3, 10, 10);
      ctx.fillStyle = RED;
      const ghost = foes[0];
      if (ghost) ctx.fillRect(ghost.x * cell + 3, ghost.y * cell + 3, 10, 10);
      if (items[0]) {
        ctx.fillStyle = LIME;
        ctx.fillRect(items[0].x * cell + 4, items[0].y * cell + 4, 8, 8);
      }
    } else if (spec.mode === "maze") {
      const cell = 16;
      for (let y = 0; y < MH; y += 1) {
        for (let x = 0; x < MW; x += 1) {
          if (maze[y]?.[x] === 1) {
            ctx.fillStyle = GREEN;
            ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
          }
        }
      }
      ctx.fillStyle = LIME;
      for (const pellet of pellets) ctx.fillRect(pellet.x * cell + 6, pellet.y * cell + 6, 4, 4);
      ctx.fillRect(player.x * cell + 3, player.y * cell + 3, 10, 10);
      ctx.fillStyle = RED;
      const ghost = foes[0];
      if (ghost) ctx.fillRect(ghost.x * cell + 3, ghost.y * cell + 3, 10, 10);
    } else if (spec.mode === "memory") {
      for (let i = 0; i < tiles.length; i += 1) {
        const tile = tiles[i];
        if (!tile) continue;
        const x = 24 + (i % 4) * 70;
        const y = 28 + Math.floor(i / 4) * 46;
        ctx.fillStyle = i === cursor ? LIME : GREEN;
        ctx.strokeStyle = i === cursor ? LIME : GREEN;
        ctx.strokeRect(x, y, 60, 38);
        if (tile.open || tile.done) {
          ctx.font = "18px monospace";
          ctx.fillText(String(tile.v + 1), x + 22, y + 26);
        }
      }
    } else if (spec.mode === "climb") {
      items.forEach((plat, i) => {
        ctx.fillStyle = i === items.length - 1 ? LIME : GREEN;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      });
      ctx.fillStyle = LIME;
      ctx.fillRect(player.x, player.y, player.w, player.h);
    } else if (spec.mode === "stack") {
      ctx.fillStyle = GREEN;
      for (const block of items) ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.fillStyle = LIME;
      ctx.fillRect(stackX, stackY, stackW, 10);
    } else if (spec.mode === "bricks" || spec.mode === "pong") {
      ctx.fillStyle = GREEN;
      for (const brick of items) ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillRect(player.x, player.y, player.w, player.h);
      for (const foe of foes) ctx.fillRect(foe.x, foe.y, foe.w, foe.h);
      ctx.fillStyle = LIME;
      ctx.fillRect(ball.x, ball.y, 5, 5);
    } else {
      ctx.fillStyle = GREEN;
      for (const item of items) ctx.fillRect(item.x, item.y, item.w, item.h);
      ctx.fillStyle = RED;
      for (const foe of foes) {
        if (foe.kind === 1) {
          ctx.fillStyle = LIME;
          ctx.beginPath();
          ctx.arc(foe.x + 6, foe.y + 6, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = RED;
        } else ctx.fillRect(foe.x, foe.y, foe.w, foe.h);
      }
      ctx.fillStyle = LIME;
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }
  };

  const loop = (time: number) => {
    if (!running) {
      draw();
      return;
    }
    if (!paused) {
      const dt = last ? time - last : 16;
      last = time;
      acc += dt;
      while (acc > 16) {
        acc -= 16;
        if (!over) step();
      }
    } else {
      last = time;
    }
    draw();
    raf = requestAnimationFrame(loop);
  };

  return {
    start() {
      over = false;
      paused = false;
      running = true;
      level = 1;
      lives = scale.lives;
      hitsTaken = 0;
      setScore(0);
      setupLevel();
      hooks.onStatus("PLAY");
      last = 0;
      acc = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      paused = false;
      cancelAnimationFrame(raf);
      hooks.onStatus("STOP");
    },
    restart() {
      this.start();
    },
    pause() {
      if (!running || over) return;
      paused = true;
      hooks.onStatus("PAUSE");
      hooks.onSfx("pause");
    },
    resume() {
      if (!running || over) return;
      paused = false;
      hooks.onStatus("PLAY");
    },
    press(code, down) {
      if (down) keys.add(code);
      else keys.delete(code);
      if (down && code === "Enter" && over) this.start();
    },
  };
}
