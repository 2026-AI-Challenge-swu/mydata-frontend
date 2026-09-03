import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CATEGORY_LABELS } from '../constants';
import type { ConnectionCategory } from '../types/connection';

const CATEGORIES: ConnectionCategory[] = [
  'identity',
  'income',
  'employment',
  'nationalPension',
  'retirementPension',
  'personalPension',
  'savingsInvestment',
  'bankTransaction',
];

const CATEGORY_SUBTITLES: Record<ConnectionCategory, string> = {
  identity: '이름·생년월일·성별 확인',
  income: '소득금액증명원 기준 세전 연봉',
  employment: '재직 여부 및 직업 정보',
  nationalPension: '납부 이력 및 예상 수령액',
  retirementPension: 'DB형/DC형 적립금',
  personalPension: '연금저축·IRP 계좌 현황',
  savingsInvestment: '은행·증권사 보유 상품',
  bankTransaction: '월급·소비 패턴',
};

// 아래 3개(본인 확인/소득/재직 정보)는 Figma 시안엔 없던 항목이라, 기존 아이콘들과 같은 스타일
// (획 기반, currentColor, viewBox 20x20)로 직접 제작.
function UserCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path
        d="M13.3334 17.5V15.8333C13.3334 14.9493 12.9822 14.1014 12.3571 13.4763C11.7319 12.8512 10.8841 12.5 10.0001 12.5H5.00008C4.11602 12.5 3.26818 12.8512 2.64306 13.4763C2.01793 14.1014 1.66675 14.9493 1.66675 15.8333V17.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.50008 9.16667C9.34103 9.16667 10.8334 7.67428 10.8334 5.83333C10.8334 3.99238 9.34103 2.5 7.50008 2.5C5.65913 2.5 4.16675 3.99238 4.16675 5.83333C4.16675 7.67428 5.65913 9.16667 7.50008 9.16667Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.3333 6.66669L15 8.33335L18.3333 5.00002" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BanknoteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path
        d="M2.5 5H17.5C17.9602 5 18.3333 5.3731 18.3333 5.83333V14.1667C18.3333 14.6269 17.9602 15 17.5 15H2.5C2.03976 15 1.66667 14.6269 1.66667 14.1667V5.83333C1.66667 5.3731 2.03976 5 2.5 5Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path
        d="M17.5 5.83331H2.5C1.57953 5.83331 0.833334 6.57951 0.833334 7.49998V15.8333C0.833334 16.7538 1.57953 17.5 2.5 17.5H17.5C18.4205 17.5 19.1667 16.7538 19.1667 15.8333V7.49998C19.1667 6.57951 18.4205 5.83331 17.5 5.83331Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3333 17.5V4.16665C13.3333 3.72462 13.1577 3.30069 12.8452 2.98813C12.5326 2.67557 12.1087 2.49998 11.6667 2.49998H8.33333C7.89131 2.49998 7.46738 2.67557 7.15482 2.98813C6.84226 3.30069 6.66667 3.72462 6.66667 4.16665V17.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 아래 4개 아이콘 전부 Figma "Copy as SVG"로 받아온 실제 벡터
function PiggyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path
        d="M15.8333 4.16669C14.5833 4.16669 13.5 5.33335 13.3333 5.83335C10.4166 4.58335 4.16663 5.58335 4.16663 10C4.16663 11.5 4.16663 12.5 5.83329 13.75V16.6667H9.16663V15H11.6666V16.6667H15V13.3334C15.8333 12.9167 16.4166 12.5 16.6666 11.6667H18.3333V8.33335H16.6666C16.6666 7.50002 16.25 7.08335 15.8333 6.66669V4.16669Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.66663 7.5V8.33333C1.66663 9.25 2.41663 10 3.33329 10H4.16663"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.3334 9.16669H13.3417" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path
        d="M13.3333 16.6667V3.33335C13.3333 2.89133 13.1577 2.4674 12.8451 2.15484C12.5326 1.84228 12.1087 1.66669 11.6666 1.66669H8.33329C7.89127 1.66669 7.46734 1.84228 7.15478 2.15484C6.84222 2.4674 6.66663 2.89133 6.66663 3.33335V16.6667"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.6666 5H3.33329C2.41282 5 1.66663 5.74619 1.66663 6.66667V15C1.66663 15.9205 2.41282 16.6667 3.33329 16.6667H16.6666C17.5871 16.6667 18.3333 15.9205 18.3333 15V6.66667C18.3333 5.74619 17.5871 5 16.6666 5Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path
        d="M16.6667 10.8333C16.6667 15 13.75 17.0833 10.2834 18.2916C10.1018 18.3531 9.90466 18.3502 9.72504 18.2833C6.25004 17.0833 3.33337 15 3.33337 10.8333V4.99997C3.33337 4.77895 3.42117 4.56699 3.57745 4.41071C3.73373 4.25443 3.94569 4.16663 4.16671 4.16663C5.83337 4.16663 7.91671 3.16663 9.36671 1.89997C9.54325 1.74913 9.76784 1.66626 10 1.66626C10.2322 1.66626 10.4568 1.74913 10.6334 1.89997C12.0917 3.17497 14.1667 4.16663 15.8334 4.16663C16.0544 4.16663 16.2663 4.25443 16.4226 4.41071C16.5789 4.56699 16.6667 4.77895 16.6667 4.99997V10.8333Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path d="M15 16.6667V8.33337" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 16.6667V3.33337" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16.6666V11.6666" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 은행 거래내역 카드는 Figma 시안엔 없던 항목이라, 나머지 4개와 같은 스타일(획 기반, currentColor)로 직접 제작
function ReceiptIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-[#2A78D6]" aria-hidden="true">
      <path
        d="M5 2.5H15C15.4602 2.5 15.8333 2.8731 15.8333 3.33333V17.5L13.3333 15.8333L10.8333 17.5L8.33333 15.8333L5.83333 17.5L3.33333 17.5V3.33333C3.33333 2.8731 3.70643 2.5 4.16667 2.5H5Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.66663 7.5H13.3333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.66663 10.8333H13.3333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CATEGORY_ICONS: Record<ConnectionCategory, () => React.JSX.Element> = {
  identity: UserCheckIcon,
  income: BanknoteIcon,
  employment: BriefcaseIcon,
  nationalPension: PiggyIcon,
  retirementPension: BuildingIcon,
  personalPension: ShieldIcon,
  savingsInvestment: ChartIcon,
  bankTransaction: ReceiptIcon,
};

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="#1A1A2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Figma는 브라우저 기본 체크박스가 아니라 커스텀 사각 체크박스를 씀 — 체크 시 파란 사각형+흰 체크마크
function CustomCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
        checked ? 'border-[#2A78D6] bg-[#2A78D6]' : 'border-[#D1D5DC] bg-white'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 8 6" fill="none" className="h-[4.5px] w-2" aria-hidden="true">
          <path d="M0.5 3L3 5.5L7.5 0.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function ConsentScreen() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-full w-full flex-col bg-[#FAFAF7] px-6 pt-12 pb-10">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] leading-[19.5px] font-bold text-[#6B7280]">마이데이터 연동</span>
        <button
          className="text-[13px] leading-[19.5px] font-bold text-[#6B7280] underline"
          onClick={() => navigate('/mydata/survey')}
        >
          건너뛰고 테스트만 하기
        </button>
      </div>

      {/* 뒤로가기 */}
      <button
        className="mt-4 flex h-8 w-8 items-center justify-center rounded-full border border-black/8 bg-white/90 shadow"
        onClick={() => navigate(-1)}
        aria-label="이전으로"
      >
        <BackIcon />
      </button>

      {/* 타이틀 */}
      <h1 className="mt-4 text-[24px] leading-[36px] font-bold text-[#1A1A2E]">
        내 연금 정보를
        <br />
        불러올까요?
      </h1>
      <p className="mt-2 text-sm leading-[22.75px] text-[#6B7280]">
        동의하면 가입한 상품과 자산 현황을
        <br />
        자동으로 채워드려요
      </p>

      {/* 항목 카드 4개 */}
      <ul className="mt-6 flex flex-col gap-3">
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <li
              key={category}
              className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3.5"
            >
              <Icon />
              <div>
                <div className="text-sm leading-[21px] font-bold text-[#1A1A2E]">{CATEGORY_LABELS[category]}</div>
                <div className="text-xs leading-[18px] text-[#6B7280]">{CATEGORY_SUBTITLES[category]}</div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* 동의 체크박스 */}
      <label className="mt-6 flex items-start gap-2 text-[13px] leading-[21.125px] font-bold text-[#1A1A2E]">
        <input
          type="checkbox"
          className="sr-only"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        <CustomCheckbox checked={agreed} />
        금융정보 조회에 동의합니다. 수집된 정보는 진단 목적으로만 사용되며, 개인정보보호법에 따라 안전하게
        처리됩니다.
      </label>

      {/* CTA 버튼 */}
      <div className="mt-auto pt-8">
        <button
          className="w-full rounded-2xl bg-[#2A78D6] py-4 text-base leading-6 font-bold text-white shadow disabled:opacity-40 disabled:shadow-none"
          disabled={!agreed}
          onClick={() => navigate('/mydata/connect', { state: location.state })}
        >
          동의하고 불러오기
        </button>
      </div>
    </div>
  );
}
