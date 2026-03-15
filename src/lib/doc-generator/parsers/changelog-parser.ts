import { type SimpleGit } from "simple-git";
import simpleGit from "simple-git";

export interface ChangelogEntry {
  hash: string;
  date: string;
  author: string;
  message: string;
  type: "feat" | "fix" | "refactor" | "chore" | "docs" | "perf" | "breaking" | "other";
  scope?: string;
  body?: string;
  services: string[];
}

export interface ChangelogGroup {
  type: ChangelogEntry["type"];
  label: string;
  entries: ChangelogEntry[];
}

export async function parseChangelog(
  repoPath: string,
  since?: string
): Promise<ChangelogEntry[]> {
  const git: SimpleGit = simpleGit(repoPath);
  const logOptions: Record<string, string | number | undefined> = {
    maxCount: 200,
  };

  if (since) {
    logOptions["--since"] = since;
  }

  const log = await git.log(logOptions);
  const entries: ChangelogEntry[] = [];

  for (const commit of log.all) {
    const parsed = parseConventionalCommit(commit.message);

    // Determine affected services from diff
    let services: string[] = [];
    try {
      const diff = await git.diff([`${commit.hash}~1`, commit.hash, "--name-only"]);
      services = extractAffectedServices(diff);
    } catch {
      // First commit or other error
    }

    entries.push({
      hash: commit.hash.slice(0, 8),
      date: commit.date,
      author: commit.author_name,
      message: parsed.description,
      type: parsed.type,
      scope: parsed.scope,
      services,
    });
  }

  return entries;
}

export function groupChangelog(entries: ChangelogEntry[]): ChangelogGroup[] {
  const typeLabels: Record<ChangelogEntry["type"], string> = {
    breaking: "Breaking Changes",
    feat: "Features",
    fix: "Bug Fixes",
    perf: "Performance",
    refactor: "Refactoring",
    docs: "Documentation",
    chore: "Maintenance",
    other: "Other Changes",
  };

  const groups = new Map<ChangelogEntry["type"], ChangelogEntry[]>();

  for (const entry of entries) {
    if (!groups.has(entry.type)) {
      groups.set(entry.type, []);
    }
    groups.get(entry.type)!.push(entry);
  }

  const order: ChangelogEntry["type"][] = ["breaking", "feat", "fix", "perf", "refactor", "docs", "chore", "other"];

  return order
    .filter((type) => groups.has(type))
    .map((type) => ({
      type,
      label: typeLabels[type],
      entries: groups.get(type)!,
    }));
}

function parseConventionalCommit(message: string): {
  type: ChangelogEntry["type"];
  scope?: string;
  description: string;
} {
  // Match: type(scope): description
  const regex = /^(\w+)(?:\(([^)]+)\))?\s*(!)?:\s*(.+)/;
  const match = message.match(regex);

  if (!match) {
    return { type: "other", description: message.split("\n")[0] };
  }

  const [, rawType, scope, breaking, description] = match;

  let type: ChangelogEntry["type"] = "other";
  if (breaking) {
    type = "breaking";
  } else {
    const typeMap: Record<string, ChangelogEntry["type"]> = {
      feat: "feat",
      feature: "feat",
      fix: "fix",
      bugfix: "fix",
      refactor: "refactor",
      chore: "chore",
      docs: "docs",
      perf: "perf",
      performance: "perf",
    };
    type = typeMap[rawType.toLowerCase()] ?? "other";
  }

  return { type, scope, description };
}

function extractAffectedServices(diffOutput: string): string[] {
  const services = new Set<string>();
  const lines = diffOutput.split("\n");

  for (const line of lines) {
    const match = line.match(/^services\/([^/]+)\//);
    if (match) {
      services.add(match[1]);
    }
  }

  return [...services];
}
