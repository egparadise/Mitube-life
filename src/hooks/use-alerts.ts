import { useEffect, useMemo, useState } from 'react';

import { ALERTS_RUN_IN_APP, AlertEntry, showAlertNow, syncAlertSchedule } from '@/services/alerts';
import { useStore } from '@/store/store';
import { lastOccurrence } from '@/utils/alert-time';

/** 페이지를 이보다 늦게 열면 지난 알림은 조용히 넘긴다. */
const GRACE_MS = 60 * 60 * 1000;
const TICK_MS = 30 * 1000;

function buildEntries(
  channelAlerts: ReturnType<typeof useStore.getState>['channelAlerts'],
  channels: ReturnType<typeof useStore.getState>['channels'],
): AlertEntry[] {
  const titles = new Map(channels.map((c) => [c.id, c.title]));
  return Object.entries(channelAlerts)
    .filter(([id]) => titles.has(id))
    .map(([id, alert]) => ({ channelId: id, title: titles.get(id)!, alert }));
}

/** 지금 저장된 설정으로 OS 예약을 다시 건다 (휴대폰에서 권한을 막 받았을 때 등). */
export function syncAlertsFromStore(): Promise<void> {
  const { channelAlerts, channels } = useStore.getState();
  return syncAlertSchedule(buildEntries(channelAlerts, channels));
}

/** 휴대폰: 알림 설정(또는 채널 이름)이 바뀔 때마다 OS 예약을 다시 맞춘다. */
export function useAlertScheduleSync() {
  const channelAlerts = useStore((s) => s.channelAlerts);
  const channels = useStore((s) => s.channels);

  // 채널 이동처럼 알림과 무관한 변경에는 다시 예약하지 않도록, 알림이 걸린 채널의 이름만 본다.
  const entries = useMemo(() => buildEntries(channelAlerts, channels), [channelAlerts, channels]);
  const signature = JSON.stringify(entries);

  useEffect(() => {
    if (ALERTS_RUN_IN_APP) return;
    syncAlertSchedule(entries).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

export interface DueAlert {
  channelId: string;
  title: string;
}

/**
 * 웹: 페이지가 열려 있는 동안 30초마다 '볼 시간'이 됐는지 확인한다.
 * 되면 브라우저 알림(권한이 있을 때)을 띄우고, 화면 배너로 보여 줄 목록에 넣는다.
 */
export function useInAppAlerts() {
  const [due, setDue] = useState<DueAlert[]>([]);

  useEffect(() => {
    if (!ALERTS_RUN_IN_APP) return;
    const tick = () => {
      const { channelAlerts, alertFiredAt, channels, markAlertFired, adminSettings } = useStore.getState();
      if (!adminSettings.notifyWatchTime) return; // 관리자 설정 → 알림 → '볼 시간 알림' 꺼짐
      const now = Date.now();
      const titles = new Map(channels.map((c) => [c.id, c.title]));
      const fired: DueAlert[] = [];
      for (const [id, alert] of Object.entries(channelAlerts)) {
        const title = titles.get(id);
        if (!title) continue;
        const occurred = lastOccurrence(alert, now);
        if (occurred <= (alertFiredAt[id] ?? 0)) continue; // 이미 알린 회차
        markAlertFired(id, now);
        if (now - occurred > GRACE_MS) continue; // 너무 지난 회차는 조용히 넘긴다
        fired.push({ channelId: id, title });
        showAlertNow(`📺 ${title}`, '볼 시간이에요! 새 영상을 확인해 보세요.');
      }
      if (fired.length > 0) {
        setDue((prev) => [...prev.filter((p) => !fired.some((f) => f.channelId === p.channelId)), ...fired]);
      }
    };
    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const dismiss = (channelId: string) => setDue((d) => d.filter((x) => x.channelId !== channelId));
  return { due, dismiss };
}
