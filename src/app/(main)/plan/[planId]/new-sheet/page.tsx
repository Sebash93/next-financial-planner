import Page from "@/components/custom/page";
import NewSheetForm from "./components/newSheetForm";

export default async function NewSheetPage({ params }) {
    return <Page title="Nueva hoja">
        <div className="max-w-lg mx-auto">
            <NewSheetForm />
        </div>
    </Page>
}