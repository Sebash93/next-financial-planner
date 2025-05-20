export default function SheetTile({ sheet }) {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col items-center p-6">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {sheet.name}
            </h4>
            <p className="leading-7">
                {sheet.sheetType}
            </p>
        </div>
    );
}