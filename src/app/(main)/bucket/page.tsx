import Page from "@/components/custom/page";
import { PageTitle } from "@/components/custom/page-title";
import { NewBucketForm } from "./components/newBucketForm";
import { BucketList } from "./components/bucketList";
import { ReactQueryProvider } from "@/providers/react-query-provider";

export default function BucketPage() {
    return <Page>
        <PageTitle>Bolsillos</PageTitle>
        <ReactQueryProvider>
            <NewBucketForm />
            <BucketList />
        </ReactQueryProvider>
    </Page>
}
