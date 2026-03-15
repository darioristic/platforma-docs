import { promises as fs } from "fs";
import path from "path";

const STATE_FILE = path.join(process.cwd(), ".generation-state.json");

export interface GenerationState {
  lastCommitHash: string;
  lastRunAt: string;
  lastRunDurationMs: number;
  parsersRun: string[];
  generatedFiles: string[];
}

export async function loadState(): Promise<GenerationState | null> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw) as GenerationState;
  } catch {
    return null;
  }
}

export async function saveState(state: GenerationState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}
