"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useState } from "react"
import { numberToCurrency } from "@/utils/currencies"
import { InputCurrency } from "@/components/custom/input-currency"

// Schema for salary calculator inputs (mensajes en español)
const salaryFormSchema = z.object({
  salary: z.number().min(0, { message: "El salario debe ser un número no negativo" }),
  paymentFee: z.number().min(0, { message: "La tarifa de pago debe ser no negativa" }),
  conversionRate: z.number().min(0, { message: "La tasa de conversión debe ser no negativa" }),
  deductionPercentage: z
    .number()
    .min(0, { message: "El porcentaje de deducción debe ser al menos 0" })
    .max(100, { message: "El porcentaje de deducción no puede exceder 100" }),
})

type SalaryFormValues = z.infer<typeof salaryFormSchema>

interface SalaryCalculatorFormProps {
  initialConversionRate: number;
}

const defaultFormValues = {
  paymentFee: 3,
  deductionPercentage: 69,
}

// cacl salary
function calculateSalary(values: SalaryFormValues) {
  const { salary, paymentFee, conversionRate, deductionPercentage } = values
  const paymentFeeValue = (salary * paymentFee) / 100
  const salaryAfterFee = salary - paymentFeeValue
  const salaryAfterFeeCOP = salaryAfterFee * conversionRate
  const deductionValue = (salaryAfterFeeCOP * deductionPercentage) / 100
  const salaryAfterDeduction = salaryAfterFeeCOP - deductionValue
  const salaryIBC = salaryAfterDeduction * 40 / 100
  const taxes = salaryIBC * (0.125 + 0.16)
  return {
    paymentFeeValue,
    salaryAfterFeeCOP,
    salaryAfterDeduction,
    salaryIBC,
    taxes
  }
}

export function SalaryCalculatorForm({ initialConversionRate }: SalaryCalculatorFormProps) {
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      salary: 0,
      paymentFee: defaultFormValues.paymentFee,
      conversionRate: initialConversionRate,
      deductionPercentage: defaultFormValues.deductionPercentage,
    },
  })
  const [salaryResults, setSalaryResults] = useState<{
    salaryAfterDeduction: number; salaryIBC: number,
    paymentFeeValue: number; taxes: number, salaryAfterFeeCOP: number
  } | null>(null)

  function onSubmit(values: SalaryFormValues) {
    const { salaryAfterDeduction, salaryIBC, paymentFeeValue, taxes, salaryAfterFeeCOP } = calculateSalary(values)
    setSalaryResults({ salaryAfterDeduction, salaryIBC, paymentFeeValue, taxes, salaryAfterFeeCOP })
  }
  return (
    <Card className="max-w-lg mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salario base (USD)</FormLabel>
                    <FormControl>
                      <InputCurrency {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarifa de pago (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conversionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de conversión</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Impuestos</h3>
              <FormField
                control={form.control}
                name="deductionPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentaje de deducción (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Calcular</Button>
          </CardFooter>
        </form>
      </Form>
      {salaryResults && (
        <div className="p-4">
          <h3 className="text-lg font-semibold">Resultados</h3>
          <p>Fee: {numberToCurrency(salaryResults.paymentFeeValue)} USD</p>
          <p>Salario despues del Fee: {numberToCurrency(salaryResults.salaryAfterFeeCOP)} USD</p>
          <p>Salario después de deducción: {numberToCurrency(salaryResults.salaryAfterDeduction)} COP</p>
          <p>Salario IBC: {numberToCurrency(salaryResults.salaryIBC)} COP</p>
          <p>Impuestos: {numberToCurrency(salaryResults.taxes)} COP</p>
        </div>
      )}
    </Card>
  )
}