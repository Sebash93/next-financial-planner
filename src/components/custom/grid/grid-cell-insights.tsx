import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateCreditInsights, formatPayoffMonth } from "@/utils/amortization";
import { numberToCurrency } from "@/utils/currencies";
import { Info } from "lucide-react";

type GridCellInsightsProps = {
  projectedBalance: number | null | undefined;
  monthlyPayment: number | null | undefined;
  interestRate: number | null | undefined;
  asOfMonthMs: number;
};

export function GridCellInsights({
  projectedBalance,
  monthlyPayment,
  interestRate,
  asOfMonthMs,
}: GridCellInsightsProps) {
  const insights = calculateCreditInsights(
    projectedBalance,
    monthlyPayment,
    interestRate,
    asOfMonthMs
  );

  const renderTooltipContent = () => {
    if (insights.message) {
      return <p>{insights.message}</p>;
    }

    return (
      <div className="space-y-1">
        <p>Interes este mes: {numberToCurrency(insights.monthlyInterest)}</p>
        {insights.payoffDate && (
          <>
            <p>Fecha estimada de pago: {formatPayoffMonth(insights.payoffDate)}</p>
            <p className="text-muted-foreground">
              ({insights.monthsToPayoff} meses restantes)
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="p-1 hover:bg-muted rounded">
            <Info className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          {renderTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
