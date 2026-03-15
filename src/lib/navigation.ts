export interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/getting-started/introduction" },
      { title: "Quickstart", href: "/getting-started/quickstart" },
      { title: "Authentication", href: "/getting-started/authentication" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Overview", href: "/api-reference/overview" },
      { title: "Authentication", href: "/api-reference/authentication" },
      { title: "Rate Limits", href: "/api-reference/rate-limits" },
      { title: "Errors", href: "/api-reference/errors" },
      {
        title: "Portals",
        items: [
          { title: "List Portals", href: "/api-reference/portals/list-portals" },
          { title: "Create Portal", href: "/api-reference/portals/create-portal" },
        ],
      },
      {
        title: "Orders",
        items: [
          { title: "List Orders", href: "/api-reference/orders/list-orders" },
          { title: "Create Order", href: "/api-reference/orders/create-order" },
          { title: "Get Order", href: "/api-reference/orders/get-order" },
        ],
      },
      {
        title: "Billing",
        items: [
          { title: "Invoices", href: "/api-reference/billing/invoices" },
          { title: "Subscriptions", href: "/api-reference/billing/subscriptions" },
        ],
      },
      {
        title: "Infrastructure",
        items: [
          { title: "Clusters", href: "/api-reference/infrastructure/clusters" },
          { title: "Instances", href: "/api-reference/infrastructure/instances" },
          { title: "Networks", href: "/api-reference/infrastructure/networks" },
        ],
      },
      {
        title: "Provisioning",
        items: [
          { title: "Workflows", href: "/api-reference/provisioning/workflows" },
          { title: "Resources", href: "/api-reference/provisioning/resources" },
        ],
      },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Set Up Your First Service", href: "/guides/setup-first-service" },
      { title: "Configure Billing", href: "/guides/configure-billing" },
      { title: "Deploy Infrastructure", href: "/guides/deploy-infrastructure" },
      { title: "Integrate API Gateway", href: "/guides/integrate-api-gateway" },
      { title: "Manage Identities", href: "/guides/manage-identities" },
      { title: "Event-Driven Workflows", href: "/guides/event-driven-workflows" },
    ],
  },
  {
    title: "Architecture",
    items: [
      { title: "Overview", href: "/architecture/overview" },
      { title: "Platform Layers", href: "/architecture/platform-layers" },
      { title: "Event Bus", href: "/architecture/event-bus" },
      { title: "Data Model", href: "/architecture/data-model" },
      { title: "Multi-Tenancy", href: "/architecture/multi-tenancy" },
      { title: "Security Model", href: "/architecture/security-model" },
    ],
  },
];

// Auto-generated sections are appended dynamically.
// The generate-docs script writes generated-nav.json which is imported here.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const generatedNav = require("./generated-nav.json") as NavSection[];
  if (Array.isArray(generatedNav)) {
    navigation.push(...generatedNav);
  }
} catch {
  // No generated nav yet — this is fine
}

export function flattenNavigation(sections: NavSection[]): { title: string; href: string }[] {
  const result: { title: string; href: string }[] = [];

  function traverse(items: NavItem[]) {
    for (const item of items) {
      if (item.href) {
        result.push({ title: item.title, href: item.href });
      }
      if (item.items) {
        traverse(item.items);
      }
    }
  }

  for (const section of sections) {
    traverse(section.items);
  }

  return result;
}
