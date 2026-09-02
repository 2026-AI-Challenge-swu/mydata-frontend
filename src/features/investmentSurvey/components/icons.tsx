// 아래 아이콘 전부 Figma "투자성향테스트" 프레임에서 내려받은 실제 벡터(SVG asset)

export function BackChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B7280" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckBadgeIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M16.3508 7.5C16.6933 9.18097 16.4492 10.9286 15.6591 12.4513C14.8691 13.9741 13.5809 15.18 12.0094 15.868C10.4379 16.5559 8.67797 16.6843 7.02322 16.2318C5.36848 15.7792 3.91889 14.773 2.91621 13.3811C1.91352 11.9891 1.41834 10.2954 1.51325 8.58254C1.60815 6.86965 2.28741 5.24107 3.43774 3.96838C4.58807 2.69569 6.13994 1.85582 7.83455 1.58884C9.52916 1.32186 11.2641 1.6439 12.75 2.50125"
        stroke="#2A78D6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.75 8.25L9 10.5L16.5 3" stroke="#2A78D6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LeftArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 12L6 8L10 4" stroke="#1A1A2E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RightArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AiAvatarIcon({ color = '#E85D4A' }: { color?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M8 5.33333V2.66667H5.33333" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12 5.33333H4C3.26362 5.33333 2.66667 5.93029 2.66667 6.66667V12C2.66667 12.7364 3.26362 13.3333 4 13.3333H12C12.7364 13.3333 13.3333 12.7364 13.3333 12V6.66667C13.3333 5.93029 12.7364 5.33333 12 5.33333Z"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1.33333 9.33333H2.66667" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.3333 9.33333H14.6667" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 8.66667V10" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8.66667V10" stroke={color} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SendIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M8.47933 12.6502C8.5015 12.7054 8.54002 12.7525 8.58974 12.7852C8.63946 12.8179 8.698 12.8346 8.75749 12.8331C8.81698 12.8316 8.87459 12.8119 8.92257 12.7767C8.97055 12.7415 9.00661 12.6925 9.02592 12.6362L12.8176 1.55283C12.8363 1.50115 12.8398 1.44521 12.8279 1.39157C12.8159 1.33794 12.7889 1.28881 12.75 1.24995C12.7112 1.21109 12.6621 1.18411 12.6084 1.17215C12.5548 1.16019 12.4989 1.16375 12.4472 1.18242L1.36383 4.97408C1.30754 4.99339 1.2585 5.02945 1.22329 5.07743C1.18809 5.12541 1.1684 5.18302 1.16688 5.24251C1.16535 5.302 1.18206 5.36054 1.21477 5.41026C1.24747 5.45998 1.2946 5.49851 1.34983 5.52067L5.97567 7.37567C6.1219 7.43421 6.25476 7.52177 6.36625 7.63305C6.47773 7.74433 6.56552 7.87704 6.62433 8.02317L8.47933 12.6502Z"
        stroke={color}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.7482 1.25242L6.3665 7.6335" stroke={color} strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M6.58366 16.6667C8.17414 17.4826 10.0037 17.7036 11.7427 17.2898C13.4817 16.8761 15.0158 15.8549 16.0685 14.4102C17.1211 12.9655 17.6232 11.1923 17.4841 9.41015C17.3451 7.62803 16.5741 5.95416 15.3102 4.69018C14.0462 3.4262 12.3723 2.65523 10.5902 2.5162C8.80807 2.37717 7.03489 2.87922 5.59018 3.93189C4.14547 4.98456 3.12424 6.51861 2.71051 8.25761C2.29679 9.99661 2.51778 11.8262 3.33366 13.4167L1.66699 18.3334L6.58366 16.6667Z"
        stroke="white"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompassIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M10.8267 5.17333L9.624 8.78067C9.55854 8.97705 9.44826 9.15551 9.30188 9.30188C9.15551 9.44826 8.97705 9.55854 8.78067 9.624L5.17333 10.8267L6.376 7.21933C6.44145 7.02294 6.55174 6.84449 6.69812 6.69812C6.84449 6.55174 7.02294 6.44145 7.21933 6.376L10.8267 5.17333Z"
        stroke="#8EC5FF"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z"
        stroke="#8EC5FF"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75"
        stroke={color}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.08301 5.83337L6.99967 8.75004L9.91634 5.83337" stroke={color} strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8.75V1.75" stroke={color} strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShareIcon({ color = '#1A1A2E' }: { color?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M10.5 4.66663C11.4665 4.66663 12.25 3.88312 12.25 2.91663C12.25 1.95013 11.4665 1.16663 10.5 1.16663C9.5335 1.16663 8.75 1.95013 8.75 2.91663C8.75 3.88312 9.5335 4.66663 10.5 4.66663Z"
        stroke={color}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 8.75C4.4665 8.75 5.25 7.9665 5.25 7C5.25 6.0335 4.4665 5.25 3.5 5.25C2.5335 5.25 1.75 6.0335 1.75 7C1.75 7.9665 2.5335 8.75 3.5 8.75Z"
        stroke={color}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 12.8334C11.4665 12.8334 12.25 12.0499 12.25 11.0834C12.25 10.1169 11.4665 9.33337 10.5 9.33337C9.5335 9.33337 8.75 10.1169 8.75 11.0834C8.75 12.0499 9.5335 12.8334 10.5 12.8334Z"
        stroke={color}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.01074 7.88086L8.99491 10.2025" stroke={color} strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.98908 3.79749L5.01074 6.11915" stroke={color} strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeIcon({ color = '#000000' }: { color?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        d="M8.50201 1.68981C8.63926 1.56793 8.81645 1.50061 9.00001 1.50061C9.18357 1.50061 9.36075 1.56793 9.49801 1.68981L16.248 7.68981C16.3891 7.82385 16.4726 8.00748 16.4808 8.20193C16.489 8.39637 16.4213 8.58639 16.292 8.73185C16.1627 8.8773 15.9819 8.96681 15.7879 8.98145C15.5938 8.99609 15.4017 8.93472 15.252 8.81031L15 8.58756V14.2501C15 14.6479 14.842 15.0294 14.5607 15.3107C14.2794 15.592 13.8978 15.7501 13.5 15.7501H4.50001C4.10218 15.7501 3.72065 15.592 3.43935 15.3107C3.15804 15.0294 3.00001 14.6479 3.00001 14.2501V8.58756L2.74801 8.81031C2.59835 8.93472 2.40619 8.99609 2.21213 8.98145C2.01807 8.96681 1.83729 8.8773 1.708 8.73185C1.5787 8.58639 1.51101 8.39637 1.51922 8.20193C1.52744 8.00748 1.61091 7.82385 1.75201 7.68981L8.50201 1.68981ZM4.50001 7.25256V14.2501H6.75001V10.5001C6.75001 10.3011 6.82902 10.1104 6.96968 9.96973C7.11033 9.82908 7.30109 9.75006 7.50001 9.75006H10.5C10.6989 9.75006 10.8897 9.82908 11.0303 9.96973C11.171 10.1104 11.25 10.3011 11.25 10.5001V14.2501H13.5V7.25331L9.00001 3.25356L4.50001 7.25256ZM9.75001 14.2501V11.2501H8.25001V14.2501H9.75001Z"
        fill={color}
      />
    </svg>
  );
}

export function BankIcon({ color = '#8EC5FF' }: { color?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M10.6663 13.3334V2.66671C10.6663 2.31309 10.5259 1.97395 10.2758 1.7239C10.0258 1.47385 9.68663 1.33337 9.33301 1.33337H6.66634C6.31272 1.33337 5.97358 1.47385 5.72353 1.7239C5.47348 1.97395 5.33301 2.31309 5.33301 2.66671V13.3334"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.333 4H2.66634C1.92996 4 1.33301 4.59695 1.33301 5.33333V12C1.33301 12.7364 1.92996 13.3333 2.66634 13.3333H13.333C14.0694 13.3333 14.6663 12.7364 14.6663 12V5.33333C14.6663 4.59695 14.0694 4 13.333 4Z"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DatabaseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M8 5.33333C11.3137 5.33333 14 4.4379 14 3.33333C14 2.22876 11.3137 1.33333 8 1.33333C4.68629 1.33333 2 2.22876 2 3.33333C2 4.4379 4.68629 5.33333 8 5.33333Z"
        stroke="#1A1A2E"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 3.33333V12.6667C2 13.1971 2.63214 13.7058 3.75736 14.0809C4.88258 14.456 6.4087 14.6667 8 14.6667C9.5913 14.6667 11.1174 14.456 12.2426 14.0809C13.3679 13.7058 14 13.1971 14 12.6667V3.33333"
        stroke="#1A1A2E"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 8C2 8.53043 2.63214 9.03914 3.75736 9.41421C4.88258 9.78929 6.4087 10 8 10C9.5913 10 11.1174 9.78929 12.2426 9.41421C13.3679 9.03914 14 8.53043 14 8"
        stroke="#1A1A2E"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 상담 포인트 항목 아이콘 (Figma "상담 포인트" 섹션에서 다운로드, 원본 14x14 #FF8904)
export function AlertCircleIcon({ color = '#FF8904' }: { color?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path
        d="M7.00033 12.8332C10.222 12.8332 12.8337 10.2215 12.8337 6.99984C12.8337 3.77818 10.222 1.1665 7.00033 1.1665C3.77866 1.1665 1.16699 3.77818 1.16699 6.99984C1.16699 10.2215 3.77866 12.8332 7.00033 12.8332Z"
        stroke={color}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 4.6665V6.99984" stroke={color} strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 9.3335H7.00583" stroke={color} strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

