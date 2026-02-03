import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ bucketId: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
  const { bucketId } = await params;
  try {
    const bucket = await prisma.bucket.delete({
      where: {
        id: parseInt(bucketId),
      },
    });
    return NextResponse.json(bucket);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    throw new Error("Failed to delete bucket. Please try again.");
  }
}
