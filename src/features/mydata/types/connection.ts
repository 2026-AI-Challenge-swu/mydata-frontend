export type ConnectionCategory =
  | 'nationalPension'
  | 'retirementPension'
  | 'personalPension'
  | 'savingsInvestment';

export type ItemStatus =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string };

export type ScreenStep = 'intro' | 'consent' | 'loading' | 'result';
