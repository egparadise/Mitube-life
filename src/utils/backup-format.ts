import type { AlertFreq, Category, Channel, ChannelAlert, Video } from '@/types';

/**
 * 내 분류 백업 파일(JSON) 형식과 검사.
 * 다른 기기·다른 주소(예: localhost ↔ mitube-life.web.app)로 분류함·채널을 옮길 때 쓴다.
 * 로그인 토큰·API 키·클라이언트 정보는 절대 담지 않는다.
 */

export const BACKUP_APP = 'mytube';
export const BACKUP_VERSION = 1;

/** 지나치게 큰 파일을 막는 상한. */
const MAX_CATEGORIES = 500;
const MAX_CHANNELS = 20000;
const MAX_VIDEOS_PER_CHANNEL = 20;

export interface Backup {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  categories: Category[];
  channels: Channel[];
  channelAlerts: Record<string, ChannelAlert>;
  recentVideos: Record<string, Video[]>;
  lastCheckedAt: number | null;
  baselineAt: number | null;
  /** 탭(최상위 분류함 id 또는 '__none__')별로 마지막으로 본 시각 — 옮긴 뒤 NEW 표시가 쏟아지지 않게. */
  seenAt: Record<string, number>;
}

export interface BackupSource {
  categories: Category[];
  channels: Channel[];
  channelAlerts: Record<string, ChannelAlert>;
  recentVideos: Record<string, Video[]>;
  lastCheckedAt: number | null;
  baselineAt: number | null;
  seenAt: Record<string, number>;
}

/** 지금 상태에서 백업에 담을 것만 골라 만든다. */
export function makeBackup(s: BackupSource, now = new Date()): Backup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    categories: s.categories,
    channels: s.channels,
    channelAlerts: s.channelAlerts,
    recentVideos: s.recentVideos,
    lastCheckedAt: s.lastCheckedAt,
    baselineAt: s.baselineAt,
    seenAt: s.seenAt,
  };
}

