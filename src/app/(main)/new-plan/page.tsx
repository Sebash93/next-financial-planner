import Page from "@/components/custom/page";
import NewPlanForm from "./components/newPlanForm";

export default function PlanCreatePage() {
    return <Page title="Nuevo plan">
        <div className="max-w-lg mx-auto">
            <NewPlanForm />
        </div>
    </Page>
}