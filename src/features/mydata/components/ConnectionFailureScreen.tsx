function SignalOffIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="h-9 w-9" aria-hidden="true">
      <path d="M18 30H18.015" stroke="#E85D4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12.75 24.6435C14.152 23.2693 16.0369 22.4996 18 22.4996C19.9631 22.4996 21.848 23.2693 23.25 24.6435"
        stroke="#E85D4A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 19.2885C9.62704 17.2033 12.3267 15.7987 15.255 15.2535"
        stroke="#E85D4A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.5 19.2885C27.5968 18.4032 26.5853 17.6356 25.4895 17.004"
        stroke="#E85D4A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 13.23C4.85489 11.5711 6.97214 10.2314 9.2655 9.2655"
        stroke="#E85D4A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 13.23C30.7121 11.1837 28.0297 9.62721 25.1178 8.65624C22.2059 7.68527 19.1262 7.32037 16.068 7.58399"
        stroke="#E85D4A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 3L33 33" stroke="#E85D4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M2 8C2 6.4087 2.63214 4.88258 3.75736 3.75736C4.88258 2.63214 6.4087 2 8 2C9.67737 2.00631 11.2874 2.66082 12.4933 3.82667L14 5.33333"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2V5.33333H10.6667" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M14 8C14 9.5913 13.3679 11.1174 12.2426 12.2426C11.1174 13.3679 9.5913 14 8 14C6.32263 13.9937 4.71265 13.3392 3.50667 12.1733L2 10.6667"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.33333 10.6666H2V14" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ConnectionFailureScreenProps {
  onRetry?: () => void;
  onSkip?: () => void;
}

export function ConnectionFailureScreen({ onRetry, onSkip }: ConnectionFailureScreenProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white px-6 pb-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#FFE2E2] bg-[#FEF2F2]">
        <SignalOffIcon />
      </div>

      <div className="mt-6">
        <h1 className="text-2xl leading-[36px] font-bold text-[#1A1A2E]">인증에 실패했어요</h1>
        <p className="mx-auto mt-3 w-[312px] text-sm leading-[22.75px] text-[#6B7280]">
          인증 시간이 초과됐거나 일시적인 오류일 수 있어요.
          <br />
          다시 시도해주시겠어요?
        </p>
      </div>

      <div className="mt-10 w-full max-w-sm">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A78D6] py-4 text-[15px] leading-[22.5px] font-bold text-white"
          onClick={onRetry}
        >
          <RefreshIcon color="white" />
          다시 인증하기
        </button>
        <button
          className="mt-3 w-full rounded-2xl border-2 border-black/8 bg-white py-4 text-[15px] leading-[22.5px] font-bold text-[#1A1A2E]"
          onClick={onSkip}
        >
          건너뛰고 테스트만 하기
        </button>
        <p className="mt-5 text-xs leading-[19.5px] text-[#6B7280]">
          테스트를 먼저 하고 나중에 연동해도 결과를 확인할 수 있어요
        </p>
      </div>
    </div>
  );
}
