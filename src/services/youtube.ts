import { Channel, Video } from '@/types';

const API = 'https://www.googleapis.com/youtube/v3';

type RawChannel = Omit<Channel, 'categoryId'>;

interface SubscriptionItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    resourceId?: { channelId?: string };
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
}

interface SubscriptionPage {
  items?: SubscriptionItem[];
  nextPageToken?: string;
  error?: { message?: string };
}

/**
 * 로그인한 사용자의 구독 채널 전체를 가져온다 (subscriptions.list, mine=true).
 * accessToken 은 youtube.readonly 권한으로 발급받은 OAuth 액세스 토큰.
 */
export async function fetchSubscriptions(accessToken: string): Promise<RawChannel[]> {
  const out: RawChannel[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      mine: 'true',
      maxResults: '50',
      order: 'alphabetical',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${API}/subscriptions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await res.json()) as SubscriptionPage;
    if (!res.ok) {
      throw new Error(data.error?.message ?? `YouTube API 오류 (${res.status})`);
    }

    for (const item of data.items ?? []) {
      const s = item.snippet ?? {};
      const channelId = s.resourceId?.channelId ?? item.id;
      const thumb = s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url;
      out.push({
        id: channelId,
        title: s.title ?? '(이름 없음)',
        description: s.description ?? '',
        thumbnail: thumb,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return out;
}

/** 액세스 토큰이 만료·무효일 때 던진다 → 다시 로그인이 필요하다는 신호. */
export class YouTubeAuthError extends Error {}

/** 하루 API 사용량을 다 썼을 때 던진다. */
export class YouTubeQuotaError extends Error {}

/** API 키가 잘못됐거나 YouTube Data API 사용이 막혀 있을 때 던진다. */
export class YouTubeKeyError extends Error {}

/**
 * 최신 영상 조회 인증: 로그인 토큰(약 1시간) 또는 API 키(공개 영상 조회용, 만료 없음).
 * 업로드 목록은 공개 데이터라 API 키만으로도 읽을 수 있다.
 */
export type YouTubeReadAuth = { accessToken: string } | { apiKey: string };

interface PlaylistItemsPage {
  items?: {
    snippet?: {
      title?: string;
      publishedAt?: string;
      resourceId?: { videoId?: string };
      thumbnails?: Record<string, { url?: string } | undefined>;
    };
    contentDetails?: { videoId?: string; videoPublishedAt?: string };
  }[];
  error?: { message?: string; errors?: { reason?: string }[] };
}

/** 두 ISO 시각 중 더 늦은 것 (없으면 있는 쪽). */
function laterIso(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(b) > Date.parse(a) ? b : a;
}

/** 최신순 비교 — 문자열이 아니라 실제 시각으로 비교한다 (형식이 달라도 순서가 맞게). */
export function byNewest(a: { publishedAt?: string }, b: { publishedAt?: string }): number {
  const ta = Date.parse(a.publishedAt ?? '') || 0;
  const tb = Date.parse(b.publishedAt ?? '') || 0;
  return tb - ta;
}

/** 비공개·삭제된 영상은 업로드 목록에 이런 제목으로 남는다. */
const HIDDEN_TITLES = new Set(['Private video', 'Deleted video']);

/**
 * 채널마다 '업로드 재생목록'의 최신 영상 몇 개(제목·썸네일·게시 시각)를 가져온다.
 * 업로드 재생목록 id 는 채널 id 의 앞 'UC' 를 'UU' 로 바꾼 값이다 (playlistItems.list, 채널당 1 quota).
 * 쇼츠는 'UUSH' 재생목록에서 최신 몇 개를 더 가져와 isShort 로 표시한다 (채널당 1 quota 추가).
 * 반환: { 채널id: [영상, ... 최신순] }. 실패한 채널은 결과에서 빠진다(이전 기록 유지).
 */
export async function fetchRecentVideos(
  auth: YouTubeReadAuth,
  channelIds: string[],
  opts: { perChannel?: number; concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<Record<string, Video[]>> {
  const perChannel = opts.perChannel ?? 6;
  const shortsPerChannel = 3;
  const concurrency = opts.concurrency ?? 8;
  const targets = channelIds.filter((id) => /^UC[\w-]{10,}$/.test(id));
  const out: Record<string, Video[]> = {};
  let next = 0;
  let done = 0;
  let fatal: Error | null = null;
  let lastSkipReason = '';

  async function fetchPlaylist(playlistId: string, max: number) {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: String(max),
    });
    if ('apiKey' in auth) params.set('key', auth.apiKey);
    const res = await fetch(`${API}/playlistItems?${params.toString()}`, {
      headers: 'accessToken' in auth ? { Authorization: `Bearer ${auth.accessToken}` } : {},
    });
    if (res.status === 401) throw new YouTubeAuthError('로그인이 만료되었습니다.');
    if (res.status === 404) return []; // 업로드(또는 쇼츠)가 없는 채널
    const data = (await res.json()) as PlaylistItemsPage;
    if (!res.ok) {
      const reason = data.error?.errors?.[0]?.reason;
      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
        throw new YouTubeQuotaError('오늘 YouTube API 사용량을 다 썼어요. 내일 다시 시도해 주세요.');
      }
      if ('apiKey' in auth && (res.status === 400 || res.status === 403)) {
        // keyInvalid · API_KEY_SERVICE_BLOCKED · 허용 웹사이트(referrer) 불일치 등 — 모든 채널이 같은 이유로 실패한다.
        throw new YouTubeKeyError(`YouTube API 키를 확인해 주세요: ${data.error?.message ?? res.status}`);
      }
      lastSkipReason = `${res.status} ${reason ?? ''} ${data.error?.message ?? ''}`.trim();
      return null; // 이 채널만 건너뛴다
    }
    const videos: Video[] = [];
    for (const it of data.items ?? []) {
      const s = it.snippet ?? {};
      const id = it.contentDetails?.videoId ?? s.resourceId?.videoId;
      // 게시 시각 = '원래 게시 시각'과 '업로드 목록에 올라간 시각' 중 더 늦은 쪽.
      // 비공개로 올렸다가 나중에 공개한 영상·예약 공개·프리미어·라이브 다시보기는 원래 시각이 며칠 전으로 찍혀
      // 최신순에서 아래로 밀려났다. YouTube 구독 피드처럼 '새로 올라온 순서'로 맞춘다.
      const publishedAt = laterIso(it.contentDetails?.videoPublishedAt, s.publishedAt);
      if (!id || !publishedAt || HIDDEN_TITLES.has(s.title ?? '')) continue;
      videos.push({
        id,
        title: s.title ?? '',
        thumbnail: s.thumbnails?.medium?.url ?? s.thumbnails?.default?.url,
        publishedAt,
      });
    }
    return videos;
  }

  async function fetchOne(channelId: string) {
    const videos = await fetchPlaylist('UU' + channelId.slice(2), perChannel);
    if (!videos) return;
    // 쇼츠 재생목록('UUSH' + 채널 id)으로 쇼츠를 가려낸다. 실패해도 일반 영상은 그대로 쓴다.
    const shorts = await fetchPlaylist('UUSH' + channelId.slice(2), shortsPerChannel).catch((e) => {
      if (e instanceof YouTubeAuthError || e instanceof YouTubeQuotaError) throw e;
      return null;
    });
    const merged = new Map(videos.map((v) => [v.id, v]));
    for (const sv of shorts ?? []) merged.set(sv.id, { ...sv, ...merged.get(sv.id), isShort: true });
    out[channelId] = [...merged.values()].sort(byNewest);
  }

  /**
   * 지금 라이브 중인 영상을 표시한다 (videos.list 50개당 1 할당량).
   * 라이브 중이면 isLive, 게시 시각은 방송 시작 시각. 아직 시작 안 한 예약 방송은 목록에서 뺀다.
   */
  async function markLive(result: Record<string, Video[]>) {
    const ids = Object.values(result).flatMap((l) => l.filter((v) => !v.isShort).map((v) => v.id));
    const info = new Map<string, { live: string; start?: string }>();
    for (let i = 0; i < ids.length; i += 50) {
      const params = new URLSearchParams({ part: 'snippet,liveStreamingDetails', id: ids.slice(i, i + 50).join(',') });
      if ('apiKey' in auth) params.set('key', auth.apiKey);
      try {
        const res = await fetch(`${API}/videos?${params.toString()}`, {
          headers: 'accessToken' in auth ? { Authorization: `Bearer ${auth.accessToken}` } : {},
        });
        if (!res.ok) return; // 라이브 표시는 덤 — 실패해도 영상 목록은 그대로 쓴다.
        const data = (await res.json()) as {
          items?: {
            id: string;
            snippet?: { liveBroadcastContent?: string };
            liveStreamingDetails?: { actualStartTime?: string };
          }[];
        };
        for (const it of data.items ?? []) {
          info.set(it.id, {
            live: it.snippet?.liveBroadcastContent ?? 'none',
            start: it.liveStreamingDetails?.actualStartTime,
          });
        }
      } catch {
        return;
      }
    }
    for (const [ch, list] of Object.entries(result)) {
      result[ch] = list
        .filter((v) => info.get(v.id)?.live !== 'upcoming')
        .map((v) => {
          const x = info.get(v.id);
          if (x?.live !== 'live') return v.isLive ? { ...v, isLive: false } : v;
          return { ...v, isLive: true, publishedAt: x.start ?? v.publishedAt };
        })
        .sort(byNewest);
    }
  }

  async function worker() {
    while (!fatal && next < targets.length) {
      const id = targets[next++];
      try {
        await fetchOne(id);
      } catch (e) {
        if (e instanceof YouTubeAuthError || e instanceof YouTubeQuotaError || e instanceof YouTubeKeyError) {
          fatal = e;
        }
        // 네트워크 오류 등 개별 실패는 건너뛴다.
        lastSkipReason = e instanceof Error ? e.message : String(e);
      }
      done++;
      opts.onProgress?.(done, targets.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));
  if (!fatal) await markLive(out);
  if (fatal) {
    // 도중에 멈춰도 그때까지 받은 채널은 쓰도록 함께 넘긴다.
    (fatal as Error & { partial?: Record<string, Video[]> }).partial = out;
    throw fatal;
  }
  if (targets.length > 0 && Object.keys(out).length === 0) {
    throw new Error(`영상 정보를 하나도 받지 못했어요 (${lastSkipReason || '원인 불명'})`);
  }
  return out;
}

/** 영상을 유튜브에서 여는 주소. */
export function videoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/** 채널을 유튜브에서 여는 주소. 실제 채널 id 가 아니면(데모) 이름으로 검색한다. */
export function channelUrl(channel: { id: string; title: string }): string {
  return /^UC[\w-]{10,}$/.test(channel.id)
    ? `https://www.youtube.com/channel/${channel.id}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(channel.title)}`;
}
