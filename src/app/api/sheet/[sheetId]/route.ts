import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }) {
  console.log("Fetching sheet", { params });
  const { sheetId } = await params;
  try {
    const sheet = await prisma.sheet.findUnique({
      where: {
        id: parseInt(sheetId),
      },
    });
    console.log("sheet result", { sheet });
    return NextResponse.json(sheet);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}

export async function DELETE(request: Request, { params }) {
  const { sheetId } = await params;
  try {
    const sheet = await prisma.sheet.delete({
      where: {
        id: parseInt(sheetId),
      },
    });
    return NextResponse.json(sheet);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}

export async function PUT(request: Request, { params }) {
  const { sheetId } = await params;
  const body = await request.json();
  try {
    const sheet = await prisma.sheet.update({
      where: {
        id: parseInt(sheetId),
      },
      data: body,
    });
    return NextResponse.json(sheet);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to update sheet. Please try again.");
  }
}
