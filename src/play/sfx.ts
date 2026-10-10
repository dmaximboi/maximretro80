export type SfxKind = "fail" | "success" | "action" | "pickup" | "level" | "pause";

const TONE: Record<SfxKind, { freq: number; time: number; type: OscillatorType }> = {
  fail: { freq: 140, time: 0.22, type: "square" },
  success: { freq: 620, time: 0.16, type: "triangle" },
  action: { freq: 280, time: 0.05, type: "square" },
  pickup: { freq: 740, time: 0.07, type: "square" },
  level: { freq: 880, time: 0.2, type: "triangle" },
  pause: { freq: 220, time: 0.08, type: "sine" },
};

export function playTone(context: AudioContext, dest: GainNode, kind: SfxKind): void {
  const tone = TONE[kind];
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = tone.type;
  osc.frequency.value = tone.freq;
  gain.gain.value = 0.07;
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  if (kind === "success" || kind === "level") {
    osc.frequency.exponentialRampToValueAtTime(tone.freq * 1.5, context.currentTime + tone.time);
  }
  if (kind === "fail") {
    osc.frequency.exponentialRampToValueAtTime(70, context.currentTime + tone.time);
  }
  osc.stop(context.currentTime + tone.time);
}
