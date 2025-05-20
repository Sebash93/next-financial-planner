import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const sheetId = searchParams.get("sheetId");
  const records = sheetId
    ? await prisma.record.findMany({
        where: {
          sheetId: parseInt(sheetId),
        },
      })
    : [];
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const { name, date, amount, sheetId } = await request.json();
  try {
    const newRecord = await prisma.record.create({
      data: {
        name,
        date,
        amount,
        sheetId,
      },
    });
    console.log({ name, date, amount, sheetId });
    return NextResponse.json(newRecord);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  console.log("DELETE", id);
  try {
    const deletedRecord = await prisma.record.delete({
      where: {
        id: parseInt(id),
      },
    });
    return NextResponse.json(deletedRecord);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to delete your interaction. Please try again.");
  }
}
