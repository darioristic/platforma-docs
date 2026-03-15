export interface DocFrontmatter {
  title: string;
  description: string;
  section: string;
  order: number;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint?: string;
}

export interface DocPage {
  frontmatter: DocFrontmatter;
  content: string;
  slug: string[];
}

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}
