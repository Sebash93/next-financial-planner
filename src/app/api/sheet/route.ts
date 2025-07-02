import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const planId = searchParams.get("planId");
  const sheets = planId
    ? await prisma.sheet.findMany({
        where: {
          planId: parseInt(planId),
        },
        include: {
          Record: {
            select: {
              amount: true,
            },
          },
        },
      })
    : [];

  // Add sum of records to each sheet
  const sheetsWithSum = sheets.map((sheet) => ({
    ...sheet,
    recordsSum: sheet.Record.reduce((sum, rec) => sum + rec.amount, 0),
  }));

  return NextResponse.json(sheetsWithSum);
}

export async function POST(request: Request) {
  const { name, sheetType, planId } = await request.json();
  try {
    const newSheet = await prisma.sheet.create({
      data: {
        name,
        sheetType,
        planId,
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
