/**
 * Client-side search with fuzzy matching and relevance scoring.
 * Search index is loaded from /api/search at runtime.
 */

export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  section: string;
  headings: string[];
  body: string;
  keywords: string[];
}

export interface ScoredResult {
  entry: SearchEntry;
  score: number;
  matchType: "title" | "heading" | "description" | "body" | "keyword";
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
    const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wordBoundaryIdx = h.search(new RegExp(`\\b${escaped}`));
    if (wordBoundaryIdx >= 0) return 100;
    return 80;
  }

  // Fuzzy: characters in order, allow small gaps
  let score = 0;
  let hi = 0;
  let consecutive = 0;
  let matched = 0;

  for (let ni = 0; ni < n.length; ni++) {
    let found = false;
    const maxLookahead = hi + 3;
    while (hi < h.length && hi <= maxLookahead) {
      if (h[hi] === n[ni]) {
        score += 10;
        if (consecutive > 0) score += consecutive * 5;
        consecutive++;
        matched++;
        hi++;
        found = true;
        break;
      }
      hi++;
      consecutive = 0;
    }
    if (!found) {
      consecutive = 0;
    }
  }

  // Need at least 60% of chars matched
  if (matched < Math.ceil(n.length * 0.6)) return 0;

  return score;
}

/**
 * Search the index with fuzzy multi-word matching and relevance scoring.
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string
): ScoredResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const words = q.split(/\s+/).filter((w) => w.length > 0);
  const scored: ScoredResult[] = [];

  for (const entry of entries) {
    let bestMatchType: ScoredResult["matchType"] = "body";
    let allWordsMatch = true;
    let totalScore = 0;

    for (const word of words) {
      let wordBestScore = 0;
      let wordMatchType: ScoredResult["matchType"] = "body";

      // Title (highest weight x5)
      const titleScore = fuzzyScore(word, entry.title);
      if (titleScore > 0 && titleScore * 5 > wordBestScore) {
        wordBestScore = titleScore * 5;
        wordMatchType = "title";
      }

      // Headings (x4)
      for (const heading of entry.headings) {
        const hScore = fuzzyScore(word, heading);
        if (hScore > 0 && hScore * 4 > wordBestScore) {
          wordBestScore = hScore * 4;
          wordMatchType = "heading";
        }
      }

      // Description (x3)
      const descScore = fuzzyScore(word, entry.description);
      if (descScore > 0 && descScore * 3 > wordBestScore) {
        wordBestScore = descScore * 3;
        wordMatchType = "description";
      }

      // Keywords (x2)
      for (const kw of entry.keywords) {
        const kwScore = fuzzyScore(word, kw);
        if (kwScore > 0 && kwScore * 2 > wordBestScore) {
          wordBestScore = kwScore * 2;
          wordMatchType = "keyword";
        }
      }

      // Body content (x1, search first 2000 chars)
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
      if (wordBestScore > totalScore - wordBestScore || bestMatchType === "body") {
        bestMatchType = wordMatchType;
      }
    }

    if (allWordsMatch && totalScore > 0) {
      scored.push({ entry, score: totalScore, matchType: bestMatchType });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 15);
}
