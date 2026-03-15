import type { GitClient } from "./git-client";

export type ParserName =
  | "openapi"
  | "entities"
  | "events"
  | "dependencies"
  | "docs"
  | "changelog";

export const ALL_PARSERS: ParserName[] = [
  "openapi",
  "entities",
  "events",
  "dependencies",
  "docs",
  "changelog",
];

export interface ChangeDetectionResult {
  mode: "full" | "incremental";
  parsersToRun: Set<ParserName>;
  changedFiles: string[];
  reason: string;
}

const PATH_RULES: Array<{ pattern: RegExp; parsers: ParserName[] }> = [
  { pattern: /^services\/[^/]+\/src\/.*controller/, parsers: ["openapi"] },
  { pattern: /^services\/[^/]+\/src\/.*\.dto/, parsers: ["openapi"] },
  { pattern: /^services\/[^/]+\/src\/entities\//, parsers: ["entities"] },
  { pattern: /^services\/[^/]+\/src\/schemas\//, parsers: ["entities"] },
  { pattern: /^packages\/kafka\//, parsers: ["events"] },
  {
    pattern: /^(services|packages|apps)\/[^/]+\/package\.json$/,
    parsers: ["dependencies"],
  },
  { pattern: /^package\.json$/, parsers: ["dependencies"] },
  { pattern: /^ARCHITECTURE\.md$/, parsers: ["dependencies"] },
  { pattern: /^docs\//, parsers: ["docs"] },
  { pattern: /^packages\/[^/]+\/README\.md$/, parsers: ["docs"] },
  { pattern: /^services\/[^/]+\/README\.md$/, parsers: ["docs"] },
];

/** Map output directory category back to the parser that generates it */
export const CATEGORY_TO_PARSER: Record<string, ParserName> = {
  api: "openapi",
  models: "entities",
  events: "events",
  architecture: "dependencies",
  docs: "docs",
  changelog: "changelog",
};

function matchParsers(filePath: string): ParserName[] {
  const matched: ParserName[] = [];
  for (const rule of PATH_RULES) {
    if (rule.pattern.test(filePath)) {
      matched.push(...rule.parsers);
    }
  }
  return matched;
}

export async function detectChanges(opts: {
  webhookFiles?: string[];
  gitClient?: GitClient;
  lastCommitHash?: string;
  force?: boolean;
}): Promise<ChangeDetectionResult> {
  const fullResult = (reason: string): ChangeDetectionResult => ({
    mode: "full",
    parsersToRun: new Set(ALL_PARSERS),
    changedFiles: [],
    reason,
  });

  if (opts.force) {
    return fullResult("Force flag set");
  }

  if (!opts.lastCommitHash) {
    return fullResult("No previous generation state (first run)");
  }

  // Get changed files from webhook payload or git diff
  let changedFiles: string[] = [];

  if (opts.webhookFiles && opts.webhookFiles.length > 0) {
    changedFiles = opts.webhookFiles;
  } else if (opts.gitClient && opts.lastCommitHash) {
    try {
      changedFiles = await opts.gitClient.getChangedFiles(
        opts.lastCommitHash,
        "HEAD"
      );
    } catch {
      return fullResult(
        `Git diff failed (commit ${opts.lastCommitHash.slice(0, 8)} may be outside shallow clone depth)`
      );
    }
  }

  if (changedFiles.length === 0) {
    return fullResult("No changed files resolved");
  }

  if (changedFiles.length > 50) {
    return fullResult(
      `${changedFiles.length} files changed (>50 threshold, full regen cheaper)`
    );
  }

  // Map changed files to parsers
  const parsersToRun = new Set<ParserName>();
  let hasNonDocsChanges = false;

  for (const file of changedFiles) {
    const matched = matchParsers(file);
    if (matched.length > 0) {
      for (const p of matched) {
        parsersToRun.add(p);
      }
      if (!matched.every((p) => p === "docs")) {
        hasNonDocsChanges = true;
      }
    } else {
      // Unmatched files → could affect changelog
      hasNonDocsChanges = true;
    }
  }

  // Changelog always runs unless only docs/ changed
  if (hasNonDocsChanges) {
    parsersToRun.add("changelog");
  }

  // If no parsers matched at all, run changelog at minimum
  if (parsersToRun.size === 0) {
    parsersToRun.add("changelog");
  }

  const parserList = [...parsersToRun].join(", ");
  return {
    mode: "incremental",
    parsersToRun,
    changedFiles,
    reason: `${changedFiles.length} files changed → running [${parserList}]`,
  };
}
