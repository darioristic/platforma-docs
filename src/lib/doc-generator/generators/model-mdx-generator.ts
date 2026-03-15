import type { ServiceEntities, MongooseSchemaInfo } from "../parsers/entity-parser";
import type { GeneratedFile } from "../types";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Escape characters that break MDX: curly braces, angle brackets, backticks.
 */
function sanitizeMdx(str: string): string {
  return str
    .replace(/[{}]/g, "")
    .replace(/[<>]/g, "")
    .replace(/`/g, "'")
    .replace(/\|/g, "/")
    .trim() || "-";
}

function sanitizeType(type: string): string {
  return type
    .replace(/import\([^)]+\)\./g, "")
    .replace(/[<>]/g, "")
    .replace(/"/g, "'")
    .trim() || "unknown";
}

export function generateModelMdx(
  services: ServiceEntities[],
  mongooseSchemas: MongooseSchemaInfo[],
  outputDir: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const now = new Date().toISOString();

  // TypeORM entities
  for (const service of services) {
    const serviceSlug = slugify(service.serviceName);
    const title = `${formatName(service.serviceName)} Data Model`;

    let content = `---\ntitle: "${title}"\n`;
    content += `description: "Database schema for ${service.serviceName} (schema: ${service.schema})"\n`;
    content += `section: "models"\nauto_generated: true\nlast_synced: "${now}"\n---\n\n`;
    content += `# ${title}\n\n`;
    content += `<Callout type="info">\nAuto-generated from TypeORM entity definitions. Last synced: ${now.split("T")[0]}\n</Callout>\n\n`;
    content += `**Database schema:** \`${service.schema}\`\n\n`;

    for (const entity of service.entities) {
      content += `## ${entity.name}\n\n`;
      content += `**Table:** \`${entity.tableName}\`\n\n`;

      if (entity.columns.length > 0) {
        content += `| Column | Type | Nullable | Primary | Unique | Default |\n`;
        content += `|--------|------|----------|---------|--------|---------|\n`;
        for (const col of entity.columns) {
          const defaultVal = col.default ? sanitizeMdx(col.default) : "-";
          content += `| \`${col.name}\` | \`${sanitizeType(col.type)}\` | ${col.nullable ? "Yes" : "No"} | ${col.primary ? "Yes" : "-"} | ${col.unique ? "Yes" : "-"} | ${defaultVal} |\n`;
        }
        content += `\n`;
      }

      if (entity.relations.length > 0) {
        content += `### Relations\n\n`;
        content += `| Property | Type | Target | Join Column |\n`;
        content += `|----------|------|--------|-------------|\n`;
        for (const rel of entity.relations) {
          content += `| \`${rel.propertyName}\` | ${rel.type} | \`${rel.target}\` | ${rel.joinColumn ? "Yes" : "-"} |\n`;
        }
        content += `\n`;
      }

      content += `---\n\n`;
    }

    files.push({ path: `${outputDir}/models/${serviceSlug}.mdx`, content });
  }

  // Mongoose schemas
  if (mongooseSchemas.length > 0) {
    let content = `---\ntitle: "Product Service Data Model"\n`;
    content += `description: "MongoDB schemas for product-service"\n`;
    content += `section: "models"\nauto_generated: true\nlast_synced: "${now}"\n---\n\n`;
    content += `# Product Service Data Model\n\n`;
    content += `<Callout type="info">\nAuto-generated from Mongoose schema definitions. Last synced: ${now.split("T")[0]}\n</Callout>\n\n`;

    for (const schema of mongooseSchemas) {
      content += `## ${schema.name}\n\n`;
      if (schema.collectionName) {
        content += `**Collection:** \`${schema.collectionName}\`\n\n`;
      }

      if (schema.fields.length > 0) {
        content += `| Field | Type | Required | Default |\n`;
        content += `|-------|------|----------|---------|\n`;
        for (const field of schema.fields) {
          content += `| \`${field.name}\` | \`${field.type}\` | ${field.required ? "Yes" : "No"} | ${field.default ?? "-"} |\n`;
        }
        content += `\n`;
      }

      content += `---\n\n`;
    }

    files.push({ path: `${outputDir}/models/product-service.mdx`, content });
  }

  return files;
}

function formatName(name: string): string {
  return name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
