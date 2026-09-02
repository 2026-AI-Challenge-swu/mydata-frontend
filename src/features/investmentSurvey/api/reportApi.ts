import axios from 'axios';

const BASE_URL = import.meta.env.VITE_REPORT_API_BASE_URL ?? 'http://localhost:8080/api/report';

const reportHttpClient = axios.create({
  baseURL: BASE_URL,
});

export interface ReportAnalysisRequest {
  userProfile: {
    totalScore: number;
    type: string;
    grade: number;
    emoji: string;
    officialName: string;
    nickname: string;
    description: string;
  };
  portfolio: { category: string; weightPercent: number }[];
  retirementPlan: {
    monthlyContribution: number;
    currentAge: number;
    targetAge: number;
    expectedReturnRate: number;
    totalContribution: number;
    expectedProfit: number;
    taxBenefit: number;
    expectedAssetAtRetirement: number;
  };
  metrics: {
    annualTaxBenefit: number;
    assetAt65: number;
    assetIncreaseAfter20Years: number;
    cumulativeTaxBenefit: number;
  };
}

// 백엔드 ReportResponse가 @JsonNaming(SnakeCaseStrategy)라 실제 JSON은 스네이크케이스로 내려옴 — 그대로 반영.
export interface ReportAnalysisResponse {
  total_comment: string;
  road_map: { id: number; time: string; todo: string }[];
  counselling_points: { tendency: string; detail: string }[];
}

export async function analyzeReport(request: ReportAnalysisRequest): Promise<ReportAnalysisResponse> {
  const response = await reportHttpClient.post<ReportAnalysisResponse>('', request);
  return response.data;
}
