import { getAllDocSlugs, getDocBySlug } from "./mdx";

export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  section: string;
  headings: string[];
  body: string;
  keywords: string[];
}

/**
 * Strip MDX/markdown syntax to get plain text for indexing.
 */
function stripMdx(content: string): string {
  return (
    content
      // Remove MDX component tags
      .replace(/<\/?[A-Z][A-Za-z]*[^>]*>/g, " ")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, " ")
      // Remove inline code
      .replace(/`[^`]+`/g, " ")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      // Remove frontmatter
      .replace(/^---[\s\S]*?---/m, "")
      // Remove headings markup
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove table pipes
      .replace(/\|/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Extract h2/h3 headings as plain text.
 */
function extractHeadings(content: string): string[] {
  const regex = /^#{2,3}\s+(.+)$/gm;
  const headings: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
}

/**
 * Generate keywords from title, description, headings.
 */
function generateKeywords(entry: Omit<SearchEntry, "keywords">): string[] {
  const text = [entry.title, entry.description, ...entry.headings].join(" ");
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return [...new Set(words)];
}

/**
 * Build search index from all MDX content at build time.
 */
export function buildSearchIndex(): SearchEntry[] {
  const slugs = getAllDocSlugs();
  const entries: SearchEntry[] = [];

  for (const slug of slugs) {
    const doc = getDocBySlug(slug);
    if (!doc) continue;

    const section = slug[0]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const headings = extractHeadings(doc.content);
    const body = stripMdx(doc.content);

    const entry: Omit<SearchEntry, "keywords"> = {
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      href: "/" + slug.join("/"),
      section,
      headings,
      body,
    };

    entries.push({
      ...entry,
      keywords: generateKeywords(entry),
    });
  }

  return entries;
}

/**
 * Fuzzy match: check if characters of needle appear in order in haystack.
 * Returns score (0 = no match, higher = better).
 */
function fuzzyScore(needle: string, haystack: string): number {
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();

  // Exact substring match — best score
  if (h.includes(n)) {
    // Bonus for matching at word boundary
    const wordBoundaryIdx = h.search(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    if (wordBoundaryIdx >= 0) return 100;
    return 80;
  }

  // Fuzzy: characters in order with max 1 skip between consecutive chars
  let score = 0;
  let hi = 0;
  let consecutive = 0;

  for (let ni = 0; ni < n.length; ni++) {
    let found = false;
    const maxLookahead = hi + 3; // allow skipping up to 3 chars
    while (hi < h.length && hi <= maxLookahead) {
      if (h[hi] === n[ni]) {
        score += 10;
        if (consecutive > 0) score += consecutive * 5; // bonus for consecutive
        consecutive++;
        hi++;
        found = true;
        break;
      }
      hi++;
      consecutive = 0;
    }
    if (!found) {
      // Allow 1 typo (skip this char in needle)
      consecutive = 0;
      continue;
    }
  }

  // Need at least 60% of chars matched
  const minChars = Math.ceil(n.length * 0.6);
  if (score / 10 < minChars) return 0;

  return score;
}

export interface ScoredResult {
  entry: SearchEntry;
  score: number;
  matchType: "title" | "heading" | "description" | "body" | "keyword";
}

/**
 * Search the index with fuzzy multi-word matching and relevance scoring.
 */
export function searchIndex(
  entries: SearchEntry[],
  query: string
): ScoredResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const words = q.split(/\s+/).filter((w) => w.length > 0);

  const scored: ScoredResult[] = [];

  for (const entry of entries) {
    let bestScore = 0;
    let matchType: ScoredResult["matchType"] = "body";

    // Score each word, require all words to match somewhere
    let allWordsMatch = true;
    let totalScore = 0;

    for (const word of words) {
      let wordBestScore = 0;
      let wordMatchType: ScoredResult["matchType"] = "body";

      // Title (highest weight)
      const titleScore = fuzzyScore(word, entry.title);
      if (titleScore > 0) {
        const weighted = titleScore * 5;
        if (weighted > wordBestScore) {
          wordBestScore = weighted;
          wordMatchType = "title";
        }
      }

      // Description
      const descScore = fuzzyScore(word, entry.description);
      if (descScore > 0) {
        const weighted = descScore * 3;
        if (weighted > wordBestScore) {
          wordBestScore = weighted;
          wordMatchType = "description";
        }
      }

      // Headings
      for (const heading of entry.headings) {
        const hScore = fuzzyScore(word, heading);
        if (hScore > 0) {
          const weighted = hScore * 4;
          if (weighted > wordBestScore) {
            wordBestScore = weighted;
            wordMatchType = "heading";
          }
        }
      }

      // Keywords
      for (const kw of entry.keywords) {
        const kwScore = fuzzyScore(word, kw);
        if (kwScore > 0) {
          const weighted = kwScore * 2;
          if (weighted > wordBestScore) {
            wordBestScore = weighted;
            wordMatchType = "keyword";
          }
        }
      }

      // Body (lowest weight, but search through it)
      if (wordBestScore === 0) {
        const bodyScore = fuzzyScore(word, entry.body.slice(0, 2000));
        if (bodyScore > 0) {
          wordBestScore = bodyScore;
          wordMatchType = "body";
        }
      }

      if (wordBestScore === 0) {
        allWordsMatch = false;
        break;
      }

      totalScore += wordBestScore;
      if (wordBestScore > bestScore) {
        bestScore = wordBestScore;
        matchType = wordMatchType;
      }
    }

    if (allWordsMatch && totalScore > 0) {
      scored.push({ entry, score: totalScore, matchType });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 15);
}
