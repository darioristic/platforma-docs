import type { EventSystemInfo } from "../parsers/event-parser";
import type { GeneratedFile } from "../types";

function formatDomain(domain: string): string {
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

export function generateEventMdx(
  eventSystem: EventSystemInfo,
  outputDir: string
): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const now = new Date().toISOString();

  // Overview page
  let overview = `---\ntitle: "Event System Overview"\n`;
  overview += `description: "Kafka event domains and topic definitions"\n`;
  overview += `section: "events"\nauto_generated: true\nlast_synced: "${now}"\n---\n\n`;
  overview += `# Event System\n\n`;
  overview += `<Callout type="info">\nAuto-generated from Kafka topic definitions. Last synced: ${now.split("T")[0]}\n</Callout>\n\n`;

  if (eventSystem.eventType) {
    overview += `## Event Envelope\n\n`;
    overview += `All events use the \`${eventSystem.eventType.name}\` envelope:\n\n`;
    overview += `| Field | Type |\n`;
    overview += `|-------|------|\n`;
    for (const field of eventSystem.eventType.fields) {
      overview += `| \`${field.name}\` | \`${field.type}\` |\n`;
    }
    overview += `\n`;
  }

  overview += `## Domains\n\n`;
  overview += `| Domain | Topics |\n`;
  overview += `|--------|--------|\n`;
  for (const domain of eventSystem.domains) {
    overview += `| [${formatDomain(domain.domain)}](/generated/events/${domain.domain}) | ${domain.topics.length} |\n`;
  }
  overview += `\n`;

  const totalTopics = eventSystem.domains.reduce((sum, d) => sum + d.topics.length, 0);
  overview += `**Total:** ${eventSystem.domains.length} domains, ${totalTopics} topics\n`;

  files.push({ path: `${outputDir}/events/overview.mdx`, content: overview });

  // Per-domain pages
  for (const domain of eventSystem.domains) {
    let content = `---\ntitle: "${formatDomain(domain.domain)} Events"\n`;
    content += `description: "Kafka topics for the ${domain.domain} domain"\n`;
    content += `section: "events"\nauto_generated: true\nlast_synced: "${now}"\n---\n\n`;
    content += `# ${formatDomain(domain.domain)} Events\n\n`;

    content += `| Constant | Topic |\n`;
    content += `|----------|-------|\n`;
    for (const topic of domain.topics) {
      content += `| \`${topic.constant}\` | \`${topic.name}\` |\n`;
    }
    content += `\n`;

    files.push({ path: `${outputDir}/events/${domain.domain}.mdx`, content });
  }

  return files;
}
