import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sheetId = searchParams.get("sheetId");
  const tags = sheetId
    ? await prisma.tag.findMany({
        where: {
          sheetId: parseInt(sheetId),
        },
      })
    : [];
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const { name, color, sheetId } = await request.json();
  try {
    const newSheet = await prisma.tag.create({
      data: {
        name,
        color,
        sheetId,
      },
    });
    return NextResponse.json(newSheet);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}
