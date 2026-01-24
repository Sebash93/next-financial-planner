import Page from "@/components/custom/page";
import { PageTitle } from "@/components/custom/page-title";
import { NewBucketForm } from "./components/newBucketForm";
import { Tile } from "@/components/custom/tile";
import { Bucket } from "@prisma/client";

export const dynamic = 'force-dynamic';

export default async function BucketPage() {
    const buckets: Bucket[] = await fetch("http://localhost:3000/api/bucket").then((res) => res.json());
    return <Page>
        <PageTitle>Bolsillos</PageTitle>
        <NewBucketForm />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-8">
            {buckets?.length && buckets.map((bucket) => {
                return <Tile key={bucket.id} title={bucket.name} />
            })}
        </div>
    </Page>
}