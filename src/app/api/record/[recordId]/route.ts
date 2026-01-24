import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ recordId: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const { recordId } = await params;
  const body = await request.json();
  try {
    const record = await prisma.record.update({
      where: { id: parseInt(recordId) },
      data: body,
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}
