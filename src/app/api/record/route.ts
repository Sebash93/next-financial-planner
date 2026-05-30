import { prisma } from "@/lib/prisma";
import { serializeRecord } from "@/utils/serialize-record";
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
  return NextResponse.json(records.map(serializeRecord));
}

export async function POST(request: Request) {
  const {
    name,
    date,
    amount,
    tagId,
    bucketId,
    sheetId,
    currentBalance,
    monthlyPayment,
    interestRate,
    additionalPayment,
  } = await request.json();
  try {
    const newRecord = await prisma.record.create({
      data: {
        name,
        date: date != null ? BigInt(date) : null,
        tagId,
        bucketId,
        amount,
        sheetId,
        currentBalance,
        monthlyPayment,
        interestRate,
        additionalPayment,
      },
    });
    return NextResponse.json(serializeRecord(newRecord));
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  try {
    const deletedRecord = await prisma.record.delete({
      where: {
        id,
      },
    });
    return NextResponse.json({ deletedRecord });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to delete your interaction. Please try again.");
  }
}
