import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConnectionStore } from '../stores/connectionStore';
import { loadAllConnectionItems } from './loadAllConnectionItems';

// httpClient를 통째로 가짜로 바꿔서, 실제 네트워크(백엔드 서버) 없이도 테스트가 돌아가게 함.
vi.mock('./httpClient', () => {
  const successData: Record<string, unknown> = {
    'national-pension': { estimatedMonthlyAmount: 320000, paymentStartAge: 65, contributionYears: 4 },
    'retirement-pension': { balance_amt: 3200000, eval_amt: 3200000, issue_date: '2021-03-15' },
    'personal-pension': {
      accum_amt: 4300000,
      eval_amt: 4450000,
      employer_amt: 0,
      employee_amt: 4300000,
      issue_date: '2022-06-01',
      rcv_start_date: '2054-01-01',
    },
    'savings-investment': {
      accounts: [
        { account_num: '110-123-456789', prod_name: '예금', balance_amt: 20000000 },
        { account_num: '110-987-654321', prod_name: '주식', balance_amt: 7000000 },
        { account_num: '110-555-112233', prod_name: 'ETF', balance_amt: 5000000 },
      ],
    },
    'bank-transaction': { salary_amt: 3400000, expense_amt: 2100000 },
  };

  return {
    httpClient: {
      get: vi.fn((path: string, config?: { params?: { scenario?: string } }) => {
        const scenario = config?.params?.scenario ?? 'success';

        if (scenario === 'failure') {
          return Promise.reject({
            isAxiosError: true,
            response: { data: { message: '인증 실패', retryable: true } },
          });
        }
        if (scenario === 'partialFailure' && path === 'national-pension') {
          return Promise.reject({
            isAxiosError: true,
            response: {
              data: { message: '국민연금공단 연계 실패: 이용기관 등록 심사 미완료', retryable: false },
            },
          });
        }
        return Promise.resolve({ data: successData[path] });
      }),
      post: vi.fn(),
    },
  };
});

describe('loadAllConnectionItems', () => {
  beforeEach(() => {
    useConnectionStore.setState({
      items: {
        nationalPension: { status: 'idle' },
        retirementPension: { status: 'idle' },
        personalPension: { status: 'idle' },
        savingsInvestment: { status: 'idle' },
        bankTransaction: { status: 'idle' },
      },
    });
  });

  it('success 시나리오: 5개 항목 모두 success 상태가 되고 mock 데이터가 채워진다', async () => {
    await loadAllConnectionItems('success');

    const { items } = useConnectionStore.getState();

    expect(items.nationalPension.status).toBe('success');
    expect(items.retirementPension.status).toBe('success');
    expect(items.personalPension.status).toBe('success');
    expect(items.savingsInvestment.status).toBe('success');
    expect(items.bankTransaction.status).toBe('success');

    if (items.nationalPension.status === 'success') {
      expect(items.nationalPension.data.estimatedMonthlyAmount).toBe(320000);
    }
  });

  it('partialFailure 시나리오: 국민연금만 error, 나머지는 success', async () => {
    await loadAllConnectionItems('partialFailure');

    const { items } = useConnectionStore.getState();

    expect(items.nationalPension.status).toBe('error');
    expect(items.retirementPension.status).toBe('success');
    expect(items.personalPension.status).toBe('success');
    expect(items.savingsInvestment.status).toBe('success');
    expect(items.bankTransaction.status).toBe('success');
  });
});
