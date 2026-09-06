import { useEffect, useRef, useState } from 'react';
import type { ConnectedMydata } from '../../mydata/utils/assetSummary';
import { generateRetirementReport, type RetirementReportResult } from '../api/retirementReportApi';
import { getCurrentAge } from '../../mydata/utils/assetSummary';

// 이름/생년월일/성별/연봉/직업은 이제 마이데이터 연동(identity/income/employment)으로 받아오므로
// 여기 상수로 안 둠(2026-09-03: PERSONA에서 분리). 아래 값만 마이데이터/설문 어디에서도 안 내려오는
// 진짜 예외값이라 상수로 남김.
export const PERSONA = {
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
  // 리포트 생성이 실패했을 때 화면에 알려주기 위한 상태 — report는 실패해도 null로 지우지 않고
  // 그대로 둠(아래 catch 참고), 그래야 "이미 성공한 리포트가 있는데 중복 요청이 실패해서 화면이
  // 다시 무한로딩으로 돌아가는" 문제가 안 생김.
  const [isError, setIsError] = useState(false);
  // retry()가 이 값을 바꿔서 아래 effect를 강제로 다시 실행시킴(재시도 버튼용).
  const [retryToken, setRetryToken] = useState(0);
  // useRef로 "초기값을 이미 넘겨받았는지"를 기억해둠 — 아래 useEffect가 처음 한 번 실행될 때만
  // 이 값을 보고 fetch를 건너뛰고, 그 다음부터(목표 생활비를 상담원이 수정하는 등)는 정상적으로
  // 다시 fetch하게 하기 위한 "1회용 스킵 플래그"임.
  const skipNextFetch = useRef(Boolean(initialReport));

  // 이 effect가 몇 번째로 실행됐는지 세는 카운터 — 리렌더로 짧은 시간에 이 effect가 다시 돌면,
  // 응답이 도착하는 순서가 요청을 보낸 순서와 다를 수 있음(AI 쪽 응답 시간이 매번 달라서 특히
  // 심함). 가드 없이 그냥 setReport를 부르면 "먼저 보낸 요청의 실패 응답"이 "나중에 보낸 요청의
  // 성공 응답"을 덮어써서 화면에 결과가 떴다가 사라지는 현상이 생김 — 그래서 응답이 도착했을 때
  // 그게 여전히 "가장 최근에 보낸 요청"인지 확인하고, 아니면(오래된 요청의 응답이면) 무시함.
  const requestIdRef = useRef(0);
  // 실제 운영 환경에서 이 effect가 (정확한 원인 미확인이지만) 같은 입력으로 짧은 간격을 두고
  // 두 번 실행되어 AI 서비스에 리포트 생성 요청이 중복으로 나가는 게 확인됨 — 안 그래도 느린
  // AI 호출을 두 배로 만들고, 실패 확률(RAG 서버 동시 부하로 인한 타임아웃)까지 올라감. 이미
  // 요청이 진행 중이면 새 요청을 또 보내지 않도록 막음.
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!connectedMydata) return;

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    if (isFetchingRef.current) return;

    const requestId = ++requestIdRef.current;
    isFetchingRef.current = true;
    setIsError(false);

    const surveyAnswers = Object.entries(answers).map(([questionId, selectedOrder]) => ({
      questionId,
      selectedOrder,
    }));

    generateRetirementReport({
      surveyAnswers,
      currentAge: getCurrentAge(connectedMydata.identity.birthYear),
      gender: connectedMydata.identity.gender,
      targetLivingCost,
      mydata: {
        annualGrossSalary: connectedMydata.income.annualGrossSalary,
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
        // report는 지우지 않음 — 이전에 성공한 리포트가 있었다면 그대로 화면에 남겨두고,
        // isError만 켜서 "재시도 필요" 상태를 알려줌.
        if (requestIdRef.current === requestId) setIsError(true);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) isFetchingRef.current = false;
      });
  }, [
    connectedMydata?.retirementPension.balance,
    connectedMydata?.personalPension.totalContribution,
    connectedMydata?.savingsInvestment.totalBalance,
    connectedMydata?.bankTransaction.monthlyIncome,
    targetLivingCost,
    answers,
    retryToken,
  ]);

  return {
    report,
    isError,
    retry: () => setRetryToken((token) => token + 1),
  };
}
