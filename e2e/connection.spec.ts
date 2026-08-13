import { test, expect } from '@playwright/test';

test('초기 화면에서는 4개 항목이 모두 대기 중이다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('국민연금')).toBeVisible();
  await expect(page.getByText('대기 중')).toHaveCount(4);
});

test('성공 시나리오 버튼을 누르면 로딩을 거쳐 4개 항목이 모두 성공으로 표시된다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '성공 시나리오' }).click();

  await expect(page.getByText('불러오는 중...')).toHaveCount(4);

  await expect(page.getByText('모든 항목 조회가 완료됐어요')).toBeVisible();
  await expect(page.getByText('예상 월 수령액 320,000원 (65세부터, 가입 4년)')).toBeVisible();
  await expect(page.getByText('평가금액 3,200,000원')).toBeVisible();
});

test('부분 실패 시나리오 버튼을 누르면 국민연금만 에러로 표시된다', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '부분 실패 시나리오' }).click();

  await expect(page.getByText('일부 항목은 조회에 실패했어요')).toBeVisible();
  await expect(page.getByText('국민연금공단 연계 실패: 이용기관 등록 심사 미완료')).toBeVisible();
  await expect(page.getByText('평가금액 3,200,000원')).toBeVisible();
});
