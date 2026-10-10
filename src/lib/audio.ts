import type { AudioSettings } from "../storage/stores";
import { playTone, type SfxKind } from "../play/sfx";
import { TunePlayer, tuneForMode, type TuneId } from "../play/music";

export class AudioBus {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private settings: AudioSettings;
  private player: TunePlayer | null = null;
  private song: TuneId | null = null;

  constructor(settings: AudioSettings) {
    this.settings = settings;
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      const context = new AudioContext();
      this.context = context;
      this.master = context.createGain();
      this.music = context.createGain();
      this.sfx = context.createGain();
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(context.destination);
      this.player = new TunePlayer(context, this.music);
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.apply(this.settings);
  }

  apply(settings: AudioSettings): void {
    this.settings = settings;
    if (!this.master || !this.music || !this.sfx) return;
    const mute = settings.muted ? 0 : 1;
    this.master.gain.value = settings.master * mute;
    this.music.gain.value = settings.music;
    this.sfx.gain.value = settings.sfx;
  }

  getSfxInput(): GainNode | null {
    return this.sfx;
  }

  getContext(): AudioContext | null {
    return this.context;
  }

  beep(kind: "ok" | "move" | "warn" = "move"): void {
    this.playSfx(kind === "ok" ? "success" : kind === "warn" ? "fail" : "action");
  }

  playSfx(kind: SfxKind): void {
    const context = this.context;
    const dest = this.sfx;
    if (!context || !dest || this.settings.muted || this.settings.master <= 0) return;
    playTone(context, dest, kind);
  }

  playTune(mode: string, scene: number): void {
    if (!this.player || this.settings.muted || this.settings.master <= 0) return;
    const id = tuneForMode(mode, scene);
    if (this.song === id) return;
    this.song = id;
    this.player.start(id, scene);
  }

  stopTune(): void {
    this.player?.stop();
    this.song = null;
  }
}
