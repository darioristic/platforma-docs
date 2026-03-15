import GithubSlugger from "github-slugger";
import type { TocHeading } from "@/types/content";

export function extractToc(content: string): TocHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugger.slug(text);
    headings.push({ id, text, level });
  }

  return headings;
}
