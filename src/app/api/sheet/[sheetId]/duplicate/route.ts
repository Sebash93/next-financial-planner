import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ sheetId: string }> }
) {
    const { sheetId } = await params;
    const { destinationPlanId } = await request.json();

    if (!destinationPlanId) {
        return NextResponse.json(
            { error: "destinationPlanId is required" },
            { status: 400 }
        );
    }

    try {
        // Fetch the original sheet with all its related data
        const originalSheet = await prisma.sheet.findUnique({
            where: {
                id: parseInt(sheetId),
            },
            include: {
                Record: true,
                Tag: true,
            },
        });

        if (!originalSheet) {
            return NextResponse.json(
                { error: "Sheet not found" },
                { status: 404 }
            );
        }

        // Verify destination plan exists
        const destinationPlan = await prisma.plan.findUnique({
            where: {
                id: destinationPlanId,
            },
        });

        if (!destinationPlan) {
            return NextResponse.json(
                { error: "Destination plan not found" },
                { status: 404 }
            );
        }

        // Create the duplicate sheet with all related data in a transaction
        const duplicatedSheet = await prisma.$transaction(async (tx) => {
            // Create the new sheet
            const newSheet = await tx.sheet.create({
                data: {
                    name: `${originalSheet.name} (Duplicado)`,
                    planId: destinationPlanId,
                    sheetType: originalSheet.sheetType,
                },
            });

            // Create a map to store old tag ID to new tag ID mapping
            const tagIdMap = new Map<number, number>();

            // Duplicate all tags
            if (originalSheet.Tag.length > 0) {
                for (const tag of originalSheet.Tag) {
                    const newTag = await tx.tag.create({
                        data: {
                            name: tag.name,
                            color: tag.color,
                            sheetId: newSheet.id,
                        },
                    });
                    tagIdMap.set(tag.id, newTag.id);
                }
            }

            // Duplicate all records
            if (originalSheet.Record.length > 0) {
                for (const record of originalSheet.Record) {
                    await tx.record.create({
                        data: {
                            name: record.name,
                            amount: record.amount,
                            date: record.date,
                            sheetId: newSheet.id,
                            bucketId: record.bucketId,
                            // Map old tag ID to new tag ID if it exists
                            tagId: record.tagId ? tagIdMap.get(record.tagId) || null : null,
                        },
                    });
                }
            }

            return newSheet;
        });

        // Fetch the complete duplicated sheet with all relations
        const completeSheet = await prisma.sheet.findUnique({
            where: {
                id: duplicatedSheet.id,
            },
            include: {
                Record: true,
                Tag: true,
                plan: true,
            },
        });

        return NextResponse.json(completeSheet);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error duplicating sheet:", error.stack);
        }
        return NextResponse.json(
            { error: "Failed to duplicate sheet. Please try again." },
            { status: 500 }
        );
    }
}
