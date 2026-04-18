export default function LogoMark({ size = 28, title = '주식대시보드 로고' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 46 46"
      role="img"
      aria-label={title}
      style={{ display: 'block', flexShrink: 0 }}>
      <rect
        x="5"
        y="5"
        width="36"
        height="36"
        rx="4"
        transform="rotate(45 23 23)"
        fill="var(--logo-mark-bg, #2A2418)"
      />
      <polyline
        points="10,30 17,23 23,26 32,15"
        stroke="var(--logo-mark-line, #E3526A)"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="15" r="2.5" fill="var(--logo-mark-line, #E3526A)" />
      <circle cx="17" cy="23" r="1.5" fill="var(--logo-mark-dot, #FBF8F1)" opacity="0.7" />
    </svg>
  );
}
