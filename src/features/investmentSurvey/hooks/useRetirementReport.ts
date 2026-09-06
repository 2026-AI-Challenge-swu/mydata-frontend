import { useEffect, useMemo, useRef, useState } from 'react';
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

// ai-agent-core(Render 무료 플랜)가 유휴 15분 후 잠들었다가 첫 요청에 깨어나는 구조라, 리포트
// 생성 화면에 처음 들어왔을 때(이 세션에서 ai-agent-core를 처음 건드리는 순간) 콜드스타트에
// 걸리는 경우가 잦음(2026-09-06 실서비스에서 확인 — 첫 시도는 거의 항상 실패하고, 그 실패가
// 이미 컨테이너를 깨워놔서 재시도하면 성공하는 패턴이 재현됨). 이 실패를 사용자에게 바로
// "문제가 생겼어요"로 보여주는 대신, 로딩 화면을 유지한 채 몇 번 더 조용히 재시도해서 콜드스타트
// 부팅 시간을 대신 흡수함 — 그래도 다 실패하면 그때 진짜 실패로 보여주고 수동 재시도를 받음.
// 원래 [4000, 10000, 20000](누적 34초)이었는데, 콜드스타트 중엔 각 시도가 502로 거의 즉시(~1~2초)
// 실패해서 포기 시점이 ~41초로 앞당겨짐 — 45초에 뜨는 "서버를 깨우는 중" 안내 문구보다도 먼저
// 포기해버리고, 실측 콜드스타트 예상치(~50초)도 다 못 기다리는 문제가 있었음(2026-09-06 발견).
// 지연을 훨씬 넉넉하게 늘려서 포기 시점을 ~2분 전후로 밀어둠.
const AUTO_RETRY_DELAYS_MS = [5000, 10000, 20000, 30000, 45000];

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

  // 부모(InvestmentProfilePlaceholderScreen)가 리포트를 받을 때마다 navigate()로 history
  // state를 다시 쓰는데, 브라우저가 그 state를 구조적 복제해서 저장하다 보니 다음 렌더에서
  // 꺼내는 answers는 내용은 같아도 객체 참조가 매번 달라짐. 아래 effect의 의존성 배열에 answers
  // 객체를 그대로 넣으면 그 참조 변경만으로 effect가 다시 실행돼서 "리포트 성공 → navigate →
  // answers 참조 변경 → 재요청 → 또 리포트 성공 → navigate → ..." 로 끝없이 재요청을 보내는
  // 루프가 생김(실서비스에서 실제로 재현 확인, 2026-09-06). 참조가 아니라 내용으로 비교하도록
  // 문자열로 변환해서 의존성 배열에 씀 — 내용이 같으면 문자열도 같아서 effect가 다시 안 돎.
  const answersKey = useMemo(() => JSON.stringify(answers), [answers]);

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

    let cancelled = false;
    let pendingRetryTimeout: ReturnType<typeof setTimeout> | null = null;

    const surveyAnswers = Object.entries(answers).map(([questionId, selectedOrder]) => ({
      questionId,
      selectedOrder,
    }));

    const payload = {
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
    };

    // attemptIndex번째 시도(0-based)가 실패하면, 아직 남은 자동 재시도가 있는지 확인해서
    // 있으면 로딩 화면을 유지한 채 지연 후 다시 시도하고, 없으면(콜드스타트로 보기엔 너무
    // 오래 실패한 것) 그때 진짜 실패로 처리해서 수동 재시도 화면을 보여줌.
    const attempt = (attemptIndex: number) => {
      generateRetirementReport(payload)
        .then((result) => {
          if (cancelled || requestIdRef.current !== requestId) return;
          setReport(result);
          isFetchingRef.current = false;
        })
        .catch(() => {
          if (cancelled || requestIdRef.current !== requestId) return;

          if (attemptIndex < AUTO_RETRY_DELAYS_MS.length) {
            pendingRetryTimeout = setTimeout(() => {
              if (!cancelled && requestIdRef.current === requestId) attempt(attemptIndex + 1);
            }, AUTO_RETRY_DELAYS_MS[attemptIndex]);
            return;
          }

          // report는 지우지 않음 — 이전에 성공한 리포트가 있었다면 그대로 화면에 남겨두고,
          // isError만 켜서 "재시도 필요" 상태를 알려줌.
          setIsError(true);
          isFetchingRef.current = false;
        });
    };

    attempt(0);

    return () => {
      cancelled = true;
      if (pendingRetryTimeout) clearTimeout(pendingRetryTimeout);
      // 이 체인이 아직 안 끝난 채로 effect가 재실행/언마운트되는 경우(입력값이 바뀌는 등) 다음
      // effect 실행이 "이미 진행 중"으로 오인해 멈추지 않도록 여기서 풀어줌.
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connectedMydata?.retirementPension.balance,
    connectedMydata?.personalPension.totalContribution,
    connectedMydata?.savingsInvestment.totalBalance,
    connectedMydata?.bankTransaction.monthlyIncome,
    targetLivingCost,
    answersKey,
    retryToken,
  ]);

  return {
    report,
    isError,
    retry: () => setRetryToken((token) => token + 1),
  };
}
