import { useEffect, useState } from 'react';

const PALETTES  = ['sand', 'cream', 'paper'];
const DENSITIES = ['compact', 'cozy', 'spacious'];
const UP_COLORS = ['red', 'green'];

function readStored(key, valid, fallback) {
  const v = localStorage.getItem(key);
  return valid.includes(v) ? v : fallback;
}

export default function useTweaks() {
  const [palette,  setPalette]  = useState(() => readStored('tweaks.palette',  PALETTES,  'sand'));
  const [density,  setDensity]  = useState(() => readStored('tweaks.density',  DENSITIES, 'cozy'));
  const [upColor,  setUpColor]  = useState(() => readStored('tweaks.up',       UP_COLORS, 'red'));

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('tweaks.palette', palette);
  }, [palette]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem('tweaks.density', density);
  }, [density]);

  useEffect(() => {
    document.documentElement.setAttribute('data-up', upColor);
    localStorage.setItem('tweaks.up', upColor);
  }, [upColor]);

  return {
    palette, setPalette, PALETTES,
    density, setDensity, DENSITIES,
    upColor, setUpColor, UP_COLORS,
  };
}
