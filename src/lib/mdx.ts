import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { DocFrontmatter } from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "src/content");

export function getDocBySlug(slug: string[]): {
  frontmatter: DocFrontmatter;
  content: string;
} | null {
  const filePath = path.join(CONTENT_DIR, ...slug) + ".mdx";

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    frontmatter: data as DocFrontmatter,
    content,
  };
}

export function getAllDocSlugs(): string[][] {
  const slugs: string[][] = [];

  function walkDir(dir: string, prefix: string[] = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name), [...prefix, entry.name]);
      } else if (entry.name.endsWith(".mdx")) {
        const slug = [...prefix, entry.name.replace(/\.mdx$/, "")];
        slugs.push(slug);
      }
    }
  }

  if (fs.existsSync(CONTENT_DIR)) {
    walkDir(CONTENT_DIR);
  }

  return slugs;
}
