export type TuneId =
  | "race"
  | "puzzle"
  | "action"
  | "maze"
  | "sport"
  | "fight"
  | "sky"
  | "chip";

const TUNES: Record<TuneId, { bpm: number; wave: OscillatorType; lead: number[]; bass: number[] }> = {
  race: { bpm: 148, wave: "square", lead: [0, 4, 7, 12, 7, 4, 0, 7], bass: [0, 0, 7, 5] },
  puzzle: { bpm: 112, wave: "triangle", lead: [0, 2, 4, 7, 4, 2, 0, -1], bass: [0, -5, -7, -5] },
  action: { bpm: 136, wave: "square", lead: [0, 7, 5, 7, 12, 7, 5, 3], bass: [0, 0, 5, 7] },
  maze: { bpm: 96, wave: "sine", lead: [0, 3, 7, 3, 8, 7, 3, 0], bass: [0, -4, -7, -4] },
  sport: { bpm: 128, wave: "triangle", lead: [0, 4, 9, 4, 7, 12, 7, 4], bass: [0, 4, 5, 7] },
  fight: { bpm: 142, wave: "sawtooth", lead: [0, 1, 0, 5, 7, 5, 3, 0], bass: [0, 0, -2, 0] },
  sky: { bpm: 108, wave: "sine", lead: [0, 7, 12, 16, 12, 7, 4, 7], bass: [0, 4, 7, 4] },
  chip: { bpm: 120, wave: "square", lead: [0, 5, 9, 12, 9, 5, 4, 2], bass: [0, 5, 7, 5] },
};

export function tuneForMode(mode: string, scene: number): TuneId {
  const map: Record<string, TuneId> = {
    race: "race",
    tetris: "puzzle",
    bricks: "puzzle",
    memory: "puzzle",
    stack: "puzzle",
    snake: "chip",
    maze: "maze",
    dungeon: "maze",
    bombman: "maze",
    dodge: "action",
    rungun: "action",
    invaders: "action",
    vert: "action",
    rail: "sky",
    flap: "sky",
    gun: "action",
    missile: "action",
    rocks: "sky",
    boxer: "fight",
    brawler: "fight",
    jump: "fight",
    soccer: "sport",
    hoop: "sport",
    pong: "sport",
    smash: "sport",
    catch: "sport",
    coins: "chip",
    climb: "chip",
    barrel: "chip",
    cross: "chip",
  };
  const ids: TuneId[] = ["race", "puzzle", "action", "maze", "sport", "fight", "sky", "chip"];
  return map[mode] ?? ids[scene % ids.length] ?? "chip";
}

function hz(note: number, root: number): number {
  return root * Math.pow(2, note / 12);
}

export class TunePlayer {
  private timer = 0;
  private step = 0;
  private playing = false;
  private context: AudioContext;
  private dest: GainNode;

  constructor(context: AudioContext, dest: GainNode) {
    this.context = context;
    this.dest = dest;
  }

  start(id: TuneId, scene: number): void {
    this.stop();
    const tune = TUNES[id];
    const root = 196 * Math.pow(2, (scene % 5) / 12);
    const beat = 60 / tune.bpm;
    this.playing = true;
    this.step = 0;
    const tick = () => {
      if (!this.playing) return;
      const i = this.step % tune.lead.length;
      const lead = tune.lead[i] ?? 0;
      const bass = tune.bass[i % tune.bass.length] ?? 0;
      this.blip(hz(lead, root), beat * 0.72, tune.wave, 0.045);
      this.blip(hz(bass, root / 2), beat * 0.9, "triangle", 0.03);
      this.step += 1;
    };
    tick();
    this.timer = window.setInterval(tick, beat * 1000);
  }

  stop(): void {
    this.playing = false;
    window.clearInterval(this.timer);
    this.timer = 0;
    this.step = 0;
  }

  private blip(freq: number, time: number, type: OscillatorType, vol: number): void {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + time);
    osc.connect(gain);
    gain.connect(this.dest);
    osc.start();
    osc.stop(this.context.currentTime + time);
  }
}

export function steps(): readonly number[] {
  return [0, 0.3, 0.6, 1];
}

export function stepLabel(step: number): string {
  return ["OFF", "30", "60", "100"][step] ?? "OFF";
}
