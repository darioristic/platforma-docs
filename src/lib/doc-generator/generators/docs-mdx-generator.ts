import type { DocFile } from "../parsers/docs-parser";
import type { GeneratedFile } from "../types";

/**
 * Sanitize markdown content for MDX compatibility.
 * HTML comments and raw HTML tags that aren't valid JSX will crash MDX.
 */
function sanitizeForMdx(content: string): string {
  // Split by code fences to avoid mangling code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part, i) => {
      // Odd indices are code blocks — leave them untouched
      if (i % 2 === 1) return part;

      return (
        part
          // Remove HTML comments (<!-- ... -->)
          .replace(/<!--[\s\S]*?-->/g, "")
          // Escape curly braces outside code blocks (MDX treats {} as JSX expressions)
          .replace(/\{/g, "\\{")
          .replace(/\}/g, "\\}")
          // Escape < that aren't part of known MDX components (Callout, etc.)
          // This handles <->, <br>, and random HTML-like content
          .replace(/<(?!\/?(?:Callout|Tabs|Tab|Steps|Step|Card|Cards|Note)\b)/g, "&lt;")
      );
    })
    .join("");
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Documentation",
  services: "Service Documentation",
  architecture: "Architecture",
  api: "API Documentation",
  runbooks: "Runbooks",
  adr: "Architecture Decision Records",
  packages: "Packages",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

export function generateDocsMdx(
  docs: DocFile[],
  outputDir: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const now = new Date().toISOString();

  for (const doc of docs) {
    let mdx = `---\n`;
    mdx += `title: "${doc.title.replace(/"/g, '\\"')}"\n`;
    mdx += `description: "${doc.description.replace(/"/g, '\\"')}"\n`;
    mdx += `section: "docs"\n`;
    mdx += `category: "${doc.category}"\n`;
    mdx += `auto_generated: true\n`;
    mdx += `source: "docs/${doc.relativePath}"\n`;
    mdx += `last_synced: "${now}"\n`;
    mdx += `---\n\n`;

    mdx += `<Callout type="info">\n`;
    mdx += `Imported from \`docs/${doc.relativePath}\` in cloud-factory. Last synced: ${now.split("T")[0]}\n`;
    mdx += `</Callout>\n\n`;

    mdx += sanitizeForMdx(doc.content);

    const outPath = `${outputDir}/docs/${doc.slug}.mdx`;
    files.push({ path: outPath, content: mdx });
  }

  // Index page per category
  const categories = new Map<string, DocFile[]>();
  for (const doc of docs) {
    if (!categories.has(doc.category)) {
      categories.set(doc.category, []);
    }
    categories.get(doc.category)!.push(doc);
  }

  if (docs.length > 0) {
    let index = `---\n`;
    index += `title: "Project Documentation"\n`;
    index += `description: "Documentation imported from cloud-factory docs/ folder"\n`;
    index += `section: "docs"\n`;
    index += `auto_generated: true\n`;
    index += `last_synced: "${now}"\n`;
    index += `---\n\n`;
    index += `# Project Documentation\n\n`;
    index += `<Callout type="info">\n`;
    index += `Auto-imported from the \`docs/\` folder in cloud-factory. Last synced: ${now.split("T")[0]}\n`;
    index += `</Callout>\n\n`;

    for (const [cat, catDocs] of categories) {
      index += `## ${categoryLabel(cat)}\n\n`;
      for (const doc of catDocs) {
        index += `- [${doc.title}](/generated/docs/${doc.slug})\n`;
      }
      index += `\n`;
    }

    files.push({ path: `${outputDir}/docs/index.mdx`, content: index });
  }

  return files;
}