export function backupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `mytube-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

export class BackupError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 2000): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v.slice(0, max) : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const intIn = (v: unknown, lo: number, hi: number): number | undefined => {
  const n = num(v);
  return n !== undefined && Number.isInteger(n) && n >= lo && n <= hi ? n : undefined;
};
const FREQS: AlertFreq[] = ['daily', 'weekly', 'monthly'];
/** '미분류' 탭이 쓰는 예약 키 (src/app/index.tsx 의 NONE). */
const NONE_TAB = '__none__';
/**
 * id 는 영문·숫자·_·- 만 받는다 (유튜브 채널·영상 id, 앱이 만드는 cat-… id 가 모두 여기에 맞는다).
 * 알림·영상 목록이 id 를 객체 키로 쓰므로 toString·__proto__ 같은 기본 이름과 '미분류' 탭 키는 거부한다.
 */
const safeId = (v: unknown): string | undefined => {
  if (typeof v !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(v)) return undefined;
  if (v in Object.prototype || v === NONE_TAB) return undefined;
  return v;
};

/**
 * 파일 내용을 읽어 검사하고, 앱에 넣어도 안전한 모양으로 다듬어 돌려준다.
 * 모르는 칸은 버리고, 없는 분류함을 가리키는 채널은 미분류로, 고아 하위 분류함은 최상위로 바꾼다.
 */
export function parseBackup(text: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('JSON 파일이 아니에요. "내 분류 내보내기"로 만든 파일을 골라 주세요.');
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP) {
    throw new BackupError('마이 튜브 백업 파일이 아니에요. "내 분류 내보내기"로 만든 파일을 골라 주세요.');
  }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    throw new BackupError('더 새 버전 앱에서 만든 파일이라 읽을 수 없어요. 앱을 새로고침한 뒤 다시 시도해 주세요.');
  }
  if (!Array.isArray(raw.categories) || !Array.isArray(raw.channels)) {
    throw new BackupError('파일에 분류함·채널 목록이 없어요.');
  }
  if (raw.categories.length > MAX_CATEGORIES || raw.channels.length > MAX_CHANNELS) {
    throw new BackupError('파일이 너무 커요.');
  }

  // 분류함
  const categories: Category[] = [];
  const seenCat = new Set<string>();
  for (const c of raw.categories) {
    if (!isObj(c)) continue;
    const id = safeId(c.id);
    const name = str(c.name, 40);
    if (!id || !name || seenCat.has(id)) continue;
    seenCat.add(id);
    categories.push({
      id,
      name,
      emoji: str(c.emoji, 16) ?? '📁',
      color: typeof c.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(c.color) ? c.color : '#9CA3AF',
      order: num(c.order) ?? categories.length,
      parentId: safeId(c.parentId) ?? null,
      ...(Array.isArray(c.keywords)
        ? { keywords: c.keywords.filter((k): k is string => typeof k === 'string').slice(0, 100) }
        : {}),
    });
  }
  // 하위는 한 단계만: 없는 상위·하위의 하위·자기 자신을 가리키면 최상위로.
  const topIds = new Set(categories.filter((c) => !c.parentId).map((c) => c.id));
  for (const c of categories) {
    if (c.parentId && (c.parentId === c.id || !topIds.has(c.parentId))) c.parentId = null;
  }
  if (categories.length === 0) throw new BackupError('파일에 분류함이 하나도 없어요.');

  // 채널
  const channels: Channel[] = [];
  const seenCh = new Set<string>();
  for (const ch of raw.channels) {
    if (!isObj(ch)) continue;
    const id = safeId(ch.id);
    const title = str(ch.title, 300);
    if (!id || !title || seenCh.has(id)) continue;
    seenCh.add(id);
    const categoryId = str(ch.categoryId, 100);
    const subs = num(ch.subscriberCount);
    channels.push({
      id,
      title,
      description: typeof ch.description === 'string' ? ch.description.slice(0, 5000) : '',
      ...(str(ch.thumbnail, 2000) ? { thumbnail: str(ch.thumbnail, 2000) } : {}),
      ...(subs !== undefined ? { subscriberCount: subs } : {}),
      categoryId: categoryId && seenCat.has(categoryId) ? categoryId : null,
    });
  }

  // 알림 (있는 채널 것만)
  const channelAlerts: Record<string, ChannelAlert> = {};
  if (isObj(raw.channelAlerts)) {
    for (const [chId, a] of Object.entries(raw.channelAlerts)) {
      if (!seenCh.has(chId) || !isObj(a)) continue;
      const freq = FREQS.find((f) => f === a.freq);
      const hour = intIn(a.hour, 0, 23);
      const minute = intIn(a.minute, 0, 59);
      if (!freq || hour === undefined || minute === undefined) continue;
      channelAlerts[chId] = {
        freq,
        hour,
        minute,
        weekday: intIn(a.weekday, 1, 7) ?? 7,
        monthDay: intIn(a.monthDay, 1, 28) ?? 1,
        weekdays: Array.isArray(a.weekdays)
          ? a.weekdays.map((w) => intIn(w, 1, 7)).filter((w): w is number => w !== undefined)
          : undefined,
        monthDays: Array.isArray(a.monthDays)
          ? a.monthDays.map((d) => intIn(d, 1, 28)).filter((d): d is number => d !== undefined)
          : undefined,
      };
    }
  }

  // 최근 영상 (있는 채널 것만)
  const recentVideos: Record<string, Video[]> = {};
  if (isObj(raw.recentVideos)) {
    for (const [chId, list] of Object.entries(raw.recentVideos)) {
      if (!seenCh.has(chId) || !Array.isArray(list)) continue;
      const videos: Video[] = [];
      for (const v of list.slice(0, MAX_VIDEOS_PER_CHANNEL)) {
        if (!isObj(v)) continue;
        const id = safeId(v.id);
        const title = str(v.title, 500);
        const publishedAt = str(v.publishedAt, 40);
        if (!id || !title || !publishedAt || Number.isNaN(Date.parse(publishedAt))) continue;
        videos.push({
          id,
          title,
          publishedAt,
          ...(str(v.thumbnail, 2000) ? { thumbnail: str(v.thumbnail, 2000) } : {}),
          ...(typeof v.isShort === 'boolean' ? { isShort: v.isShort } : {}),
        });
      }
      if (videos.length) recentVideos[chId] = videos;
    }
  }

  // 본 시각 (최상위 분류함 탭과 '미분류' 탭 것만)
  const seenAt: Record<string, number> = {};
  if (isObj(raw.seenAt)) {
    const tabKeys = new Set([...categories.filter((c) => !c.parentId).map((c) => c.id), NONE_TAB]);
    for (const [key, at] of Object.entries(raw.seenAt)) {
      const t = num(at);
      if (tabKeys.has(key) && t !== undefined && t > 0) seenAt[key] = t;
    }
  }

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: str(raw.exportedAt, 40) ?? '',
    categories,
    channels,
    channelAlerts,
    recentVideos,
    lastCheckedAt: num(raw.lastCheckedAt) ?? null,
    baselineAt: num(raw.baselineAt) ?? null,
    seenAt,
  };
}

/** 확인 화면에 보여 줄 한 줄 요약. */
export function describeBackup(b: Backup): string {
  const when = b.exportedAt && !Number.isNaN(Date.parse(b.exportedAt))
    ? ` · ${new Date(b.exportedAt).toLocaleDateString('ko-KR')} 내보냄`
    : '';
  const uncategorized = b.channels.filter((c) => c.categoryId === null).length;
  return `채널 ${b.channels.length}개 · 분류함 ${b.categories.length}개 · 미분류 ${uncategorized}개${when}`;
}
