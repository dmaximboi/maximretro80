import { deleteSave, listSaves, putSave, type SaveRecord } from "../storage/stores";

export async function writeSaveState(gameId: string, payload: unknown, label = "Quick State"): Promise<SaveRecord> {
  const record: SaveRecord = {
    id: `${gameId}-${Date.now()}`,
    gameId,
    kind: "state",
    label,
    payload,
    createdAt: Date.now(),
  };
  await putSave(record);
  return record;
}

export async function writeBatterySave(gameId: string, payload: unknown): Promise<SaveRecord> {
  const existing = (await listSaves(gameId)).find((save) => save.kind === "save");
  const record: SaveRecord = {
    id: existing?.id ?? `${gameId}-battery`,
    gameId,
    kind: "save",
    label: "Battery Save",
    payload,
    createdAt: Date.now(),
  };
  await putSave(record);
  return record;
}

export async function readLatestState(gameId: string): Promise<SaveRecord | undefined> {
  const states = (await listSaves(gameId)).filter((save) => save.kind === "state");
  return states.sort((a, b) => b.createdAt - a.createdAt)[0];
}

export async function removeSave(id: string): Promise<void> {
  await deleteSave(id);
}
