import { GitClient } from "./git-client";
import { parseServiceApis } from "./parsers/openapi-parser";
import { parseAllEntities, parseMongooseSchemas } from "./parsers/entity-parser";
import { parseEventSystem } from "./parsers/event-parser";
import { parseDependencyGraph } from "./parsers/dependency-parser";
import { parseChangelog } from "./parsers/changelog-parser";
import { generateApiMdx } from "./generators/api-mdx-generator";
import { generateModelMdx } from "./generators/model-mdx-generator";
import { generateEventMdx } from "./generators/event-mdx-generator";
import { generateArchitectureMdx } from "./generators/architecture-mdx-generator";
import { generateChangelogMdx } from "./generators/changelog-mdx-generator";
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

    const category = parts[0]; // api, models, events, architecture, changelog
    const slug = parts.slice(0, -1).join("/") + "/" + path.basename(parts[parts.length - 1], ".mdx");

    // Extract title from frontmatter
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
    api: "API (Auto-Generated)",
    models: "Data Models",
    events: "Events",
    architecture: "System Architecture",
    changelog: "Changelog",
  };

  const order = ["api", "models", "events", "architecture", "changelog"];

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
}): Promise<GenerationResult> {
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
    };
  }

  // Step 2: Run all parsers + generators (continue on failure)

  // OpenAPI / Controllers
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

  // TypeORM Entities
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

  // Kafka Events
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

  // Dependencies + Architecture
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

  // Changelog
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

  // Step 3: Write all generated files
  try {
    console.log(`[pipeline] Writing ${allFiles.length} files...`);
    await writeGeneratedFiles(allFiles);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to write files: ${message}`);
  }

  // Step 4: Write generated navigation JSON for sidebar
  try {
    const generatedNav = buildGeneratedNav(allFiles, options.outputDir);
    const navJsonPath = path.join(process.cwd(), "src", "lib", "generated-nav.json");
    await fs.writeFile(navJsonPath, JSON.stringify(generatedNav, null, 2), "utf-8");
    console.log(`[pipeline] Navigation JSON written with ${generatedNav.length} sections`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to write navigation: ${message}`);
  }

  console.log(`[pipeline] Done! ${allFiles.length} files, ${errors.length} errors`);

  return {
    success: errors.length === 0,
    commitHash,
    timestamp,
    filesGenerated: allFiles.length,
    errors,
    services: [...new Set(services)],
  };
}
