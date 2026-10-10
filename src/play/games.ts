import type { BuiltinKind } from "./builtinMap";

export type GameHooks = {
  onScore: (score: number) => void;
  onStatus: (status: string) => void;
  onOver: (score: number) => void;
};

export type PlayableGame = {
  start: () => void;
  stop: () => void;
  restart: () => void;
  press: (code: string, down: boolean) => void;
};

type Rect = { x: number; y: number; w: number; h: number };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hits(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createBuiltinGame(
  canvas: HTMLCanvasElement,
  kind: BuiltinKind,
  speed: number,
  hooks: GameHooks,
): PlayableGame {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable.");

  const W = 320;
  const H = 220;
  canvas.width = W;
  canvas.height = H;

  const keys = new Set<string>();
  let raf = 0;
  let running = false;
  let over = false;
  let score = 0;
  let acc = 0;
  let last = 0;

  const setScore = (value: number) => {
    score = value;
    hooks.onScore(score);
  };

  const die = () => {
    if (over) return;
    over = true;
    running = false;
    hooks.onStatus("GAME OVER");
    hooks.onOver(score);
  };

  const snake = {
    body: [{ x: 8, y: 7 }],
    dir: { x: 1, y: 0 },
    next: { x: 1, y: 0 },
    food: { x: 14, y: 8 },
    tick: 0,
  };

  const dodge = {
    x: 150,
    y: 190,
    hazards: [] as Rect[],
    spawn: 0,
  };

  const bricks: Rect[] = [];
  const breakout = {
    paddle: { x: 130, y: 200, w: 56, h: 6 },
    ball: { x: 160, y: 160, vx: 2.1, vy: -2.4, s: 5 },
    launched: false,
  };

  const invaders = {
    ship: { x: 148, y: 198, w: 18, h: 8 },
    aliens: [] as Rect[],
    shots: [] as Rect[],
    dir: 1,
    clock: 0,
    cool: 0,
  };

  const pong = {
    player: { x: 8, y: 90, w: 6, h: 36 },
    cpu: { x: 306, y: 90, w: 6, h: 36 },
    ball: { x: 160, y: 110, vx: 2.4, vy: 1.6, s: 5 },
  };

  const runner = {
    x: 40,
    y: 168,
    vy: 0,
    onGround: true,
    obstacles: [] as Rect[],
    spawn: 0,
  };

  const placeFood = () => {
    snake.food = {
      x: 1 + Math.floor(Math.random() * 18),
      y: 1 + Math.floor(Math.random() * 12),
    };
  };

  const resetBricks = () => {
    bricks.length = 0;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 10; col += 1) {
        bricks.push({ x: 14 + col * 30, y: 24 + row * 12, w: 26, h: 8 });
      }
    }
  };

  const resetAliens = () => {
    invaders.aliens = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        invaders.aliens.push({ x: 24 + col * 32, y: 20 + row * 18, w: 16, h: 10 });
      }
    }
  };

  const reset = () => {
    over = false;
    running = true;
    setScore(0);
    hooks.onStatus("PLAY");
    keys.clear();
    snake.body = [{ x: 8, y: 7 }];
    snake.dir = { x: 1, y: 0 };
    snake.next = { x: 1, y: 0 };
    placeFood();
    dodge.x = 150;
    dodge.hazards = [];
    dodge.spawn = 0;
    breakout.paddle.x = 130;
    breakout.ball = { x: 160, y: 160, vx: 2.1 * speed, vy: -2.4 * speed, s: 5 };
    breakout.launched = false;
    resetBricks();
    invaders.ship.x = 148;
    invaders.shots = [];
    invaders.dir = 1;
    invaders.clock = 0;
    resetAliens();
    pong.player.y = 90;
    pong.cpu.y = 90;
    pong.ball = { x: 160, y: 110, vx: 2.4 * speed, vy: 1.6 * speed, s: 5 };
    runner.y = 168;
    runner.vy = 0;
    runner.onGround = true;
    runner.obstacles = [];
    runner.spawn = 0;
  };

  const drawBg = () => {
    ctx.fillStyle = "#031208";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(60,255,110,0.06)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  };

  const pix = (x: number, y: number, w: number, h: number, color = "#3cff6e") => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };

  const stepSnake = () => {
    if (keys.has("ArrowUp") || keys.has("KeyW")) {
      if (snake.dir.y !== 1) snake.next = { x: 0, y: -1 };
    } else if (keys.has("ArrowDown") || keys.has("KeyS")) {
      if (snake.dir.y !== -1) snake.next = { x: 0, y: 1 };
    } else if (keys.has("ArrowLeft") || keys.has("KeyA")) {
      if (snake.dir.x !== 1) snake.next = { x: -1, y: 0 };
    } else if (keys.has("ArrowRight") || keys.has("KeyD")) {
      if (snake.dir.x !== -1) snake.next = { x: 1, y: 0 };
    }
    snake.tick += 1;
    if (snake.tick < Math.max(4, Math.round(10 / speed))) return;
    snake.tick = 0;
    snake.dir = snake.next;
    const head = snake.body[0];
    if (!head) return;
    const next = { x: head.x + snake.dir.x, y: head.y + snake.dir.y };
    if (next.x < 0 || next.y < 0 || next.x > 19 || next.y > 13) {
      die();
      return;
    }
    if (snake.body.some((part) => part.x === next.x && part.y === next.y)) {
      die();
      return;
    }
    snake.body.unshift(next);
    if (next.x === snake.food.x && next.y === snake.food.y) {
      setScore(score + 10);
      placeFood();
    } else {
      snake.body.pop();
    }
  };

  const drawSnake = () => {
    const cell = 16;
    snake.body.forEach((part, i) => pix(part.x * cell, part.y * cell, cell - 1, cell - 1, i === 0 ? "#7cff9a" : "#3cff6e"));
    pix(snake.food.x * cell, snake.food.y * cell, cell - 1, cell - 1, "#c8ff6a");
  };

  const stepDodge = () => {
    const move = (keys.has("ArrowLeft") || keys.has("KeyA") ? -3.2 : 0) + (keys.has("ArrowRight") || keys.has("KeyD") ? 3.2 : 0);
    dodge.x = clamp(dodge.x + move * speed, 8, 296);
    dodge.spawn += 1;
    if (dodge.spawn > Math.max(16, 34 - speed * 8)) {
      dodge.spawn = 0;
      dodge.hazards.push({ x: 8 + Math.random() * 292, y: -12, w: 12 + Math.random() * 18, h: 10 });
    }
    const player = { x: dodge.x, y: dodge.y, w: 16, h: 12 };
    dodge.hazards = dodge.hazards.filter((hazard) => {
      hazard.y += 2.4 * speed;
      if (hits(player, hazard)) die();
      if (hazard.y > H) {
        setScore(score + 1);
        return false;
      }
      return true;
    });
  };

  const drawDodge = () => {
    pix(dodge.x, dodge.y, 16, 12, "#7cff9a");
    for (const hazard of dodge.hazards) pix(hazard.x, hazard.y, hazard.w, hazard.h);
  };

  const stepBreakout = () => {
    const move = (keys.has("ArrowLeft") || keys.has("KeyA") ? -4.2 : 0) + (keys.has("ArrowRight") || keys.has("KeyD") ? 4.2 : 0);
    breakout.paddle.x = clamp(breakout.paddle.x + move * speed, 4, W - breakout.paddle.w - 4);
    if (!breakout.launched) {
      breakout.ball.x = breakout.paddle.x + 24;
      breakout.ball.y = breakout.paddle.y - 10;
      if (keys.has("Space") || keys.has("KeyZ") || keys.has("Enter")) breakout.launched = true;
      return;
    }
    breakout.ball.x += breakout.ball.vx;
    breakout.ball.y += breakout.ball.vy;
    if (breakout.ball.x <= 0 || breakout.ball.x >= W - 5) breakout.ball.vx *= -1;
    if (breakout.ball.y <= 0) breakout.ball.vy *= -1;
    if (breakout.ball.y > H) {
      die();
      return;
    }
    const ball = { x: breakout.ball.x, y: breakout.ball.y, w: breakout.ball.s, h: breakout.ball.s };
    if (hits(ball, breakout.paddle) && breakout.ball.vy > 0) {
      breakout.ball.vy *= -1;
      breakout.ball.vx += (ball.x - (breakout.paddle.x + 28)) * 0.08;
    }
    for (let i = bricks.length - 1; i >= 0; i -= 1) {
      const brick = bricks[i];
      if (!brick) continue;
      if (hits(ball, brick)) {
        bricks.splice(i, 1);
        breakout.ball.vy *= -1;
        setScore(score + 15);
        break;
      }
    }
    if (bricks.length === 0) {
      setScore(score + 100);
      resetBricks();
      breakout.launched = false;
    }
  };

  const drawBreakout = () => {
    pix(breakout.paddle.x, breakout.paddle.y, breakout.paddle.w, breakout.paddle.h, "#7cff9a");
    pix(breakout.ball.x, breakout.ball.y, breakout.ball.s, breakout.ball.s, "#c8ff6a");
    bricks.forEach((brick, i) => pix(brick.x, brick.y, brick.w, brick.h, i % 2 ? "#3cff6e" : "#2aa854"));
  };

  const stepInvaders = () => {
    const move = (keys.has("ArrowLeft") || keys.has("KeyA") ? -3 : 0) + (keys.has("ArrowRight") || keys.has("KeyD") ? 3 : 0);
    invaders.ship.x = clamp(invaders.ship.x + move * speed, 4, 298);
    invaders.cool = Math.max(0, invaders.cool - 1);
    if ((keys.has("Space") || keys.has("KeyZ")) && invaders.cool === 0 && invaders.shots.length < 3) {
      invaders.shots.push({ x: invaders.ship.x + 7, y: invaders.ship.y - 8, w: 3, h: 8 });
      invaders.cool = 12;
    }
    invaders.clock += 1;
    if (invaders.clock > Math.max(10, 22 - speed * 6)) {
      invaders.clock = 0;
      let bounce = false;
      for (const alien of invaders.aliens) {
        alien.x += invaders.dir * 6;
        if (alien.x < 6 || alien.x > 298) bounce = true;
        if (alien.y > 180) die();
      }
      if (bounce) {
        invaders.dir *= -1;
        for (const alien of invaders.aliens) alien.y += 10;
      }
    }
    invaders.shots = invaders.shots.filter((shot) => {
      shot.y -= 5;
      for (let i = invaders.aliens.length - 1; i >= 0; i -= 1) {
        const alien = invaders.aliens[i];
        if (alien && hits(shot, alien)) {
          invaders.aliens.splice(i, 1);
          setScore(score + 20);
          return false;
        }
      }
      return shot.y > 0;
    });
    if (invaders.aliens.length === 0) {
      setScore(score + 200);
      resetAliens();
    }
  };

  const drawInvaders = () => {
    pix(invaders.ship.x, invaders.ship.y, invaders.ship.w, invaders.ship.h, "#7cff9a");
    for (const alien of invaders.aliens) pix(alien.x, alien.y, alien.w, alien.h);
    for (const shot of invaders.shots) pix(shot.x, shot.y, shot.w, shot.h, "#c8ff6a");
  };

  const stepPong = () => {
    const move = (keys.has("ArrowUp") || keys.has("KeyW") ? -3.4 : 0) + (keys.has("ArrowDown") || keys.has("KeyS") ? 3.4 : 0);
    pong.player.y = clamp(pong.player.y + move * speed, 8, 176);
    const target = pong.ball.y - 14;
    pong.cpu.y += clamp((target - pong.cpu.y) * 0.09 * speed, -2.8, 2.8);
    pong.cpu.y = clamp(pong.cpu.y, 8, 176);
    pong.ball.x += pong.ball.vx;
    pong.ball.y += pong.ball.vy;
    if (pong.ball.y < 4 || pong.ball.y > 210) pong.ball.vy *= -1;
    const ball = { x: pong.ball.x, y: pong.ball.y, w: pong.ball.s, h: pong.ball.s };
    if (hits(ball, pong.player) && pong.ball.vx < 0) pong.ball.vx = Math.abs(pong.ball.vx);
    if (hits(ball, pong.cpu) && pong.ball.vx > 0) pong.ball.vx = -Math.abs(pong.ball.vx);
    if (pong.ball.x < -8) die();
    if (pong.ball.x > W + 8) {
      setScore(score + 10);
      pong.ball = { x: 160, y: 110, vx: 2.4 * speed, vy: 1.6 * speed, s: 5 };
    }
  };

  const drawPong = () => {
    pix(pong.player.x, pong.player.y, pong.player.w, pong.player.h, "#7cff9a");
    pix(pong.cpu.x, pong.cpu.y, pong.cpu.w, pong.cpu.h);
    pix(pong.ball.x, pong.ball.y, pong.ball.s, pong.ball.s, "#c8ff6a");
    for (let y = 8; y < H; y += 12) pix(158, y, 3, 6, "#1d5c32");
  };

  const stepRunner = () => {
    if ((keys.has("Space") || keys.has("KeyZ") || keys.has("ArrowUp") || keys.has("KeyW")) && runner.onGround) {
      runner.vy = -8.2;
      runner.onGround = false;
    }
    runner.vy += 0.45;
    runner.y += runner.vy;
    if (runner.y >= 168) {
      runner.y = 168;
      runner.vy = 0;
      runner.onGround = true;
    }
    runner.spawn += 1;
    if (runner.spawn > Math.max(36, 70 - speed * 12)) {
      runner.spawn = 0;
      runner.obstacles.push({ x: 330, y: 172, w: 12 + Math.random() * 16, h: 16 });
    }
    const player = { x: runner.x, y: runner.y, w: 14, h: 18 };
    runner.obstacles = runner.obstacles.filter((obstacle) => {
      obstacle.x -= 3.1 * speed;
      if (hits(player, obstacle)) die();
      if (obstacle.x < -20) {
        setScore(score + 5);
        return false;
      }
      return true;
    });
  };

  const drawRunner = () => {
    pix(0, 188, W, 4, "#1d5c32");
    pix(runner.x, runner.y, 14, 18, "#7cff9a");
    for (const obstacle of runner.obstacles) pix(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
  };

  const frame = (time: number) => {
    if (!running) {
      drawBg();
      if (kind === "snake") drawSnake();
      if (kind === "dodge") drawDodge();
      if (kind === "breakout") drawBreakout();
      if (kind === "invaders") drawInvaders();
      if (kind === "pong") drawPong();
      if (kind === "runner") drawRunner();
      return;
    }
    const dt = last ? time - last : 16;
    last = time;
    acc += dt;
    while (acc > 16) {
      acc -= 16;
      if (kind === "snake") stepSnake();
      if (kind === "dodge") stepDodge();
      if (kind === "breakout") stepBreakout();
      if (kind === "invaders") stepInvaders();
      if (kind === "pong") stepPong();
      if (kind === "runner") stepRunner();
    }
    drawBg();
    if (kind === "snake") drawSnake();
    if (kind === "dodge") drawDodge();
    if (kind === "breakout") drawBreakout();
    if (kind === "invaders") drawInvaders();
    if (kind === "pong") drawPong();
    if (kind === "runner") drawRunner();
    raf = requestAnimationFrame(frame);
  };

  return {
    start() {
      reset();
      last = 0;
      acc = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    restart() {
      this.start();
    },
    press(code, down) {
      if (down) keys.add(code);
      else keys.delete(code);
      if (down && (code === "Enter" || code === "KeyZ") && over) this.start();
    },
  };
}
