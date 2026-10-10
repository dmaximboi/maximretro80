import type { GameCatalogEntry } from "../games/gameTypes";
import { deleteRom, getRom, listRoms, putRom, type RomRecord } from "../storage/stores";

function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export async function importRomFile(game: GameCatalogEntry, file: File): Promise<RomRecord> {
  const ext = extensionOf(file.name);
  if (game.romExtensions.length > 0 && !game.romExtensions.includes(ext)) {
    throw new Error(
      `This file does not match the expected ${game.platform} extensions: ${game.romExtensions.join(", ").toUpperCase()}.`,
    );
  }
  const data = await file.arrayBuffer();
  const record: RomRecord = {
    gameId: game.id,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    data,
    importedAt: Date.now(),
  };
  await putRom(record);
  return record;
}

export async function removeRom(gameId: string): Promise<void> {
  await deleteRom(gameId);
}

export async function installedRomIds(): Promise<Set<string>> {
  const roms = await listRoms();
  return new Set(roms.map((rom) => rom.gameId));
}

export async function loadRomBytes(gameId: string): Promise<RomRecord | undefined> {
  return getRom(gameId);
}

export function bufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let result = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    result += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return result;
}
