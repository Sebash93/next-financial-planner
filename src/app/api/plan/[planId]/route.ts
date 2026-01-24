import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }) {
  const { planId } = await params;
  try {
    const plan = await prisma.plan.findUnique({
      where: {
        id: parseInt(planId),
      },
    });
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}

export async function DELETE(request: Request, { params }) {
  const { planId } = await params;
  try {
    const plan = await prisma.plan.delete({
      where: {
        id: parseInt(planId),
      },
    });
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to record your interaction. Please try again.");
  }
}

export async function PUT(request: Request, { params }) {
  const { planId } = await params;
  const body = await request.json();
  try {
    const plan = await prisma.plan.update({
      where: {
        id: parseInt(planId),
      },
      data: body,
    });
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to update plan. Please try again.");
  }
}
