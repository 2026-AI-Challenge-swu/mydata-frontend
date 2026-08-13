import { describe, it, expect, beforeEach } from 'vitest';
import { useConnectionStore } from '../stores/connectionStore';
import { loadAllConnectionItems } from './loadAllConnectionItems';

describe('loadAllConnectionItems', () => {
  beforeEach(() => {
    useConnectionStore.setState({
      items: {
        nationalPension: { status: 'idle' },
        retirementPension: { status: 'idle' },
        personalPension: { status: 'idle' },
        savingsInvestment: { status: 'idle' },
      },
    });
  });

  it('success 시나리오: 4개 항목 모두 success 상태가 되고 mock 데이터가 채워진다', async () => {
    await loadAllConnectionItems('success');

    const { items } = useConnectionStore.getState();

    expect(items.nationalPension.status).toBe('success');
    expect(items.retirementPension.status).toBe('success');
    expect(items.personalPension.status).toBe('success');
    expect(items.savingsInvestment.status).toBe('success');

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
  });
});
