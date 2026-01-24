import Page from "@/components/custom/page";
import NewSheetForm from "./components/newSheetForm";
import { PageTitle } from "@/components/custom/page-title";
import { PageContent } from "@/components/custom/page-content";
import { ReactQueryProvider } from "@/providers/react-query-provider";

export default async function NewSheetPage({
    params
}: {
    params: Promise<{ planId: string }>
}) {
    const { planId } = await params
    return <Page>
        <PageTitle>
            Nueva Hoja
        </PageTitle>
        <PageContent>
            <div className="max-w-lg mx-auto">
                <ReactQueryProvider>
                    <NewSheetForm planId={planId as string} />
                </ReactQueryProvider>
            </div>
        </PageContent>
    </Page>
}