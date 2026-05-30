import { prisma } from "@/lib/prisma";
import { serializeRecord } from "@/utils/serialize-record";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ recordId: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  const { recordId } = await params;
  const body = await request.json();
  try {
    if (body.date != null) {
      body.date = BigInt(body.date);
    }
    const record = await prisma.record.update({
      where: { id: parseInt(recordId) },
      data: body,
    });
    return NextResponse.json(serializeRecord(record));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}
