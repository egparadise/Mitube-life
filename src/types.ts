/**
 * 앱 전반에서 쓰는 데이터 모델.
 *
 * - Category: 사용자가 직접 만드는 분류함 (예: 영어 학습, 인공지능 기술 ...)
 * - Channel:  YouTube 구독 채널. categoryId 로 어느 분류함에 속하는지 결정.
 *             categoryId === null 이면 "미분류".
 */

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** 같은 단계(최상위끼리, 또는 같은 상위 아래 하위끼리)에서의 순서. */
  order: number;
  /** 하위 분류함이면 상위 분류함 id. 없으면(undefined/null) 최상위. 하위는 한 단계만 둔다. */
  parentId?: string | null;
  /** 자동 분류에 쓰는 키워드. 사용자가 만든 카테고리는 보통 비어 있음. */
  keywords?: string[];
}

export type AlertFreq = 'daily' | 'weekly' | 'monthly';

/** 채널별 '볼 시간' 알림 (24시간제). */
export interface ChannelAlert {
  freq: AlertFreq;
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
  /** 매주일 때 요일: 1=일 … 7=토 (expo-notifications 와 같은 규칙). weekdays 의 첫 값 (예전 버전 호환). */
  weekday: number;
  /** 매주일 때 고른 요일들 (여러 개). 없으면 weekday 하나. */
  weekdays?: number[];
  /** 매달일 때 날짜: 1-28 (모든 달에 있는 날짜만). */
  monthDay: number;
  /** 매달일 때 고른 날짜들 (여러 개). 없으면 monthDay 하나. */
  monthDays?: number[];
}

/** 기록 · 나중에 볼 동영상 · 재생목록에 담는 영상 하나. */
export interface SavedVideo {
  id: string;
  title: string;
  thumbnail?: string;
  channelId: string;
  channelTitle: string;
  isShort?: boolean;
  /** 담은(본) 시각 (ms). */
  at: number;
}

/** 사용자가 만든 재생목록. items 는 담은 순서대로. */
export interface Playlist {
  id: string;
  name: string;
  items: SavedVideo[];
  createdAt: number;
}

/** 채널에 올라온 영상 하나 (최신 영상 줄에 표시). */
export interface Video {
  id: string;
  title: string;
  thumbnail?: string;
  /** 게시 시각 (ISO 문자열). */
  publishedAt: string;
  /** 쇼츠(세로형 짧은 영상)인지. */
  isShort?: boolean;
}

export interface Channel {
  id: string;
  title: string;
  /** 채널 소개글 — 자동 분류와 요약에 사용. */
  description: string;
  /** 썸네일 URL. 없으면 이니셜 아바타로 대체. */
  thumbnail?: string;
  /** 구독자 수(표시용, 선택). */
  subscriberCount?: number;
  /** 속한 분류함. null = 미분류. */
  categoryId: string | null;
}

/** 관리자 페이지에서 바꾸는 앱 환경설정 (이 기기에 저장). */
export interface AdminSettings {
  // 시간 관리
  dailyLimitOn: boolean;
  dailyLimitMin: number;
  shortsLimitOn: boolean;
  shortsLimitMin: number;
  // 알림
  desktopNotify: boolean;
  notifyNewVideos: boolean;
  notifyWatchTime: boolean;
  notifyTimeLimit: boolean;
  notifyNews: boolean;
  // 재생 및 실적
  language: 'ko' | 'en';
  openInNewTab: boolean;
  shortsInPlayer: boolean;
  // 오프라인 저장 (데이터 절약)
  thumbQuality: 'high' | 'medium' | 'low';
  // 공개 범위
  pauseHistory: boolean;
  shareIncludesChannel: boolean;
  cloudSyncOn: boolean;
  // 연결된 앱
  apps: Record<ConnectedAppId, { connected: boolean; values: Record<string, string> }>;
  // 고급 설정 · AI (Ollama)
  aiServer: string;
  aiModel: string;
  aiEnabled: boolean;
}

export type ConnectedAppId = 'notion' | 'kakao' | 'instagram' | 'facebook' | 'x';
