import type { GenerationResult } from "./pipeline";

interface GenerationStatus {
  status: "idle" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  result?: GenerationResult;
  error?: string;
}

let currentStatus: GenerationStatus = { status: "idle" };

export function getGenerationStatus(): GenerationStatus {
  return currentStatus;
}

export function setGenerationStatus(status: GenerationStatus): void {
  currentStatus = status;
}
