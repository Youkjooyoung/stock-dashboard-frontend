import { useState, useRef, useEffect } from 'react';
import useTweaks from '../hooks/useTweaks';
import styles from '../styles/components/TweaksPanel.module.css';

const PALETTE_LABEL  = { sand: '샌드', cream: '크림', paper: '페이퍼' };
const DENSITY_LABEL  = { compact: '조밀', cozy: '기본', spacious: '여유' };
const UP_LABEL       = { red: '빨강(한국)', green: '녹색(서구)' };

export default function TweaksPanel() {
  const {
    palette, setPalette, PALETTES,
    density, setDensity, DENSITIES,
    upColor, setUpColor, UP_COLORS,
  } = useTweaks();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(p => !p)}
        title="테마/밀도 조정"
        aria-label="테마/밀도 조정">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4" />
        </svg>
        <span className={styles.label}>TWEAKS</span>
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="테마 설정">
          <Section label="팔레트">
            <Segment options={PALETTES} value={palette} onChange={setPalette} labels={PALETTE_LABEL} />
          </Section>
          <Section label="밀도">
            <Segment options={DENSITIES} value={density} onChange={setDensity} labels={DENSITY_LABEL} />
          </Section>
          <Section label="상승색">
            <Segment options={UP_COLORS} value={upColor} onChange={setUpColor} labels={UP_LABEL} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className={styles.section}>
      <div className={styles['section-label']}>{label}</div>
      {children}
    </div>
  );
}

function Segment({ options, value, onChange, labels }) {
  return (
    <div className={styles.segment} role="radiogroup">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          className={`${styles['segment-btn']} ${value === opt ? styles.active : ''}`}
          onClick={() => onChange(opt)}>
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}
