"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  debt: { label: "Deuda", color: "#e60049" },
  creditExtraPayment: { label: "Pagos Extra", color: "#0bb4ff" },
  creditPayment: { label: "Pago Mensual", color: "#50e991" },
  otherCosts: { label: "Otros Gastos", color: "#ffa300" },
} satisfies ChartConfig;

const formatMonth = (ts: number) =>
  new Date(ts).toLocaleString("default", { month: "short", year: "2-digit" });

type CreditViewChartProps = {
  flows: MonthlyFlow[];
};

export default function CreditViewChart({ flows }: CreditViewChartProps) {
  if (flows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit View</CardTitle>
          <CardDescription>Deuda y pagos por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay meses para mostrar.</p>
        </CardContent>
      </Card>
    );
  }

  const data = flows.map((f) => ({
    month: formatMonth(f.month),
    debt: f.debt,
    creditExtraPayment: f.creditExtraPayment,
    creditPayment: f.creditPayment,
    otherCosts: f.otherCosts,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit View</CardTitle>
        <CardDescription>Deuda y pagos por mes</CardDescription>
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
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="debt" type="monotone" stroke="var(--color-debt)" strokeWidth={2} dot={false} />
            <Line dataKey="creditExtraPayment" type="monotone" stroke="var(--color-creditExtraPayment)" strokeWidth={2} dot={false} />
            <Line dataKey="creditPayment" type="monotone" stroke="var(--color-creditPayment)" strokeWidth={2} dot={false} />
            <Line dataKey="otherCosts" type="monotone" stroke="var(--color-otherCosts)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
