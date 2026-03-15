import fs from "fs";
import path from "path";

export interface EventTopicInfo {
  domain: string;
  topics: { name: string; constant: string; description?: string }[];
}

export interface EventTypeInfo {
  name: string;
  fields: { name: string; type: string }[];
}

export interface EventSystemInfo {
  domains: EventTopicInfo[];
  eventType: EventTypeInfo | null;
}

export function parseEventSystem(repoPath: string): EventSystemInfo {
  const kafkaDir = path.join(repoPath, "packages", "kafka", "src");

  const domains = parseTopicDefinitions(kafkaDir);
  const eventType = parseEventType(kafkaDir);

  return { domains, eventType };
}

function parseTopicDefinitions(kafkaDir: string): EventTopicInfo[] {
  const typesDir = path.join(kafkaDir, "types");
  const domains: EventTopicInfo[] = [];

  if (!fs.existsSync(typesDir)) {
    // Search broader
    return parseTopicsFromDir(kafkaDir);
  }

  return parseTopicsFromDir(typesDir);
}

function parseTopicsFromDir(dir: string): EventTopicInfo[] {
  if (!fs.existsSync(dir)) return [];

  const domains: EventTopicInfo[] = [];
  const domainMap = new Map<string, EventTopicInfo["topics"]>();

  const files = getAllTsFiles(dir);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

    // Match topic constant definitions like:
    // export const ORDER_CREATED = 'cloud-factory.prod.order.created.v1'
    // or TOPICS = { ORDER_CREATED: '...' }
    const constRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*['"]([^'"]*cloud-factory[^'"]*)['"]/g;
    let match;

    while ((match = constRegex.exec(content)) !== null) {
      const constant = match[1];
      const topicName = match[2];

      // Extract domain from topic: cloud-factory.{env}.{domain}.{event}.v{version}
      const parts = topicName.split(".");
      const domain = parts.length >= 3 ? parts[2] : "unknown";

      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      domainMap.get(domain)!.push({
        name: topicName,
        constant,
      });
    }

    // Also match object-style definitions: { TOPIC_NAME: 'value' }
    const objectRegex = /(\w+)\s*:\s*['"]([^'"]*cloud-factory[^'"]*)['"]/g;
    while ((match = objectRegex.exec(content)) !== null) {
      const constant = match[1];
      const topicName = match[2];
      const parts = topicName.split(".");
      const domain = parts.length >= 3 ? parts[2] : "unknown";

      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }

      // Avoid duplicates
      const existing = domainMap.get(domain)!;
      if (!existing.some((t) => t.constant === constant)) {
        existing.push({ name: topicName, constant });
      }
    }
  }

  for (const [domain, topics] of domainMap) {
    domains.push({ domain, topics });
  }

  return domains.sort((a, b) => a.domain.localeCompare(b.domain));
}

function parseEventType(kafkaDir: string): EventTypeInfo | null {
  const files = getAllTsFiles(kafkaDir);

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

    // Look for CloudFactoryEvent interface/type
    if (content.includes("CloudFactoryEvent")) {
      const fields: EventTypeInfo["fields"] = [];

      // Match field definitions in interface
      const fieldRegex = /(\w+)(\?)?:\s*([^;\n]+)/g;
      const interfaceMatch = content.match(/interface\s+CloudFactoryEvent[^{]*\{([\s\S]*?)\}/);

      if (interfaceMatch) {
        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(interfaceMatch[1])) !== null) {
          const name = fieldMatch[1];
          const type = fieldMatch[3].trim().replace(/;$/, "");
          if (name && !name.startsWith("//")) {
            fields.push({ name, type });
          }
        }
      }

      if (fields.length > 0) {
        return { name: "CloudFactoryEvent", fields };
      }
    }
  }

  return null;
}

function getAllTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      results.push(fullPath);
    }
  }
  return results;
}
