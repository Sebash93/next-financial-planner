import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ planId: string }> }
) {
    const { planId } = await params;

    try {
        const plan = await prisma.plan.findUnique({
            where: {
                id: parseInt(planId),
            },
            include: {
                Sheet: {
                    include: {
                        Record: {
                            include: {
                                tag: true,
                                bucket: true,
                            },
                        },
                    },
                },
            },
        });

        if (!plan) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        // Convert BigInt to string for JSON serialization
        const planData = JSON.parse(
            JSON.stringify(plan, (key, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );

        return NextResponse.json(planData);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching plan for export:", error.stack);
        }
        return NextResponse.json(
            { error: "Failed to fetch plan data. Please try again." },
            { status: 500 }
        );
    }
}
