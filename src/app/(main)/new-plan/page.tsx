import Page from "@/components/custom/page";
import { PageTitle } from "@/components/custom/page-title";
import { NewPlanFormWithProvider } from "./components/newPlanForm";

export default function PlanCreatePage() {
    return <Page>
        <PageTitle>Nuevo plan</PageTitle>
        <div className="max-w-lg mx-auto">
            <NewPlanFormWithProvider />
        </div>
    </Page>
}