import { Plan, Sheet, Record, Tag, Bucket } from "@prisma/client";

type RecordWithRelations = Record & {
    tag: Tag | null;
    bucket: Bucket | null;
};

type SheetWithRecords = Sheet & {
    Record: RecordWithRelations[];
};

export type PlanWithSheets = Plan & {
    Sheet: SheetWithRecords[];
};

/**
 * Converts plan data to CSV format
 * Creates a CSV with all sheets and their records
 */
export function convertPlanToCSV(plan: PlanWithSheets): string {
    const lines: string[] = [];

    // Add plan header
    lines.push(`Plan: ${plan.name}`);
    lines.push(
        `Period: ${new Date(plan.initialDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`
    );
    lines.push(""); // Empty line

    // Process each sheet
    plan.Sheet.forEach((sheet, index) => {
        if (index > 0) {
            lines.push(""); // Empty line between sheets
        }

        // Sheet header
        lines.push(`Sheet: ${sheet.name} (${sheet.sheetType})`);

        // CSV headers
        lines.push(
            "Record Name,Amount,Date,Tag,Tag Color,Bucket"
        );

        // Add records
        sheet.Record.forEach((record) => {
            const fields = [
                escapeCSVField(record.name),
                record.amount.toString(),
                record.date ? new Date(Number(record.date)).toLocaleDateString() : "",
                escapeCSVField(record.tag?.name || ""),
                escapeCSVField(record.tag?.color || ""),
                escapeCSVField(record.bucket?.name || ""),
            ];
            lines.push(fields.join(","));
        });

        // Add sheet total
        const total = sheet.Record.reduce((sum, record) => sum + record.amount, 0);
        lines.push(`Total:,${total},,,,`);
    });

    return lines.join("\n");
}

/**
 * Escapes CSV field (handles commas, quotes, and newlines)
 */
function escapeCSVField(field: string): string {
    if (!field) return "";

    // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
    }

    return field;
}

/**
 * Triggers browser download of CSV file
 */
export function downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
