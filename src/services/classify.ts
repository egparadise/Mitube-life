import { Category, Channel } from '@/types';

/**
 * 채널을 카테고리에 자동 배정한다.
 *
 * [현재] 규칙 기반: 카테고리의 keywords 가 채널 제목/소개글에 몇 번 등장하는지 세어
 *        가장 점수가 높은 카테고리로 배정한다. 매칭이 전혀 없으면 null(미분류).
 *
 * [추후] 이 함수만 교체하면 된다. Phase 3에서 백엔드의 Claude API 를 호출해
 *        "이 채널은 어떤 카테고리에 가장 가까운가?" 를 물어보는 AI 분류로 바꿀 수 있다.
 *        시그니처(채널 + 카테고리 목록 -> categoryId)는 그대로 유지한다.
 */
export function classifyChannel(
  channel: Pick<Channel, 'title' | 'description'>,
  categories: Category[],
): string | null {
  const haystack = `${channel.title} ${channel.description}`.toLowerCase();

  let bestId: string | null = null;
  let bestScore = 0;

  for (const category of categories) {
    const keywords = category.keywords ?? [];
    // 키워드가 없는(사용자가 직접 만든) 카테고리는 이름이 소개글에 들어있으면 약하게 매칭.
    const terms = keywords.length > 0 ? keywords : [category.name];

    let score = 0;
    for (const term of terms) {
      const t = term.toLowerCase().trim();
      if (t.length === 0) continue;
      if (haystack.includes(t)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = category.id;
    }
  }

  return bestId;
}

/** 채널 목록 전체에 자동 분류를 적용해 categoryId 를 채운 새 배열을 반환. */
export function classifyChannels(
  channels: Omit<Channel, 'categoryId'>[],
  categories: Category[],
): Channel[] {
  return channels.map((ch) => ({
    ...ch,
    categoryId: classifyChannel(ch, categories),
  }));
}
