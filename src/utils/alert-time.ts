import { ChannelAlert } from '@/types';

export const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatClock(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** "매일 07:00" / "매주 토요일 21:00" / "매달 15일 09:30" */
export function describeAlert(a: ChannelAlert): string {
  const clock = formatClock(a.hour, a.minute);
  if (a.freq === 'daily') return `매일 ${clock}`;
  if (a.freq === 'weekly') return `매주 ${WEEKDAY_NAMES[a.weekday - 1]}요일 ${clock}`;
  return `매달 ${a.monthDay}일 ${clock}`;
}

/** 카드에 붙이는 짧은 표기: "매일 07:00" / "매주 토 21:00" / "매달 15일 09:30" */
export function shortAlert(a: ChannelAlert): string {
  const clock = formatClock(a.hour, a.minute);
  if (a.freq === 'daily') return `매일 ${clock}`;
  if (a.freq === 'weekly') return `매주 ${WEEKDAY_NAMES[a.weekday - 1]} ${clock}`;
  return `매달 ${a.monthDay}일 ${clock}`;
}

/** now 이전(같은 시각 포함)의 가장 최근 알림 시각 (ms). 기기 현지 시간 기준. */
export function lastOccurrence(a: ChannelAlert, now: number = Date.now()): number {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = d.getMonth();
  const date = d.getDate();
  const at = (yy: number, mm: number, dd: number) => new Date(yy, mm, dd, a.hour, a.minute, 0, 0).getTime();

  if (a.freq === 'daily') {
    const t = at(y, m, date);
    return t <= now ? t : at(y, m, date - 1);
  }
  if (a.freq === 'weekly') {
    const back = (d.getDay() - (a.weekday - 1) + 7) % 7;
    const t = at(y, m, date - back);
    return t <= now ? t : at(y, m, date - back - 7);
  }
  const t = at(y, m, a.monthDay);
  return t <= now ? t : at(y, m - 1, a.monthDay);
}
