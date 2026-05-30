import { describe, it, expect } from "vitest";
import { startOfMonth } from "date-fns";
import { newExpenseFlowRecordSchema } from "./new-expense-flow-record.schema";

const valid = { name: "Gasto", amount: 100 };

describe("newExpenseFlowRecordSchema date validation", () => {
  it("accepts a date at the start of the current month", () => {
    const date = startOfMonth(new Date()).getTime();
    expect(newExpenseFlowRecordSchema.safeParse({ ...valid, date }).success).toBe(true);
  });

  it("accepts a date later this month", () => {
    const date = startOfMonth(new Date()).getTime() + 5 * 24 * 60 * 60 * 1000;
    expect(newExpenseFlowRecordSchema.safeParse({ ...valid, date }).success).toBe(true);
  });

  it("rejects a date before the current month", () => {
    const date = startOfMonth(new Date()).getTime() - 1;
    const result = newExpenseFlowRecordSchema.safeParse({ ...valid, date });
    expect(result.success).toBe(false);
  });
});
