#!/usr/bin/env npx tsx
/**
 * CLI script to generate documentation from cloud-factory repo.
 *
 * Usage:
 *   npx tsx scripts/generate-docs.ts
 *   npx tsx scripts/generate-docs.ts --since=2026-03-01
 *   npx tsx scripts/generate-docs.ts --repo=/path/to/local/repo
 */

import path from "path";
import { runGenerationPipeline } from "../src/lib/doc-generator/pipeline";

async function main() {
  const args = process.argv.slice(2);
  const sinceArg = args.find((a) => a.startsWith("--since="));
  const repoArg = args.find((a) => a.startsWith("--repo="));

  const repoUrl = repoArg
    ? repoArg.split("=")[1]
    : process.env.GITHUB_REPO
    ? `https://github.com/${process.env.GITHUB_REPO}`
    : "https://github.com/darioristic/cloud-factory";

  const outputDir = path.join(process.cwd(), "src", "content", "generated");

  console.log("=== PLATFORMA Docs Generator ===");
  console.log(`Repo: ${repoUrl}`);
  console.log(`Output: ${outputDir}`);
  console.log("");

  const result = await runGenerationPipeline({
    repoUrl,
    token: process.env.GITHUB_TOKEN,
    outputDir,
    changelogSince: sinceArg?.split("=")[1],
  });

  console.log("");
  console.log("=== Generation Complete ===");
  console.log(`Status: ${result.success ? "SUCCESS" : "FAILED"}`);
  console.log(`Commit: ${result.commitHash}`);
  console.log(`Files generated: ${result.filesGenerated}`);
  console.log(`Services: ${result.services.join(", ") || "none found"}`);

  if (result.errors.length > 0) {
    console.log("");
    console.log("Errors:");
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
