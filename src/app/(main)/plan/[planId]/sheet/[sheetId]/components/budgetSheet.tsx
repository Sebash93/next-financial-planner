"use client"

import BudgetGrid from "./budgetGrid";
import { RecordModel } from "@/models/record";
import { BudgetTags } from "./budgetTags";
import { useTagQuery } from "@/queries/tag.queries";
import { useBucketQuery } from "@/queries/bucket.queries";
import { useRecordQuery } from "@/queries/record.queries";
import { OverAllTotals } from "@/components/custom/charts/overall-totals";
import { BudgetTagDistribution } from "@/components/custom/charts/budget-tag-distribution";
import { BudgetBucketDistribution } from "@/components/custom/charts/budget-bucket-distribution";

const records: RecordModel[] = [
    {
        name: "Seguro Credito Hipotecario",
        value: 32000,
        category: "Financiero",
        account: "Bancolombia Debito",
    },
    {
        name: "Seguro Cardif",
        value: 26000,
        category: "Financiero",
        account: "Bancolombia Debito",
    },
    {
        name: "Servicios Publicos",
        value: 230000,
        category: "Apartamento",
        account: "Bancolombia Debito",
    },
    {
        name: "Internet",
        value: 60000,
        category: "Apartamento",
        account: "Payoneer",
    },
    {
        name: "Aseo",
        value: 330000,
        category: "Apartamento",
        account: "Bancolombia Debito",
    },
    {
        name: "Mercado",
        value: 350000,
        category: "Alimentación",
        account: "Payoneer",
    },
    {
        name: "Oliver Proteinas",
        value: 215000,
        category: "Alimentación",
        account: "Payoneer",
    },
    {
        name: "Render",
        value: 10200,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "True Caller",
        value: 4900,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Amazon Prime Video",
        value: 25000,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Didi Club",
        value: 18900,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Spotify",
        value: 26400,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Youtube Premium",
        value: 41900,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Nest Aware",
        value: 35000,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Copilot",
        value: 45000,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Netflix",
        value: 54800,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "iCloud",
        value: 44800,
        category: "Subscripciones",
        account: "Payoneer",
    },
    {
        name: "Celular",
        value: 43000,
        category: "Subscripciones",
        account: "Bancolombia Debito",
    },
    {
        name: "Barberia",
        value: 160000,
        category: "Bienestar",
        account: "Payoneer",
    },
    {
        name: "Terapeuta",
        value: 600000,
        category: "Bienestar",
        account: "Payoneer",
    },
    {
        name: "Skincare",
        value: 80000,
        category: "Bienestar",
        account: "Payoneer",
    },
    {
        name: "Transporte",
        value: 400000,
        category: "Transporte",
        account: "Payoneer",
    },
    {
        name: "Salidas y ocio",
        value: 650000,
        category: "Entretenimiento",
        account: "Payoneer",
    },
    {
        name: "Cafe y restaurantes",
        value: 450000,
        category: "Entretenimiento",
        account: "Payoneer",
    },
    {
        name: "Suplementos deportivos",
        value: 80000,
        category: "Bienestar",
        account: "NU Bank",
    },
    {
        name: "Plan complementario mamá",
        value: 200000,
        category: "Familia",
        account: "Payoneer",
    },
    {
        name: "EMI Familia",
        value: 105000,
        category: "Familia",
        account: "Bancolombia Debito",
    },
    {
        name: "Apoyo para mamá",
        value: 300000,
        category: "Familia",
        account: "Payoneer",
    },
    {
        name: "Salidas Familiares",
        value: 120000,
        category: "Familia",
        account: "Payoneer",
    },
    {
        name: "Hipoteca Cactus",
        value: 1550000,
        category: "Inversión",
        account: "Bancolombia Debito",
    },
    {
        name: "Administración Cactus",
        value: 760000,
        category: "Inversión",
        account: "Payoneer",
    },
    {
        name: "Arriendo Vera",
        value: 3360000,
        category: "Arriendo",
        account: "Payoneer",
    },
    {
        name: "Fondo de Liquidez",
        value: 1000000,
        category: "Ahorro",
        account: "NU Bank",
    },
    {
        name: "Fondo de Imprevistos",
        value: 200000,
        category: "Ahorro",
        account: "NU Bank",
    },
    {
        name: "Botaniko",
        value: 10000000,
        category: "Inversión",
        account: "Payoneer",
    },
    {
        name: "Credito BBVA",
        value: 110000,
        category: "Deudas",
        account: "Bancolombia Debito",
    },
    {
        name: "Seguridad Social",
        value: 450000,
        category: "Impuestos",
        account: "Bancolombia Debito",
    },
    {
        name: "Gastos Personales",
        value: 700000,
        category: "Gastos Personales",
        account: "NU Bank",
    },
    {
        name: "Abono BBVA Extra",
        value: 2500000,
        category: "Deudas",
        account: "Bancolombia Debito",
    },
    {
        name: "Ahorro Cactus",
        value: 300000,
        category: "Ahorro",
        account: "NU Bank",
    }
];

type BudgetSheetProps = {
    sheetId: string;
}

export default function BudgetSheet({ sheetId }: BudgetSheetProps) {
    const { data: tags, isLoading: isLoadingTags } = useTagQuery(sheetId);
    const { data: buckets, isLoading: isLoadingBuckets, } = useBucketQuery(sheetId);
    const { data: records, isLoading: isLoadingRecords } = useRecordQuery(sheetId);

    const allDataLoaded = tags && buckets && records;

    return <div className="container mx-auto py-10">
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                {allDataLoaded &&
                    <BudgetGrid sheetId={sheetId} records={records} tags={tags} buckets={buckets} />}
            </div>
            <div className="col-span-1 space-y-4">
                <OverAllTotals />
                {tags && records && <BudgetTagDistribution records={records} tags={tags} />}
                {tags && records && <BudgetTags records={records} tags={tags} sheetId={sheetId} />}
                {buckets && records && <BudgetBucketDistribution records={records} buckets={buckets} />}
            </div>
        </div>
    </div>
}