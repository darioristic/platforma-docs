import { NextResponse } from "next/server";
import { getGenerationStatus } from "@/lib/doc-generator/status";

export async function GET() {
  return NextResponse.json(getGenerationStatus());
}
