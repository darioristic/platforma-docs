import { GitClient } from "./git-client";
import { parseServiceApis } from "./parsers/openapi-parser";
import { parseAllEntities, parseMongooseSchemas } from "./parsers/entity-parser";
import { parseEventSystem } from "./parsers/event-parser";
import { parseDependencyGraph } from "./parsers/dependency-parser";
import { parseChangelog } from "./parsers/changelog-parser";
import { parseDocsFolder } from "./parsers/docs-parser";
import { generateApiMdx } from "./generators/api-mdx-generator";
import { generateModelMdx } from "./generators/model-mdx-generator";
import { generateEventMdx } from "./generators/event-mdx-generator";
import { generateArchitectureMdx } from "./generators/architecture-mdx-generator";
import { generateChangelogMdx } from "./generators/changelog-mdx-generator";
import { generateDocsMdx } from "./generators/docs-mdx-generator";
import { loadState, saveState } from "./generation-state";
import { detectChanges, CATEGORY_TO_PARSER, ALL_PARSERS, type ParserName } from "./change-detector";
import type { GeneratedFile } from "./types";
import fsSync from "fs";
import { promises as fs } from "fs";
import path from "path";

export interface GenerationResult {
  success: boolean;
  commitHash: string;
  timestamp: string;
  filesGenerated: number;
  errors: string[];
  services: string[];
  mode: "full" | "incremental";
  parsersRun: string[];
  staleFilesRemoved: number;
}

interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

async function writeGeneratedFiles(files: GeneratedFile[]): Promise<void> {
  for (const file of files) {
    const dir = path.dirname(file.path);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file.path, file.content, "utf-8");
  }
}

async function removeStaleFiles(
  previousFiles: string[],
  currentFiles: string[],
  parsersRun: Set<ParserName>,
  outputDir: string
): Promise<string[]> {
  const currentSet = new Set(currentFiles);
  const removed: string[] = [];

  for (const prev of previousFiles) {
    // Determine category from file path
    const rel = path.relative(outputDir, prev);
    const category = rel.split(path.sep)[0];
    const parser = CATEGORY_TO_PARSER[category];

    // Only clean files for parsers that actually ran
    if (parser && parsersRun.has(parser) && !currentSet.has(prev)) {
      try {
        await fs.unlink(prev);
        removed.push(prev);
        console.log(`[pipeline] Removed stale: ${rel}`);
      } catch {
        // File already gone, ignore
      }
    }
  }

  return removed;
}

/**
 * Scan output directory for all existing .mdx files (for nav rebuild).
 */
async function scanExistingFiles(outputDir: string): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.name.endsWith(".mdx")) {
        const content = await fs.readFile(full, "utf-8");
        files.push({ path: full, content });
      }
    }
  }

  await walk(outputDir);
  return files;
}

/**
 * Build navigation JSON from generated files for sidebar integration.
 */
function buildGeneratedNav(files: GeneratedFile[], outputDir: string): NavSection[] {
  const sections: NavSection[] = [];
  const groups = new Map<string, NavItem[]>();

  for (const file of files) {
    const relativePath = path.relative(outputDir, file.path);
    const parts = relativePath.split(path.sep);

    if (parts.length < 2) continue;

    const category = parts[0];
    const slug = parts.slice(0, -1).join("/") + "/" + path.basename(parts[parts.length - 1], ".mdx");

    const titleMatch = file.content.match(/^title:\s*"?([^"\n]+)"?/m);
    const title = titleMatch ? titleMatch[1] : path.basename(file.path, ".mdx");

    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push({
      title,
      href: `/generated/${slug}`,
    });
  }

  const categoryLabels: Record<string, string> = {
    docs: "Project Documentation",
    api: "API (Auto-Generated)",
    models: "Data Models",
    events: "Events",
    architecture: "System Architecture",
    changelog: "Changelog",
  };

  const order = ["docs", "api", "models", "events", "architecture", "changelog"];

  for (const cat of order) {
    const items = groups.get(cat);
    if (items && items.length > 0) {
      sections.push({
        title: categoryLabels[cat] ?? cat,
        items,
      });
    }
  }

  return sections;
}

