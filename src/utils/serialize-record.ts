import { Record as RecordModel } from "@prisma/client";

/**
 * Convert a Record's BigInt `date` to a number so NextResponse.json can
 * serialize it. Millisecond timestamps fit safely within Number range.
 */
export const serializeRecord = (record: RecordModel) => ({
  ...record,
  date: record.date == null ? null : Number(record.date),
});
