import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const plans = await prisma.plan.findMany({
    include: {
      Sheet: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const { name, initialDate, endDate } = await request.json();
  try {
    const newPlan = await prisma.plan.create({
      data: {
        name: name,
        initialDate: initialDate,
        endDate: endDate,
      },
    });
    return NextResponse.json(newPlan);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}
