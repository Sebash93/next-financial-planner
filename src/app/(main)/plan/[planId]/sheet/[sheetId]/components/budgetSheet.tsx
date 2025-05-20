import BudgetGrid from "./budgetGrid";
import PieChart from "@/components/custom/charts/pie-chart";
import { categoriesDistributionReport } from "@/utils/reports/categories-distribution";
import { RecordModel } from "@/models/record";
import DataDisplay from "@/components/custom/data-display";
import { numberToCurrency } from "@/utils/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accountsTotalsReport } from "@/utils/reports/accounts-totals";

const income = 26314000 + 2700000;
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

const pieChartData = categoriesDistributionReport(records);
const accountData = accountsTotalsReport(records);

const total = records.reduce((acc, record) => acc + record.value, 0)

export default function BudgetSheet() {
    return <div className="container mx-auto py-10">
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                <BudgetGrid records={records} />
            </div>
            <div className="col-span-1 space-y-4">
                <DataDisplay title="Total" description="Total del presupuesto" value={numberToCurrency(total)}>
                    <div className="flex w-full items-start gap-2 text-sm">
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2 font-medium leading-none">
                                Resultado del ejercicio {
                                    numberToCurrency(income - total)
                                }
                            </div>
                            <div className="flex items-center gap-2 leading-none text-muted-foreground">
                                Ingresos de {numberToCurrency(income)}
                            </div>
                        </div>
                    </div>
                </DataDisplay>
                <PieChart title="Categorías" description="Distribución del presupuesto por categorías" data={pieChartData} dataLabel="name" dataKey="percentage" />
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Distribución de Categorías</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {pieChartData.map((category) => (
                                <div key={category.name} className="flex items-center gap-2 font-medium leading-none">
                                    {category.name}: {numberToCurrency(category.total)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Distribución de Cuentas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {accountData.map((account) => (
                                <div key={account.name} className="flex items-center gap-2 font-medium leading-none">
                                    {account.name}: {numberToCurrency(account.total)}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
}