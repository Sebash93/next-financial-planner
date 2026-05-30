"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { numberToCurrency } from '@/utils/currencies';
import { useMemo } from 'react';
import { PieChart as RechartsPieChart, Pie } from 'recharts';

const COLORS = ["#e60049", "#0bb4ff", "#50e991", "#e6d800", "#9b19f5", "#ffa300", "#dc0ab4", "#b3d4ff", "#00bfa0"];

type DataItem = Record<string, string | number>;

const genChartConfigFromData = (dataKey: string, dataLabel: string, data: DataItem[]): ChartConfig => {
    const config: ChartConfig = {}
    data.forEach((item, index) => {
        const labelValue = String(item[dataLabel]);
        config[labelValue] = {
            label: labelValue,
            color: COLORS[index],
        }
    })
    return {
        [dataKey]: {
            label: dataKey
        },
        ...config
    }
}

type PieChartProps = {
    title: string;
    description: string;
    dataKey: string;
    dataLabel: string;
    data: DataItem[];
};

export default function PieChart({ title, description, dataKey, dataLabel, data }: PieChartProps) {
    const chartConfig = useMemo(() => genChartConfigFromData(dataKey, dataLabel, data), [dataKey, dataLabel, data])
    const dataWithFill = data.map((item, index) => {
        return {
            ...item,
            fill: COLORS[index]
        }
    })
    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-0">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
                    <RechartsPieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={dataWithFill}
                            labelLine={false}
                            innerRadius={60}
                            strokeWidth={5}
                            dataKey={dataKey}
                            nameKey={dataLabel}
                            label={({ payload, ...props }) => <text
                                cx={props.cx}
                                cy={props.cy}
                                x={props.x}
                                y={props.y}
                                textAnchor={props.textAnchor}
                                dominantBaseline={props.dominantBaseline}
                                fill="hsla(var(--foreground))"
                            >
                                {numberToCurrency(payload["total"])}
                            </text>}
                        >
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
                    </RechartsPieChart>
                </ChartContainer>
            </CardContent>

        </Card>
    );
}