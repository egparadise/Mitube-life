import { ChannelAlert } from '@/types';

export const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatClock(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** 고른 요일들 (1=일 … 7=토, 오름차순). 예전 설정은 weekday 하나. */
export const alertWeekdays = (a: ChannelAlert): number[] =>
  [...new Set(a.weekdays?.length ? a.weekdays : [a.weekday])].sort((x, y) => x - y);

/** 고른 날짜들 (1~28, 오름차순). 예전 설정은 monthDay 하나. */
export const alertMonthDays = (a: ChannelAlert): number[] =>
  [...new Set(a.monthDays?.length ? a.monthDays : [a.monthDay])].sort((x, y) => x - y);

const dayList = (a: ChannelAlert) => alertWeekdays(a).map((w) => WEEKDAY_NAMES[w - 1]);

/** "매일 07:00" / "매주 월·수·금요일 21:00" / "매달 1·15일 09:30" */
export function describeAlert(a: ChannelAlert): string {
  const clock = formatClock(a.hour, a.minute);
  if (a.freq === 'daily') return `매일 ${clock}`;
  if (a.freq === 'weekly') return `매주 ${dayList(a).join('·')}요일 ${clock}`;
  return `매달 ${alertMonthDays(a).join('·')}일 ${clock}`;
}

/** 카드에 붙이는 짧은 표기: "매일 07:00" / "매주 월수금 21:00" / "매달 1·15일 09:30" */
export function shortAlert(a: ChannelAlert): string {
  const clock = formatClock(a.hour, a.minute);
  if (a.freq === 'daily') return `매일 ${clock}`;
  if (a.freq === 'weekly') return `매주 ${dayList(a).join('')} ${clock}`;
  return `매달 ${alertMonthDays(a).join('·')}일 ${clock}`;
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
  // 여러 요일·날짜 중 지금 이전의 가장 최근 회차
  if (a.freq === 'weekly') {
    return Math.max(
      ...alertWeekdays(a).map((w) => {
        const back = (d.getDay() - (w - 1) + 7) % 7;
        const t = at(y, m, date - back);
        return t <= now ? t : at(y, m, date - back - 7);
      }),
    );
  }
  return Math.max(
    ...alertMonthDays(a).map((md) => {
      const t = at(y, m, md);
      return t <= now ? t : at(y, m - 1, md);
    }),
  );
}
