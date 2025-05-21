import Page from "@/components/custom/page";
import { SheetTileGrid } from "./components/sheetTileGrid";
import { PlanTitle } from "./components/planTitle";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { PageContent } from "@/components/custom/page-content";

type PlanIdPageProps = {
    params: {
        planId: string;
    };
}

export default async function PlanIdPage({ params }: PlanIdPageProps) {
    const { planId } = params;
    return (
        <Page>
            <ReactQueryProvider>
                <PlanTitle planId={planId} />
                <PageContent>
                    <SheetTileGrid planId={planId} />
                </PageContent>
            </ReactQueryProvider>
        </Page>
    );
}
