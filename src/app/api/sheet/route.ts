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
    if (sheetType === "CREDIT") {
      const existing = await prisma.sheet.count({ where: { planId, sheetType: "CREDIT" } });
      if (existing > 0) {
        return NextResponse.json(
          { error: "Solo se puede crear una hoja de Crédito por plan." },
          { status: 400 }
        );
      }
    }
    if (sheetType === "CREDIT_FLOW") {
      const credits = await prisma.sheet.count({ where: { planId, sheetType: "CREDIT" } });
      if (credits === 0) {
        return NextResponse.json(
          { error: "Primero debes crear una hoja de Crédito." },
          { status: 400 }
        );
      }
      const existingFlow = await prisma.sheet.count({ where: { planId, sheetType: "CREDIT_FLOW" } });
      if (existingFlow > 0) {
        return NextResponse.json(
          { error: "Ya existe una hoja de Flujo de Crédito." },
          { status: 400 }
        );
      }
    }
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
