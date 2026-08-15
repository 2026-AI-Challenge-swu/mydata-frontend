function SignalOffIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
      <path
        d="M8 15a17 17 0 0 1 24 0M13 20.5a10 10 0 0 1 14 0M18 26a3 3 0 0 1 4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-red-400"
      />
      <path d="M6 6l28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400" />
    </svg>
  );
}

interface ConnectionFailureScreenProps {
  onRetry?: () => void;
  onSkip?: () => void;
}

export function ConnectionFailureScreen({ onRetry, onSkip }: ConnectionFailureScreenProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <SignalOffIcon />
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-800">인증에 실패했어요</h1>
        <p className="mt-2 text-sm text-slate-500">
          인증 시간이 초과됐거나 일시적인 오류일 수 있어요.
          <br />
          다시 시도해주시겠어요?
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          className="rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white"
          onClick={onRetry}
        >
          ↻ 다시 인증하기
        </button>
        <button
          className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600"
          onClick={onSkip}
        >
          건너뛰고 테스트만 하기
        </button>
        <p className="text-xs text-slate-400">테스트를 먼저 하고 나중에 연동해도 결과를 확인할 수 있어요</p>
      </div>
    </div>
  );
}
