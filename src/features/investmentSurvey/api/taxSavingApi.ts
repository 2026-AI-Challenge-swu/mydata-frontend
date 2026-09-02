import axios from 'axios';

const BASE_URL = import.meta.env.VITE_TAX_SAVING_API_BASE_URL ?? 'http://localhost:8080/api/tax-saving';

const taxSavingHttpClient = axios.create({
  baseURL: BASE_URL,
});

export interface TaxSavingAnalysisRequest {
  totalSalary: number;
  pensionSavingsAccumAmt: number;
  pensionSavingsIssueDate: string;
  pensionSavingsAnnualContribution?: number;
  personalPensionEmployeeAmt: number;
  personalPensionIssueDate: string;
  personalPensionAnnualContribution?: number;
}

export interface TaxSavingAnalysisResponse {
  totalSalary: number;
  deductionRate: number;
  currentPensionSavingsAnnualContribution: number;
  currentPersonalPensionAnnualContribution: number;
  currentEligibleAmount: number;
  currentDeductionAmount: number;
  recommendedEligibleAmount: number;
  recommendedDeductionAmount: number;
  increaseAmount: number;
}

export async function analyzeTaxSaving(
  request: TaxSavingAnalysisRequest,
): Promise<TaxSavingAnalysisResponse> {
  const response = await taxSavingHttpClient.post<TaxSavingAnalysisResponse>('/analysis', request);
  return response.data;
}
