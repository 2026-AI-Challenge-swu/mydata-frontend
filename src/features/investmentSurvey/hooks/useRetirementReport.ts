import { useEffect, useRef, useState } from 'react';
import type { ConnectedMydata } from '../../mydata/utils/assetSummary';
import { generateRetirementReport, type RetirementReportResult } from '../api/retirementReportApi';
import { CURRENT_AGE } from '../../mydata/utils/assetSummary';

// 페르소나 기준표(김민준, 29세) — 마이데이터로 연동되지 않는 값들이라 상수로 둠.
// "내 결과" 화면과 전문가 리포트 화면이 같은 리포트를 봐야 해서, 두 화면이 리포트를 요청할 때
// 쓰는 이 기준값도 한 곳(이 훅)에만 두고 같이 씀 — 예전엔 ConsultantSummaryTab.tsx에만 있었음.
export const PERSONA = {
  name: '김민준',
  birthYear: 1997,
  annualSalaryPreTax: 48_000_000, // 연봉(세전). bankTransaction은 세후 월급만 제공해서 이 값은 정의서 기준 그대로 하드코딩.
  job: '직장인 (IT·기획)',
  // 투자 경험은 별도 상수가 없음 — 설문 1번 문항(category: "투자 경험") 답변에서 직접 파생해서 씀
  // (ConsultantSummaryTab.tsx 참고, 2026-09-03 수정).
  // 추천 포트폴리오 배분표가 성별별로 갈리는데 마이데이터/설문에 성별 필드가 없어 이름(김민준)으로 추정한 상수값.
  gender: '남' as const,
  // 세액공제는 "올해 신규 납입액" 기준으로 계산되는 값이라, mock의 employee_amt(430만원, IRP 개설 이후
  // 누적 총 납입액)와는 다른 의미. 올해분 신규 납입 데이터가 없어서 0으로 둠 — "누적 총 납입액이 0원"이라는
  // 뜻이 아니므로 화면에 "본인 납입액"(누적)을 표시할 땐 이 값 대신 실제 employeeContribution을 써야 함
  // (2026-09-03: 화면에 이 값을 잘못 재사용해서 "445만원 잔액인데 본인 납입 0원"처럼 앞뒤 안 맞게
  // 보이던 버그 발견 → 수정, ConsultantSummaryTab/AssetOverviewScreen 참고).
  annualContributionBySelfThisYear: 0,
};

// "목표 생활비" 정의서 기본값(국민연금연구원 통계 기준). 상담원이 "노후 부족 자금 분석" 카드에서
// 직접 수정할 수도 있지만, 화면 진입 시 처음 리포트를 만들 때는 이 기본값을 씀.
export const TARGET_MONTHLY_LIVING_COST = 2_500_000;

// 연금저축 계좌의 연간 납입액 추정치 — 정의서에 실제 값이 없어서, 이번에 백엔드에서 삭제된
// "누적납입액÷가입연수" 방식을 그대로 재현한 임시 값. 정의서에 확정값이 생기면 이 함수 대신
// 그 값을 써야 함(2026-09-02 기획 확인 보류). 김민준 페르소나는 연금저축 계좌가 없어 미사용.
function estimateAnnualContribution(accumAmt: number, issueDate: string): number {
  const elapsedYears = Math.max(1, new Date().getFullYear() - new Date(issueDate).getFullYear());
  return Math.round(accumAmt / elapsedYears);
}

interface UseRetirementReportParams {
  answers: Record<string, number>;
  connectedMydata: ConnectedMydata | null;
  targetLivingCost: number;
  // "내 결과" 화면에서 이미 만들어둔 리포트가 있으면 여기로 넘겨줌 — 있으면 첫 렌더에서
  // 똑같은 조건으로 다시 호출하지 않고 그 값을 그대로 씀.
  initialReport?: RetirementReportResult | null;
}

