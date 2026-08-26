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

export function AiAvatarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M8 5.33333V2.66667H5.33333" stroke="#E85D4A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12 5.33333H4C3.26362 5.33333 2.66667 5.93029 2.66667 6.66667V12C2.66667 12.7364 3.26362 13.3333 4 13.3333H12C12.7364 13.3333 13.3333 12.7364 13.3333 12V6.66667C13.3333 5.93029 12.7364 5.33333 12 5.33333Z"
        stroke="#E85D4A"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1.33333 9.33333H2.66667" stroke="#E85D4A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.3333 9.33333H14.6667" stroke="#E85D4A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 8.66667V10" stroke="#E85D4A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8.66667V10" stroke="#E85D4A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
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

