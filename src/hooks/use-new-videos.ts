import { useCallback, useMemo, useRef, useState } from 'react';

import { getSampleVideosForChannel } from '@/data/sampleVideos';
import { fetchRecentVideos, YouTubeAuthError, YouTubeReadAuth } from '@/services/youtube';
import { useStore } from '@/store/store';
import { Channel, Video } from '@/types';

/** 토큰이 이 시간 안에 만료되면 이미 만료된 것으로 본다. */
const TOKEN_MARGIN_MS = 60_000;

export function isTokenUsable(token: string | null, expiresAt: number | null): boolean {
  return !!token && !!expiresAt && expiresAt - Date.now() > TOKEN_MARGIN_MS;
}

/** 최신 영상을 읽을 수단: API 키가 있으면 키(만료 없음), 없으면 아직 살아 있는 로그인 토큰. */
export function readAuthFromStore(): YouTubeReadAuth | null {
  const { youtubeApiKey, accessToken, tokenExpiresAt } = useStore.getState();
  if (youtubeApiKey) return { apiKey: youtubeApiKey };
  if (isTokenUsable(accessToken, tokenExpiresAt)) return { accessToken: accessToken! };
  return null;
}

/** 지금 보고 있는 탭을 열기 직전의 '본 시각'. 그 탭의 채널 배지는 이 기준으로 계속 보여 준다. */
export interface ViewSince {
  key: string;
  since: number;
}

/**
 * 이 탭에서 '새 영상'을 가르는 기준 시각.
 * 지금 보고 있는 탭은 열기 직전 기준, 나머지는 저장된 '본 시각'(처음이면 첫 확인 24시간 전).
 * 아직 한 번도 확인하지 않았으면 Infinity → 새 영상 없음.
 */
export function shownSinceFor(
  key: string,
  viewSince: ViewSince | null,
  seenAt: Record<string, number>,
  baselineAt: number | null,
): number {
  if (baselineAt == null) return Infinity;
  if (viewSince && viewSince.key === key) return viewSince.since;
  return Math.max(seenAt[key] ?? 0, baselineAt);
}

/**
 * 탭별·채널별 '새 영상' 수.
 * - byTab: 저장된 '본 시각' 기준 → 탭을 열면 바로 0 이 된다 (⏰ 표시줄용).
 * - byChannel: 지금 보는 탭은 열기 직전 기준 → 탭을 열어도 어느 채널이 새 영상인지 계속 보인다.
 */
export function useNewVideoCounts(
  channels: Channel[],
  tabKeyOf: (ch: Channel) => string,
  viewSince: ViewSince | null,
) {
  const recentVideos = useStore((s) => s.recentVideos);
  const seenAt = useStore((s) => s.seenAt);
  const baselineAt = useStore((s) => s.baselineAt);

  return useMemo(() => {
    const byChannel = new Map<string, number>();
    const byTab = new Map<string, number>();
    if (baselineAt == null) return { byChannel, byTab };
    for (const ch of channels) {
      const videos = recentVideos[ch.id];
      if (!videos || videos.length === 0) continue;
      const key = tabKeyOf(ch);
      const storedSince = shownSinceFor(key, null, seenAt, baselineAt);
      const shownSince = shownSinceFor(key, viewSince, seenAt, baselineAt);
      let stored = 0;
      let shown = 0;
      for (const v of videos) {
        const ms = Date.parse(v.publishedAt);
        if (ms > storedSince) stored++;
        if (ms > shownSince) shown++;
      }
      if (shown > 0) byChannel.set(ch.id, shown);
      if (stored > 0) byTab.set(key, (byTab.get(key) ?? 0) + stored);
    }
    return { byChannel, byTab };
  }, [channels, recentVideos, seenAt, baselineAt, tabKeyOf, viewSince]);
}

export type CheckState = 'idle' | 'checking' | 'needs-login' | 'error';

/** 구독 채널들의 최신 영상을 가져와 저장한다. 토큰이 없거나 만료되면 'needs-login'. */
export function useNewVideoCheck() {
  const [state, setState] = useState<CheckState>('idle');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState('');
  const running = useRef(false);

  const check = useCallback(async () => {
    if (running.current) return;
    const { channels, saveRecentVideos, recentVideos: existingVideos } = useStore.getState();
    const auth = readAuthFromStore();

    running.current = true;
    setState('checking');
    setMessage('');
    setProgress({ done: 0, total: channels.length });
    try {
      if (auth) {
        const videos = await fetchRecentVideos(auth, channels.map((c) => c.id), {
          // 진행 표시는 10개 단위로만 갱신해 불필요한 다시 그리기를 줄인다.
          onProgress: (done, total) => {
            if (done % 10 === 0 || done === total) setProgress({ done, total });
          },
        });
        saveRecentVideos(videos, Date.now());
      } else {
        // YouTube API 로그인 전이라도 샘플 데이터로 최신 영상 확인 및 알람 배지 계산
        const videos: Record<string, Video[]> = { ...existingVideos };
        for (const ch of channels) {
          if (!videos[ch.id] || videos[ch.id].length === 0) {
            videos[ch.id] = getSampleVideosForChannel(ch.id);
          }
        }
        saveRecentVideos(videos, Date.now());
      }
      setState('idle');
    } catch (e) {
      if (e instanceof YouTubeAuthError) {
        setState('needs-login');
      } else {
        setState('error');
        setMessage(e instanceof Error ? e.message : String(e));
      }
    } finally {
      running.current = false;
      setProgress(null);
    }
  }, []);

  return { state, progress, message, check };
}