export async function runGenerationPipeline(options: {
  repoUrl: string;
  token?: string;
  outputDir: string;
  changelogSince?: string;
  changedFiles?: string[];
  force?: boolean;
}): Promise<GenerationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const allFiles: GeneratedFile[] = [];
  const services: string[] = [];
  let commitHash = "";
  const timestamp = new Date().toISOString();

  // Step 1: Clone or pull the repo
  const git = new GitClient({
    repoUrl: options.repoUrl,
    token: options.token,
  });

  let repoDir: string;
  try {
    repoDir = await git.ensureRepo();
    commitHash = await git.getLatestCommitHash();
    console.log(`[pipeline] Repo ready at ${repoDir}, commit: ${commitHash.slice(0, 8)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      commitHash: "",
      timestamp,
      filesGenerated: 0,
      errors: [`Failed to clone/pull repository: ${message}`],
      services: [],
      mode: "full",
      parsersRun: [],
      staleFilesRemoved: 0,
    };
  }

  // Step 2: Load previous state and detect what changed
  const previousState = await loadState();
  const detection = await detectChanges({
    webhookFiles: options.changedFiles,
    gitClient: git,
    lastCommitHash: previousState?.lastCommitHash,
    force: options.force,
  });

  const { parsersToRun } = detection;
  const parsersRunArray = [...parsersToRun];

  console.log(`[pipeline] ${detection.mode.toUpperCase()} mode: ${detection.reason}`);
  if (detection.mode === "incremental") {
    const skipped = ALL_PARSERS.filter((p) => !parsersToRun.has(p));
    if (skipped.length > 0) {
      console.log(`[pipeline] Skipping parsers: [${skipped.join(", ")}]`);
    }
  }

  // Step 3: Run only affected parsers + generators

  if (parsersToRun.has("openapi")) {
    try {
      console.log("[pipeline] Parsing API controllers...");
      const apiServices = parseServiceApis(repoDir);
      for (const svc of apiServices) {
        services.push(svc.serviceName);
        console.log(`  Found ${svc.endpoints.length} endpoints in ${svc.serviceName}`);
      }
      const apiFiles = generateApiMdx(apiServices, options.outputDir);
      allFiles.push(...apiFiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`OpenAPI parser failed: ${message}`);
      console.error(`[pipeline] OpenAPI error: ${message}`);
    }
  }

  if (parsersToRun.has("entities")) {
    try {
      console.log("[pipeline] Parsing entities...");
      const entityServices = parseAllEntities(repoDir);
      const mongooseSchemas = parseMongooseSchemas(repoDir);
      console.log(`  Found ${entityServices.length} entity groups, ${mongooseSchemas.length} Mongoose schemas`);
      const modelFiles = generateModelMdx(entityServices, mongooseSchemas, options.outputDir);
      allFiles.push(...modelFiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Entity parser failed: ${message}`);
      console.error(`[pipeline] Entity error: ${message}`);
    }
  }

  if (parsersToRun.has("events")) {
    try {
      console.log("[pipeline] Parsing events...");
      const eventSystem = parseEventSystem(repoDir);
      console.log(`  Found ${eventSystem.domains.length} event domains`);
      const eventFiles = generateEventMdx(eventSystem, options.outputDir);
      allFiles.push(...eventFiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Event parser failed: ${message}`);
      console.error(`[pipeline] Event error: ${message}`);
    }
  }

  if (parsersToRun.has("dependencies")) {
    try {
      console.log("[pipeline] Parsing dependencies...");
      const depGraph = parseDependencyGraph(repoDir);
      const archMd = fsSync.existsSync(path.join(repoDir, "ARCHITECTURE.md"))
        ? fsSync.readFileSync(path.join(repoDir, "ARCHITECTURE.md"), "utf-8")
        : null;
      console.log(`  Found ${depGraph.packages.length} packages, ${depGraph.internalDeps.length} internal deps`);
      const archFiles = generateArchitectureMdx(depGraph, archMd, options.outputDir);
      allFiles.push(...archFiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Dependency parser failed: ${message}`);
      console.error(`[pipeline] Dependency error: ${message}`);
    }
  }

  if (parsersToRun.has("docs")) {
    try {
      console.log("[pipeline] Parsing docs/ folder...");
      const docFiles = await parseDocsFolder(repoDir);
      console.log(`  Found ${docFiles.length} documentation files`);
      const docsGenerated = generateDocsMdx(docFiles, options.outputDir);
      allFiles.push(...docsGenerated);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Docs parser failed: ${message}`);
      console.error(`[pipeline] Docs error: ${message}`);
    }
  }

  if (parsersToRun.has("changelog")) {
    try {
      console.log("[pipeline] Parsing changelog...");
      const entries = await parseChangelog(repoDir, options.changelogSince);
      console.log(`  Found ${entries.length} commits`);
      const changelogFiles = generateChangelogMdx(entries, options.outputDir);
      allFiles.push(...changelogFiles);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Changelog parser failed: ${message}`);
      console.error(`[pipeline] Changelog error: ${message}`);
    }
  }

  // Step 4: Write generated files
  try {
    console.log(`[pipeline] Writing ${allFiles.length} files...`);
    await writeGeneratedFiles(allFiles);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to write files: ${message}`);
  }

  // Step 5: Clean up stale files
  let staleFilesRemoved = 0;
  if (previousState?.generatedFiles) {
    try {
      const currentFilePaths = allFiles.map((f) => f.path);
      const removed = await removeStaleFiles(
        previousState.generatedFiles,
        currentFilePaths,
        parsersToRun,
        options.outputDir
      );
      staleFilesRemoved = removed.length;
      if (staleFilesRemoved > 0) {
        console.log(`[pipeline] Removed ${staleFilesRemoved} stale files`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Stale file cleanup failed: ${message}`);
    }
  }

  // Step 6: Rebuild navigation from ALL existing files on disk
  // (includes files from parsers that didn't run this cycle)
  try {
    const allExistingFiles = await scanExistingFiles(options.outputDir);
    const generatedNav = buildGeneratedNav(allExistingFiles, options.outputDir);
    const navJsonPath = path.join(process.cwd(), "src", "lib", "generated-nav.json");
    await fs.writeFile(navJsonPath, JSON.stringify(generatedNav, null, 2), "utf-8");
    console.log(`[pipeline] Navigation JSON written with ${generatedNav.length} sections`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to write navigation: ${message}`);
  }

  // Step 7: Save generation state
  try {
    // Collect all file paths on disk for next run's stale detection
    const allExisting = await scanExistingFiles(options.outputDir);
    await saveState({
      lastCommitHash: commitHash,
      lastRunAt: timestamp,
      lastRunDurationMs: Date.now() - startTime,
      parsersRun: parsersRunArray,
      generatedFiles: allExisting.map((f) => f.path),
    });
    console.log(`[pipeline] State saved (commit: ${commitHash.slice(0, 8)})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to save generation state: ${message}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[pipeline] Done in ${duration}s! ${allFiles.length} files, ${errors.length} errors (${detection.mode})`);

  return {
    success: errors.length === 0,
    commitHash,
    timestamp,
    filesGenerated: allFiles.length,
    errors,
    services: [...new Set(services)],
    mode: detection.mode,
    parsersRun: parsersRunArray,
    staleFilesRemoved,
  };
}
