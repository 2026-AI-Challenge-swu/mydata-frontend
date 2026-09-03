// 마이데이터 연동 화면(ConnectionItemRow)의 스피너와 같은 스타일 — 앱 전체에서 "로딩 중"을 같은 모양으로 표현.
export function LoadingSpinner({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <span
      className={`inline-block ${className} animate-spin rounded-full border-2 border-blue-200 border-t-blue-500 align-middle`}
      aria-hidden="true"
    />
  );
}
