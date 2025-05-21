import Page from "@/components/custom/page";
import { NewPlanFormWithProvider } from "./components/newPlanForm";

export default function PlanCreatePage() {
    return <Page title="Nuevo plan">
        <div className="max-w-lg mx-auto">
            <NewPlanFormWithProvider />
        </div>
    </Page>
}