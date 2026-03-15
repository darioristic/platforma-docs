import type { ServiceApiInfo, ApiEndpointInfo } from "../parsers/openapi-parser";
import type { GeneratedFile } from "../types";

/**
 * Clean TypeScript type strings: strip import(...) paths, angle brackets, etc.
 * e.g. import("/path/to/file").CreateProductDto → CreateProductDto
 */
function sanitizeType(type: string): string {
  return type
    .replace(/import\([^)]+\)\./g, "")  // Remove import(...).
    .replace(/[<>]/g, "")               // Remove angle brackets (break MDX)
    .replace(/"/g, "'")                  // Replace double quotes
    .replace(/[{}]/g, "")               // Remove curly braces (break MDX)
    .trim() || "unknown";
}

function sanitizeMdx(str: string): string {
  return str.replace(/[{}]/g, "").replace(/[<>]/g, "").replace(/`/g, "'").trim();
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatName(name: string): string {
  return name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function generateEndpointMdx(ep: ApiEndpointInfo): string {
  let mdx = "";

  const summary = ep.summary ?? ep.description ?? `${ep.method} ${ep.path}`;
  mdx += `### ${summary}\n\n`;
  mdx += `<ApiEndpoint method="${ep.method}" path="${ep.path}"${ep.auth ? ` auth="${ep.auth}"` : ""}>\n`;
  if (ep.description && ep.description !== ep.summary) {
    mdx += `  ${ep.description}\n`;
  }
  mdx += `</ApiEndpoint>\n\n`;

  // Parameters
  if (ep.parameters.length > 0) {
    mdx += `<ParamTable>\n`;
    for (const param of ep.parameters) {
      const required = param.required ? " required" : "";
      const desc = param.description ?? `${param.in} parameter`;
      mdx += `  <Param name="${param.name}" type="${sanitizeType(param.type)}"${required}>\n`;
      mdx += `    ${desc}\n`;
      mdx += `  </Param>\n`;
    }
    mdx += `</ParamTable>\n\n`;
  }

  // Request body
  if (ep.requestBody) {
    mdx += `**Request Body:** \`${sanitizeType(ep.requestBody.type)}\`\n\n`;
    if (ep.requestBody.properties.length > 0) {
      mdx += `<ParamTable>\n`;
      for (const prop of ep.requestBody.properties) {
        const required = prop.required ? " required" : "";
        mdx += `  <Param name="${prop.name}" type="${sanitizeType(prop.type)}"${required}>\n`;
        mdx += `    ${prop.description ?? "—"}\n`;
        mdx += `  </Param>\n`;
      }
      mdx += `</ParamTable>\n\n`;
    }
  }

  // Responses
  if (ep.responses.length > 0) {
    for (const res of ep.responses) {
      mdx += `<ResponseExample status={${res.status}}>\n`;
      mdx += `{\"status\": ${res.status}${res.description ? `, \"description\": \"${res.description}\"` : ""}}\n`;
      mdx += `</ResponseExample>\n\n`;
    }
  }

  mdx += `---\n\n`;
  return mdx;
}

export function generateApiMdx(
  services: ServiceApiInfo[],
  outputDir: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const now = new Date().toISOString();

  for (const service of services) {
    const serviceSlug = slugify(service.serviceName);
    const title = `${formatName(service.serviceName)} API`;

    let content = `---\ntitle: "${title}"\n`;
    content += `description: "Auto-generated API reference for ${service.serviceName}"\n`;
    content += `section: "api"\nservice: "${service.serviceName}"\n`;
    content += `auto_generated: true\nlast_synced: "${now}"\n---\n\n`;
    content += `# ${title}\n\n`;
    content += `<Callout type="info">\nAuto-generated from NestJS controller decorators. Last synced: ${now.split("T")[0]}\n</Callout>\n\n`;
    content += `**Base path:** \`${service.basePath}\`  \n`;
    content += `**Endpoints:** ${service.endpoints.length}\n\n---\n\n`;

    // Group endpoints by tag or path prefix
    const grouped = new Map<string, ApiEndpointInfo[]>();
    for (const ep of service.endpoints) {
      const tag = ep.tags[0] ?? ep.path.split("/").filter(Boolean)[0] ?? "default";
      if (!grouped.has(tag)) grouped.set(tag, []);
      grouped.get(tag)!.push(ep);
    }

    for (const [tag, endpoints] of grouped) {
      content += `## ${formatName(tag)}\n\n`;
      for (const ep of endpoints) {
        content += generateEndpointMdx(ep);
      }
    }

    files.push({
      path: `${outputDir}/api/${serviceSlug}.mdx`,
      content,
    });
  }

  return files;
}
