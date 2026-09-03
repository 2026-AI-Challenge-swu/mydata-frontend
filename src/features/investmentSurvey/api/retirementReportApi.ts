import axios from 'axios';
import type { SurveyAnswer } from '../types/survey';

const BASE_URL =
  import.meta.env.VITE_RETIREMENT_REPORT_API_BASE_URL ?? 'http://localhost:8080/api/retirement-report';

const retirementReportHttpClient = axios.create({
  baseURL: BASE_URL,
});

export type Gender = 'MALE' | 'FEMALE';

export interface MydataSnapshotPayload {
  annualGrossSalary: number;
  nationalPension: {
    estimatedMonthlyAmount: number;
    paymentStartAge: number;
    contributionYears: number;
  };
  retirementPension: {
    balanceAmt: number;
    evalAmt: number;
    issueDate: string;
  };
  personalPensionAccounts: {
    accountType: 'IRP' | 'PENSION_SAVINGS';
    accumAmt: number;
    evalAmt: number;
    employerAmt: number;
    employeeAmt: number;
    issueDate: string;
    rcvStartDate: string;
    annualContribution: number;
  }[];
  savingsInvestment: {
    accounts: { accountNum?: string; prodName?: string; balanceAmt: number }[];
  };
  bankTransaction: {
    salaryAmt: number;
    expenseAmt?: number;
  };
}

export interface RetirementReportRequestPayload {
  surveyAnswers: SurveyAnswer[];
  currentAge: number;
  gender: Gender;
  targetLivingCost?: number;
  mydata: MydataSnapshotPayload;
}

export interface InvestmentProfileResult {
  totalScore: number;
  type: string;
  grade: number;
  emoji: string;
  officialName: string;
  nickname: string;
  description: string;
  cardBackground: string;
  badgeBackground: string;
  accentColor: string;
  categoryScores: { label: string; percent: number }[];
}

export interface PortfolioRecommendationResult {
  profileType: string;
  dcDefaultAllocationDescription: string;
  compositions: { category: string; weightPercent: number }[];
  recommendationReasons: string[];
  expectedAnnualReturnRate: number;
}

export interface FutureAssetSimulationResult {
  currentAge: number;
  targetAge: number;
  points: { age: number; maintainAmount: number; plus20Amount: number; plus40Amount: number }[];
}

// 백엔드 ReportResponse가 @JsonNaming(SnakeCaseStrategy)라 이 필드만 스네이크케이스로 내려옴.
export interface AiReportResult {
  total_comment: string;
  road_map: { id: number; time: string; todo: string }[];
  counselling_points: { tendency: string; detail: string }[];
}

export interface RetirementReportResult {
  investmentProfile: InvestmentProfileResult;
  recommendedPortfolio: PortfolioRecommendationResult;
  futureAssetSimulation: FutureAssetSimulationResult;
  aiReport: AiReportResult;
}

export async function generateRetirementReport(
  payload: RetirementReportRequestPayload,
): Promise<RetirementReportResult> {
  const response = await retirementReportHttpClient.post<RetirementReportResult>('', payload);
  return response.data;
}
