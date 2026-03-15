import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { NavSection, NavItem } from "./navigation";

const GENERATED_DIR = path.join(process.cwd(), "src", "content", "generated");

/**
 * Scan generated content directory and build navigation sections.
 * Returns empty array if no generated content exists.
 */
export function getGeneratedNavigation(): NavSection[] {
  if (!fs.existsSync(GENERATED_DIR)) return [];

  const sections: NavSection[] = [];

  // API Reference (auto-generated)
  const apiDir = path.join(GENERATED_DIR, "api");
  if (fs.existsSync(apiDir)) {
    const items = scanMdxDir(apiDir, "generated/api");
    if (items.length > 0) {
      sections.push({
        title: "API (Auto-Generated)",
        items,
      });
    }
  }

  // Data Models (auto-generated)
  const modelsDir = path.join(GENERATED_DIR, "models");
  if (fs.existsSync(modelsDir)) {
    const items = scanMdxFiles(modelsDir, "generated/models");
    if (items.length > 0) {
      sections.push({
        title: "Data Models",
        items,
      });
    }
  }

  // Events (auto-generated)
  const eventsDir = path.join(GENERATED_DIR, "events");
  if (fs.existsSync(eventsDir)) {
    const items = scanMdxFiles(eventsDir, "generated/events");
    if (items.length > 0) {
      sections.push({
        title: "Events",
        items,
      });
    }
  }

  // Architecture (auto-generated)
  const archDir = path.join(GENERATED_DIR, "architecture");
  if (fs.existsSync(archDir)) {
    const items = scanMdxFiles(archDir, "generated/architecture");
    if (items.length > 0) {
      sections.push({
        title: "System Architecture",
        items,
      });
    }
  }

  // Changelog
  const changelogDir = path.join(GENERATED_DIR, "changelog");
  if (fs.existsSync(changelogDir)) {
    const items = scanMdxFiles(changelogDir, "generated/changelog");
    if (items.length > 0) {
      sections.push({
        title: "Changelog",
        items,
      });
    }
  }

  return sections;
}

function scanMdxDir(dir: string, urlPrefix: string): NavItem[] {
  const items: NavItem[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subItems = scanMdxFiles(path.join(dir, entry.name), `${urlPrefix}/${entry.name}`);
      if (subItems.length > 0) {
        items.push({
          title: formatServiceName(entry.name),
          items: subItems,
        });
      }
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      const item = readNavItem(path.join(dir, entry.name), urlPrefix);
      if (item) items.push(item);
    }
  }

  return items;
}

function scanMdxFiles(dir: string, urlPrefix: string): NavItem[] {
  if (!fs.existsSync(dir)) return [];

  const items: NavItem[] = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort();

  for (const file of files) {
    const item = readNavItem(path.join(dir, file), urlPrefix);
    if (item) items.push(item);
  }

  return items;
}

function readNavItem(filePath: string, urlPrefix: string): NavItem | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const slug = path.basename(filePath, ".mdx");
    return {
      title: (data.title as string) ?? formatServiceName(slug),
      href: `/${urlPrefix}/${slug}`,
    };
  } catch {
    return null;
  }
}

function formatServiceName(name: string): string {
  return name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
