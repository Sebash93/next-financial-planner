"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  cumulativeBalance: { label: "Saldo Acumulado", color: "#0bb4ff" },
} satisfies ChartConfig;

const formatMonth = (ts: number) =>
  new Date(ts).toLocaleString("default", { month: "short", year: "2-digit" });

type FlowBalanceChartProps = {
  flows: MonthlyFlow[];
};

export default function FlowBalanceChart({ flows }: FlowBalanceChartProps) {
  const data = flows.map((f) => ({
    month: formatMonth(f.month),
    cumulativeBalance: f.cumulativeBalance,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flow View</CardTitle>
        <CardDescription>Saldo acumulado por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[300px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} className="capitalize" />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={80}
              tickFormatter={(v) => numberToCurrency(v as number)}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => numberToCurrency(value as number)}
            />
            <Line
              dataKey="cumulativeBalance"
              type="monotone"
              stroke="var(--color-cumulativeBalance)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
