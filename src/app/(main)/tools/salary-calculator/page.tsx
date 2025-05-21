import Page from "@/components/custom/page";
import { PageContent } from "@/components/custom/page-content";
import { PageTitle } from "@/components/custom/page-title";
import { SalaryCalculatorForm } from "./components/SalaryCalculatorForm";
import { getTRM } from "@/app/actions/get-trm";

const SalaryCalculatorPage = async () => {
  // Fetch current USD to COP rate
  const trm = await getTRM();
  return (
    <Page>
      <PageTitle>Calculadora de Sueldo</PageTitle>
      <PageContent>
        <SalaryCalculatorForm initialConversionRate={trm} />
      </PageContent>
    </Page>
  );
};

export default SalaryCalculatorPage;