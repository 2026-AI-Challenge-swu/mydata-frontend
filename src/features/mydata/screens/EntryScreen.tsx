import { useNavigate } from 'react-router-dom';

export function EntryScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full flex-col justify-center bg-white px-6 pb-16 text-center">
      <h1 className="text-2xl leading-[36px] font-bold text-[#1A1A2E]">
        나는 어떤
        <br />
        금융유형일까?
      </h1>
      <p className="mx-auto mt-3 w-[280px] text-sm leading-[22.75px] text-[#6B7280]">
        연금과 자산을 함께 살펴보고
        <br />내 투자 유형을 확인해보세요
      </p>

      <div className="mt-10 w-full max-w-sm">
        <button
          className="w-full rounded-2xl bg-[#2A78D6] py-4 text-[15px] leading-[22.5px] font-bold text-white"
          onClick={() => navigate('/mydata/consent')}
        >
          테스트 시작하기 +
        </button>
      </div>
    </div>
  );
}
