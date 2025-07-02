import { SheetTypeBadge } from "@/components/custom/sheet-type-badge";
import { Tile } from "@/components/custom/tile";
import { SheetWithRecordsSum } from "@/queries/sheet.queries";
import { numberToCurrency } from "@/utils/currencies";

type SheetTileProps = {
    sheet: SheetWithRecordsSum;
}

export default function SheetTile({ sheet }: SheetTileProps) {
    return (
        <Tile title={sheet.name} badge={<SheetTypeBadge value={sheet.sheetType} />} amount={numberToCurrency(sheet.recordsSum)} />
    );
}