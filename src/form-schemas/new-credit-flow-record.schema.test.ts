import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { newCreditFlowRecordSchema } from "./new-credit-flow-record.schema";

const thisMonth = startOfMonth(new Date()).getTime();
const valid = { date: thisMonth, creditRecordId: 1, amount: 500 };

describe("newCreditFlowRecordSchema", () => {
  it("accepts a valid current-month payment", () => {
    expect(newCreditFlowRecordSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a date before the current month", () => {
    expect(newCreditFlowRecordSchema.safeParse({ ...valid, date: thisMonth - 1 }).success).toBe(false);
  });
  it("rejects a missing creditRecordId", () => {
    expect(newCreditFlowRecordSchema.safeParse({ date: thisMonth, amount: 500 }).success).toBe(false);
  });
  it("rejects a non-positive amount", () => {
    expect(newCreditFlowRecordSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });
});
