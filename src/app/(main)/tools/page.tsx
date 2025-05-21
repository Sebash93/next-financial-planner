export const ToolsPage = () => {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Herramientas</h1>
            <p className="text-muted-foreground">Herramientas para la gestión de planes de trabajo.</p>
            <div className="grid gap-4 md:grid-cols-2">
                {/* <PlanSummaryReport planId={planId} /> */}
                {/* <PlanBucketDistribution planId={planId} /> */}
            </div>
        </div>
    );
}