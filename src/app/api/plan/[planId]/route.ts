
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }) {
  const { planId } = await params;
  try {
    const plan = await prisma.plan.findUnique({
      where: {
        id: parseInt(planId)
      }
    });
    console.log({plan});
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error('Failed to record your interaction. Please try again.');
  }
}