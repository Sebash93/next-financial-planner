import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const records = await prisma.bucket.findMany();
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  try {
    const newRecord = await prisma.bucket.create({
      data: {
        name,
      },
    });
    return NextResponse.json(newRecord);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}