export function useRetirementReport({
  answers,
  connectedMydata,
  targetLivingCost,
  initialReport,
}: UseRetirementReportParams) {
  const [report, setReport] = useState<RetirementReportResult | null>(initialReport ?? null);
  // useRef로 "초기값을 이미 넘겨받았는지"를 기억해둠 — 아래 useEffect가 처음 한 번 실행될 때만
  // 이 값을 보고 fetch를 건너뛰고, 그 다음부터(목표 생활비를 상담원이 수정하는 등)는 정상적으로
  // 다시 fetch하게 하기 위한 "1회용 스킵 플래그"임.
  const skipNextFetch = useRef(Boolean(initialReport));

  // 이 effect가 몇 번째로 실행됐는지 세는 카운터 — React StrictMode가 개발 모드에서 effect를
  // 일부러 두 번 실행하거나, 리렌더로 짧은 시간에 이 effect가 다시 돌면, 응답이 도착하는 순서가
  // 요청을 보낸 순서와 다를 수 있음(AI 쪽 응답 시간이 매번 달라서 특히 심함). 가드 없이 그냥
  // setReport를 부르면 "먼저 보낸 요청의 실패 응답"이 "나중에 보낸 요청의 성공 응답"을 덮어써서
  // 화면에 결과가 떴다가 사라지는 현상이 생김 — 그래서 응답이 도착했을 때 그게 여전히 "가장 최근에
  // 보낸 요청"인지 확인하고, 아니면(오래된 요청의 응답이면) 무시함.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!connectedMydata) return;

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const requestId = ++requestIdRef.current;

    const surveyAnswers = Object.entries(answers).map(([questionId, selectedOrder]) => ({
      questionId,
      selectedOrder,
    }));

    generateRetirementReport({
      surveyAnswers,
      currentAge: CURRENT_AGE,
      gender: PERSONA.gender === '남' ? 'MALE' : 'FEMALE',
      targetLivingCost,
      mydata: {
        annualGrossSalary: PERSONA.annualSalaryPreTax,
        nationalPension: {
          estimatedMonthlyAmount: connectedMydata.nationalPension.estimatedMonthlyAmount,
          paymentStartAge: connectedMydata.nationalPension.paymentStartAge,
          contributionYears: connectedMydata.nationalPension.contributionYears,
        },
        retirementPension: {
          balanceAmt: connectedMydata.retirementPension.balance,
          evalAmt: connectedMydata.retirementPension.evaluationAmount,
          issueDate: connectedMydata.retirementPension.issueDate,
        },
        personalPensionAccounts: connectedMydata.personalPension.accounts.map((account) => ({
          accountType: account.accountType,
          accumAmt: account.accumAmt,
          evalAmt: account.balance,
          employerAmt: account.employerAmt,
          employeeAmt: account.employeeContribution,
          issueDate: account.issueDate,
          rcvStartDate: account.rcvStartDate,
          annualContribution:
            account.accountType === 'IRP'
              ? PERSONA.annualContributionBySelfThisYear
              : estimateAnnualContribution(account.accumAmt, account.issueDate),
        })),
        savingsInvestment: {
          accounts: connectedMydata.savingsInvestment.accounts.map((account) => ({
            prodName: account.productName,
            balanceAmt: account.balance,
          })),
        },
        bankTransaction: {
          salaryAmt: connectedMydata.bankTransaction.monthlyIncome,
          expenseAmt: connectedMydata.bankTransaction.monthlyExpense,
        },
      },
    })
      .then((result) => {
        if (requestIdRef.current === requestId) setReport(result);
      })
      .catch(() => {
        if (requestIdRef.current === requestId) setReport(null);
      });
  }, [
    connectedMydata?.retirementPension.balance,
    connectedMydata?.personalPension.totalContribution,
    connectedMydata?.savingsInvestment.totalBalance,
    connectedMydata?.bankTransaction.monthlyIncome,
    targetLivingCost,
    answers,
  ]);

  return report;
}
