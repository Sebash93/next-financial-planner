"use client";

import { useState } from "react";
import { startOfMonth } from "date-fns";
import MonthYearPicker from "@/components/custom/month-year-picker";
import MonthlySummaryCard from "@/components/custom/charts/monthly-summary-card";
import { findMonthFlow, type MonthlyFlow } from "@/utils/flow";

type MonthlyResultsProps = {
  flows: MonthlyFlow[];
  range: { startMonth: number; endMonth: number };
  creditBalanceTotal: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function MonthlyResults({ flows, range, creditBalanceTotal }: MonthlyResultsProps) {
  const initial = clamp(startOfMonth(new Date()).getTime(), range.startMonth, range.endMonth);
  const [selectedMonth, setSelectedMonth] = useState(initial);

  // Always resolve to a real flow entry; fall back to the first month.
  const flow = findMonthFlow(flows, selectedMonth) ?? flows[0];

  return (
    <div className="flex flex-col gap-4">
      <MonthYearPicker
        value={selectedMonth}
        onChange={(value) => setSelectedMonth(startOfMonth(value).getTime())}
      />
      {flow && <MonthlySummaryCard flow={flow} creditBalanceTotal={creditBalanceTotal} />}
    </div>
  );
}
