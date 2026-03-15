import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

export interface DocFile {
  /** Relative path from docs/ root, e.g. "services/order-service.md" */
  relativePath: string;
  /** Category derived from subfolder or "general" */
  category: string;
  /** Slug for URL */
  slug: string;
  /** Title extracted from frontmatter or first heading or filename */
  title: string;
  /** Optional description from frontmatter */
  description: string;
  /** Raw markdown content (without frontmatter) */
  content: string;
}

const IGNORED_FILES = new Set([".DS_Store"]);

async function collectMarkdownFiles(dir: string, base: string): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (IGNORED_FILES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectMarkdownFiles(fullPath, base);
      results.push(...nested);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      results.push(path.relative(base, fullPath));
    }
  }
  return results;
}

function titleFromFilename(filename: string): string {
  return path.basename(filename, path.extname(filename))
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractFirstHeading(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Collect README.md files from packages/ and services/ directories.
 * Each package README becomes a doc under the "packages" category.
 */
async function collectPackageReadmes(repoDir: string): Promise<DocFile[]> {
  const docs: DocFile[] = [];
  const dirs = ["packages", "services"];

  for (const dir of dirs) {
    const baseDir = path.join(repoDir, dir);
    let entries;
    try {
      entries = await fs.readdir(baseDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const readmePath = path.join(baseDir, entry.name, "README.md");
      try {
        const raw = await fs.readFile(readmePath, "utf-8");
        const { data: frontmatter, content } = matter(raw);

        const title =
          (frontmatter.title as string) ||
          extractFirstHeading(content) ||
          titleFromFilename(entry.name);

        const description =
          (frontmatter.description as string) || `Documentation: ${title}`;

        const slug = `${dir}/${entry.name}/readme`.toLowerCase();

        docs.push({
          relativePath: `${dir}/${entry.name}/README.md`,
          category: dir,
          slug,
          title,
          description,
          content,
        });
      } catch {
        // No README, skip
      }
    }
  }

  return docs;
}

export async function parseDocsFolder(repoDir: string): Promise<DocFile[]> {
  const docsDir = path.join(repoDir, "docs");
  const files = await collectMarkdownFiles(docsDir, docsDir);
  const docs: DocFile[] = [];

  for (const relPath of files) {
    const fullPath = path.join(docsDir, relPath);
    const raw = await fs.readFile(fullPath, "utf-8");
    const { data: frontmatter, content } = matter(raw);

    const parts = relPath.split(path.sep);
    const category = parts.length > 1 ? parts[0] : "general";
    const slug = relPath
      .replace(/\.(md|mdx)$/, "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    const title =
      (frontmatter.title as string) ||
      extractFirstHeading(content) ||
      titleFromFilename(relPath);

    const description =
      (frontmatter.description as string) || `Documentation: ${title}`;

    docs.push({
      relativePath: relPath,
      category,
      slug,
      title,
      description,
      content,
    });
  }

  // Also collect README files from packages/ and services/
  const packageDocs = await collectPackageReadmes(repoDir);
  docs.push(...packageDocs);

  // Sort: categories first, then alphabetically
  docs.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.title.localeCompare(b.title);
  });

  return docs;
}
