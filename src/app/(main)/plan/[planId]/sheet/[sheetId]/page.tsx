import Page from "@/components/custom/page";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { SheetTitle } from "./components/sheetTitle";
import { SheetContent } from "./components/sheetContent";
import { SheetSettings } from "./components/sheetSettings";

export default async function SheetPage({ params }: { params: Promise<{ sheetId: string; planId: string }> }) {
    const { sheetId, planId } = await params;
    return (
        <Page>
            <ReactQueryProvider>
                <SheetTitle sheetId={sheetId} />
                <SheetContent sheetId={sheetId} />
                <SheetSettings planId={planId} sheetId={sheetId} />
            </ReactQueryProvider>
        </Page>
    );
}