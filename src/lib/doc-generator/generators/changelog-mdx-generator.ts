import type { ChangelogEntry } from "../parsers/changelog-parser";
import { groupChangelog } from "../parsers/changelog-parser";
import type { GeneratedFile } from "../types";

const typeBadgeVariant: Record<string, string> = {
  breaking: "DELETE",
  feat: "POST",
  fix: "PATCH",
  perf: "GET",
  refactor: "PUT",
  docs: "GET",
  chore: "GET",
  other: "GET",
};

export function generateChangelogMdx(
  entries: ChangelogEntry[],
  outputDir: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const now = new Date().toISOString();
  const groups = groupChangelog(entries);

  let content = `---\ntitle: "Changelog"\n`;
  content += `description: "Recent changes and updates to the platform"\n`;
  content += `section: "changelog"\nauto_generated: true\nlast_synced: "${now}"\n---\n\n`;
  content += `# Changelog\n\n`;
  content += `<Callout type="info">\nAuto-generated from git commit history. Last synced: ${now.split("T")[0]}\n</Callout>\n\n`;
  content += `**Total commits:** ${entries.length}\n\n`;

  if (groups.length === 0) {
    content += `No changes found.\n`;
  }

  for (const group of groups) {
    content += `## ${group.label}\n\n`;

    for (const entry of group.entries) {
      const badge = typeBadgeVariant[entry.type] ?? "GET";
      const scope = entry.scope ? ` **${entry.scope}**:` : "";
      const services = entry.services.length > 0 ? ` (${entry.services.join(", ")})` : "";

      content += `- <Badge variant="${badge}">${entry.type}</Badge>${scope} ${entry.message}${services} — \`${entry.hash}\` ${entry.date.split("T")[0]}\n`;
    }

    content += `\n`;
  }

  files.push({
    path: `${outputDir}/changelog/latest.mdx`,
    content,
  });

  return files;
}
