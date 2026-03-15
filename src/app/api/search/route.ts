import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/search-index";

// Build index once at startup
let cachedIndex: ReturnType<typeof buildSearchIndex> | null = null;

function getIndex() {
  if (!cachedIndex) {
    cachedIndex = buildSearchIndex();
  }
  return cachedIndex;
}

export async function GET() {
  const index = getIndex();
  return NextResponse.json(index);
}
