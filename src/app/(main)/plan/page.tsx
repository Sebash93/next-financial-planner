import Page from "@/components/custom/page";
import { PlanTileGrid } from "./components/planTileGrid";
import { PageTitle } from "@/components/custom/page-title";
import { PageContent } from "@/components/custom/page-content";
import { ReactQueryProvider } from "@/providers/react-query-provider";

export default async function PlanPage() {
    return <Page>
        <PageTitle>
            Planes
        </PageTitle>
        <PageContent>
            <ReactQueryProvider>
                <PlanTileGrid />
            </ReactQueryProvider>
        </PageContent>
    </Page>
}