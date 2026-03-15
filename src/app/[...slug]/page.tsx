import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getDocBySlug, getAllDocSlugs } from "@/lib/mdx";
import { extractToc } from "@/lib/toc";
import { mdxComponents } from "@/components/mdx";
import DocsLayout from "@/components/layout/DocsLayout";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PrevNextNav from "@/components/layout/PrevNextNav";
import TableOfContents from "@/components/layout/TableOfContents";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const doc = getDocBySlug(slug);
  if (!doc) return { title: "Not Found" };

  const url = `https://docs.platforma.cloud/${slug.join("/")}`;

  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    openGraph: {
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      type: "article",
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;

  const doc = getDocBySlug(slug);
  if (!doc) {
    notFound();
  }

  const toc = extractToc(doc.content);

  return (
    <DocsLayout>
      <div className="flex">
        <main id="main-content" className="flex-1 min-w-0 max-w-[var(--content-max-width)] mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ scrollMarginTop: "var(--docs-header-height)" }}>
          <Breadcrumbs />

          {doc.frontmatter.method && doc.frontmatter.endpoint && (
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase ${getMethodColor(
                  doc.frontmatter.method
                )}`}
              >
                {doc.frontmatter.method}
              </span>
              <code className="text-sm font-mono text-[var(--muted-foreground)]">
                {doc.frontmatter.endpoint}
              </code>
            </div>
          )}

          <article className="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
            <MDXRemote
              source={doc.content}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [
                    rehypeSlug,
                    [
                      rehypePrettyCode,
                      {
                        theme: { dark: "github-dark", light: "github-light" },
                        keepBackground: false,
                      },
                    ],
                  ],
                },
              }}
            />
          </article>

          <PrevNextNav />
        </main>

        <TableOfContents items={toc} />
      </div>
    </DocsLayout>
  );
}

function getMethodColor(method: string): string {
  switch (method) {
    case "GET":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "POST":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    case "PUT":
    case "PATCH":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "DELETE":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  }
}
