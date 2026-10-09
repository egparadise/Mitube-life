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
      return null; // 이 채널만 건너뛴다
    }
    const videos: Video[] = [];
    for (const it of data.items ?? []) {
      const s = it.snippet ?? {};
      const id = it.contentDetails?.videoId ?? s.resourceId?.videoId;
      // 예약 공개(프리미어)는 videoPublishedAt 이 없으니 목록에 올라간 시각으로 대신한다.
      const publishedAt = it.contentDetails?.videoPublishedAt ?? s.publishedAt;
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
    out[channelId] = [...merged.values()].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
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
      }
      done++;
      opts.onProgress?.(done, targets.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, targets.length) }, worker));
  if (fatal) throw fatal;
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
