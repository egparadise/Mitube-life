type RGB = [number, number, number];

function parse(hex: string): RGB {
  const h = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(h)) return [128, 128, 128];
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** a 와 b 를 t(0~1) 비율로 섞는다. t=0 이면 a, t=1 이면 b. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

function luminance(hex: string): number {
  const [r, g, b] = parse(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const DARK_TEXT = '#1c1d21';
const DARK_TEXT_L = luminance(DARK_TEXT);

/**
 * 배경색 위에서 더 잘 읽히는 글자색(진한 회색/흰색)을 WCAG 대비 기준으로 고른다.
 * 순수 검정이 아니라 실제로 칠하는 진한 회색과 비교해야 보라·남색 위에서 잘못 고르지 않는다.
 */
export function readableText(bg: string): string {
  const L = luminance(bg);
  const onDark = (L + 0.05) / (DARK_TEXT_L + 0.05);
  const onWhite = 1.05 / (L + 0.05);
  return onDark >= onWhite ? DARK_TEXT : '#ffffff';
}
