import type { DependencyGraph } from "../parsers/dependency-parser";
import type { GeneratedFile } from "../types";

function formatName(name: string): string {
  return name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function generateArchitectureMdx(
  graph: DependencyGraph,
  architectureMd: string | null,
  outputDir: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const now = new Date().toISOString();

  // Service Map
  let serviceMap = `---\ntitle: "Service Map"\n`;
  serviceMap += `description: "Overview of all microservices, packages, and applications"\n`;
  serviceMap += `section: "architecture"\nauto_generated: true\nlast_synced: "${now}"\n---\n\n`;
  serviceMap += `# Service Map\n\n`;
  serviceMap += `<Callout type="info">\nAuto-generated from package.json files. Last synced: ${now.split("T")[0]}\n</Callout>\n\n`;

  if (architectureMd) {
    serviceMap += `## Architecture Overview\n\n`;
    // Strip frontmatter from ARCHITECTURE.md if present
    const stripped = architectureMd.replace(/^---[\s\S]*?---\n*/m, "");
    serviceMap += `${stripped}\n\n---\n\n`;
  }

  // Services table
  const services = graph.packages.filter((p) => p.type === "service");
  if (services.length > 0) {
    serviceMap += `## Services\n\n`;
    serviceMap += `| Service | Port | Internal Dependencies |\n`;
    serviceMap += `|---------|------|-----------------------|\n`;
    for (const svc of services) {
      const port = svc.port ? String(svc.port) : "—";
      const internalDeps = graph.internalDeps
        .filter((d) => d.from === svc.name)
        .map((d) => `\`${d.to}\``)
        .join(", ") || "—";
      serviceMap += `| **${formatName(svc.name)}** | ${port} | ${internalDeps} |\n`;
    }
    serviceMap += `\n`;
  }

  // Shared packages
  const packages = graph.packages.filter((p) => p.type === "package");
  if (packages.length > 0) {
    serviceMap += `## Shared Packages\n\n`;
    serviceMap += `| Package | Used By |\n`;
    serviceMap += `|---------|--------|\n`;
    for (const pkg of packages) {
      const usedBy = graph.internalDeps
        .filter((d) => d.to === pkg.name)
        .map((d) => `\`${d.from}\``)
        .join(", ") || "—";
      serviceMap += `| **${pkg.name}** | ${usedBy} |\n`;
    }
    serviceMap += `\n`;
  }

  // Apps
  const apps = graph.packages.filter((p) => p.type === "app");
  if (apps.length > 0) {
    serviceMap += `## Frontend Applications\n\n`;
    serviceMap += `| Application | Internal Dependencies |\n`;
    serviceMap += `|-------------|-----------------------|\n`;
    for (const app of apps) {
      const deps = graph.internalDeps
        .filter((d) => d.from === app.name)
        .map((d) => `\`${d.to}\``)
        .join(", ") || "—";
      serviceMap += `| **${formatName(app.name)}** | ${deps} |\n`;
    }
    serviceMap += `\n`;
  }

  files.push({ path: `${outputDir}/architecture/service-map.mdx`, content: serviceMap });

  // Dependency Graph
  let depGraph = `---\ntitle: "Dependency Graph"\n`;
  depGraph += `description: "Internal dependency relationships between services and packages"\n`;
  depGraph += `section: "architecture"\nauto_generated: true\nlast_synced: "${now}"\n---\n\n`;
  depGraph += `# Dependency Graph\n\n`;
  depGraph += `<Callout type="info">\nAuto-generated from package.json dependencies. Last synced: ${now.split("T")[0]}\n</Callout>\n\n`;

  depGraph += `## Dependency Flow\n\n\`\`\`\n`;
  for (const dep of graph.internalDeps) {
    depGraph += `${dep.from}  ──>  ${dep.to}\n`;
  }
  depGraph += `\`\`\`\n\n`;

  // Summary
  depGraph += `## Summary\n\n`;
  depGraph += `| Metric | Count |\n`;
  depGraph += `|--------|-------|\n`;
  depGraph += `| Services | ${services.length} |\n`;
  depGraph += `| Shared Packages | ${packages.length} |\n`;
  depGraph += `| Frontend Apps | ${apps.length} |\n`;
  depGraph += `| Internal Dependencies | ${graph.internalDeps.length} |\n`;
  depGraph += `| Total Packages | ${graph.packages.length} |\n`;

  files.push({ path: `${outputDir}/architecture/dependency-graph.mdx`, content: depGraph });

  return files;
}
