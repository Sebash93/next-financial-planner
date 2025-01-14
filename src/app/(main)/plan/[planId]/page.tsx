import Page from "@/components/custom/page";

export default async function PlanPage({ params }) {
    const { planId } = await params;
    const plan = await fetch(`http://localhost:3000/api/plan/${planId}`).then((res) => res.json());
    console.log({ plan });
    return (
        <Page title={plan.name}>
            This is the plan
        </Page>
    );
}