import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_LABELS } from '../constants';
import type { ConnectionCategory } from '../types/connection';

const CATEGORIES: ConnectionCategory[] = [
  'nationalPension',
  'retirementPension',
  'personalPension',
  'savingsInvestment',
];

export function ConsentScreen() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-[#6B7280]">마이데이터 연동</span>
        <button className="text-xs text-[#6B7280] underline" onClick={() => navigate('/mydata/report')}>
          간단테스트만 하기
        </button>
      </div>

      <h1 className="mt-6 text-xl leading-[30px] font-bold text-[#1A1A2E]">
        내 연금 정보를
        <br />
        불러올까요?
      </h1>

      <ul className="mt-6 divide-y divide-black/5">
        {CATEGORIES.map((category) => (
          <li key={category} className="py-3.5 text-sm text-[#1A1A2E]">
            {CATEGORY_LABELS[category]}
          </li>
        ))}
      </ul>

      <label className="mt-6 flex items-start gap-2 text-xs leading-[19.5px] text-[#6B7280]">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        마이데이터 이용약관 및 개인정보 제공에 동의합니다.
      </label>

      <div className="mt-auto pt-8">
        <button
          className="w-full rounded-2xl bg-[#2A78D6] py-4 text-[15px] leading-[22.5px] font-bold text-white disabled:opacity-40"
          disabled={!agreed}
          onClick={() => navigate('/mydata/connect')}
        >
          동의하고 불러오기
        </button>
      </div>
    </div>
  );
}
