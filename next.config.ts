import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async redirects() {
    return [
      // Old /v1/ paths
      { source: "/v1/billing/subscriptions", destination: "/api-reference/billing/subscriptions", permanent: true },
      { source: "/v1/billing/invoices", destination: "/api-reference/billing/invoices", permanent: true },
      { source: "/v1/orders", destination: "/api-reference/orders/list-orders", permanent: true },
      { source: "/v1/orders/:id", destination: "/api-reference/orders/get-order", permanent: true },
      { source: "/v1/reporting/resource-optimization/:id", destination: "/api-reference/overview", permanent: true },
      // Old /sdks/ and /orders/ paths
      { source: "/sdks/typescript", destination: "/getting-started/quickstart", permanent: true },
      { source: "/orders/analytics", destination: "/api-reference/orders/list-orders", permanent: true },
      // Directory indexes without index pages
      { source: "/api-reference/portals", destination: "/api-reference/portals/list-portals", permanent: true },
      { source: "/api-reference/billing", destination: "/api-reference/billing/subscriptions", permanent: true },
      { source: "/api-reference/orders", destination: "/api-reference/orders/list-orders", permanent: true },
    ];
  },
};

export default nextConfig;
