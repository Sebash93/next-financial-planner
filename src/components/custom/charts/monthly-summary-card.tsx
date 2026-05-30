"use client";

import DataDisplay from "@/components/custom/data-display";
import { numberToCurrency } from "@/utils/currencies";
import type { MonthlyFlow } from "@/utils/flow";

type MonthlySummaryCardProps = {
  flow: MonthlyFlow;
  creditBalanceTotal: number;
};

export default function MonthlySummaryCard({ flow, creditBalanceTotal }: MonthlySummaryCardProps) {
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
        {flow.expenseFlow > 0 && (
          <div className="leading-none text-muted-foreground">
            Flujo de Gastos del mes de {numberToCurrency(flow.expenseFlow)}
          </div>
        )}
        {creditBalanceTotal > 0 && (
          <div className="leading-none text-muted-foreground">
            Deuda Total: {numberToCurrency(creditBalanceTotal)}
          </div>
        )}
      </div>
    </DataDisplay>
  );
}
