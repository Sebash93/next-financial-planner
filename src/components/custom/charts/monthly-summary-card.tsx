"use client";

import DataDisplay from "@/components/custom/data-display";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";

type MonthlySummaryCardProps = {
  flow: MonthlyFlow;
};

export default function MonthlySummaryCard({ flow }: MonthlySummaryCardProps) {
  return (
    <DataDisplay
      title="Saldo del Mes"
      description="Balance del mes seleccionado"
      value={numberToCurrency(flow.monthBalance)}
    >
      <div className="flex w-full flex-col items-start gap-2 text-sm">
        <div className="font-medium leading-none">
          Saldo Acumulado a fin de Mes: {numberToCurrency(flow.cumulativeBalance)}
        </div>
        <div className="leading-none text-muted-foreground">
          Ingresos de {numberToCurrency(flow.income)}
        </div>
        <div className="leading-none text-muted-foreground">
          Gastos de {numberToCurrency(flow.budget)}
        </div>
        {flow.creditPayment > 0 && (
          <div className="leading-none text-muted-foreground">
            Pagos de Crédito de {numberToCurrency(flow.creditPayment)}
          </div>
        )}
        {flow.otherCosts > 0 && (
          <div className="leading-none text-muted-foreground">
            Otros Gastos de Crédito de {numberToCurrency(flow.otherCosts)}
          </div>
        )}
        {flow.creditExtraPayment > 0 && (
          <div className="leading-none text-muted-foreground">
            Pagos Extra de Crédito de {numberToCurrency(flow.creditExtraPayment)}
          </div>
        )}
        {flow.expenseFlow > 0 && (
          <div className="leading-none text-muted-foreground">
            Flujo de Gastos del mes de {numberToCurrency(flow.expenseFlow)}
          </div>
        )}
        {flow.debt > 0 && (
          <div className="leading-none text-muted-foreground">
            Deuda Total: {numberToCurrency(flow.debt)}
          </div>
        )}
      </div>
    </DataDisplay>
  );
}
