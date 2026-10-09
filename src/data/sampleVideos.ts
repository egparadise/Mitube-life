import { Video } from '@/types';

/**
 * 데모 채널별 기본 샘플 영상 목록.
 * YouTube API 가 아직 연동되지 않은 상태에서도 컴퓨터와 스마트폰 모두에서
 * 최신 영상 썸네일과 제목이 풍부하게 보일 수 있도록 제공합니다.
 */
export const SampleVideosByChannel: Record<string, Video[]> = {
  'ch-liveacademy': [
    {
      id: 'vid-live-1',
      title: '미국 원어민들이 일상에서 매일 쓰는 핵심 회화 표현 BEST 10',
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-live-2',
      title: '자연스럽게 들리는 영어 억양과 발음 연결의 비밀',
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-oliver': [
    {
      id: 'vid-oliver-1',
      title: '미국 마트에서 한국인들이 가장 많이 실수하는 단어들',
      thumbnail: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-oliver-2',
      title: '텍사스 시골 동네에서 체리가 태어나고 달라진 일상 브이로그',
      thumbnail: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-karpathy': [
    {
      id: 'vid-ai-1',
      title: 'Claude 3.7 & 차세대 AI 에이전트 실전 코딩과 개발 워크플로우 완벽 가이드',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-karpathy-2',
      title: 'Let\'s reproduce GPT-2 (124M) in PyTorch from Scratch',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-teddynote': [
    {
      id: 'vid-teddy-1',
      title: 'LangChain & LangGraph 로 만드는 나만의 실무 AI 비서',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-teddy-2',
      title: '파이썬 데이터 분석 30분 만에 끝내는 판다스 핵심 꿀팁',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-twominute': [
    {
      id: 'vid-two-1',
      title: 'OpenAI의 최신 추론 모델이 인간을 뛰어넘은 순간! What a Time to be Alive',
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-two-2',
      title: '물리 엔진을 실시간으로 렌더링하는 차세대 신경망 그래픽스',
      thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-panibottle': [
    {
      id: 'vid-travel-1',
      title: '1인 30만원 럭셔리 스파 찜질방은 과연 돈값을 할까? 솔직 후기',
      thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
    },
    {
      id: 'vid-pani-2',
      title: '인도 북부 히말라야 산골 마을에서 먹은 상상 이상의 길거리 음식',
      thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-kwaktube': [
    {
      id: 'vid-kwak-1',
      title: '우즈베키스탄 기차 24시간 타고 타슈켄트로 가는 길 (feat. 빵 파티)',
      thumbnail: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-kwak-2',
      title: '러시아 시베리아 횡단열차 3등칸의 추억과 현지인 친구들',
      thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-chungco': [
    {
      id: 'vid-chung-1',
      title: '니체가 말한 "위버멘쉬"가 현대인에게 주는 진짜 위로',
      thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-chung-2',
      title: '불안과 외로움을 마주할 때 칸트의 철학이 주는 명쾌한 답',
      thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-culture': [
    {
      id: 'vid-culture-1',
      title: '고흐가 별이 빛나는 밤을 그릴 때 마음속에 품었던 생각',
      thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-culture-2',
      title: '클림트의 키스는 왜 100년이 지난 지금도 세계에서 가장 비싼 그림일까?',
      thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 70 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-hwang': [
    {
      id: 'vid-hwang-1',
      title: '조선 건국 비하인드: 이성계와 정도전이 꿈꿨던 진짜 나라는?',
      thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-hwang-2',
      title: '임진왜란 명량해전, 12척으로 133척을 물리친 이순신의 전술',
      thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-history': [
    {
      id: 'vid-history-1',
      title: '로마 제국의 찬란한 번영 뒤에 가려졌던 충격적인 진실과 권력 암투',
      thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-history-2',
      title: '1차 세계대전 사라예보 사건의 한 발의 총성 그날의 전말',
      thumbnail: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-jiyoon': [
    {
      id: 'vid-jiyoon-1',
      title: '미국 대선 이후 요동치는 세계 경제와 동아시아 안보 지형 분석',
      thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'vid-jiyoon-2',
      title: '중동과 유럽, 2026년 세계 지정학에서 가장 주목해야 할 핵심 변수',
      thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-basic': [
    {
      id: 'vid-basic-1',
      title: '매일 아침 마음을 지키는 10분의 기도와 묵상',
      thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-basic-2',
      title: '인생의 고난과 폭풍 속에서 평안을 찾는 성경적 지혜',
      thumbnail: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-cgntv': [
    {
      id: 'vid-cgn-1',
      title: '오늘의 생명의 삶 큐티: 말씀 안에서 발견하는 새로운 소망',
      thumbnail: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
  ],
  'ch-veritasium': [
    {
      id: 'vid-veri-1',
      title: '빛의 속도를 편도로 측정하는 것이 불가능한 놀라운 물리적 이유',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
    },
    {
      id: 'vid-veri-2',
      title: '가장 위험한 화학 반응 TOP 5: 실험실에서 절대 따라 하지 마세요',
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 55 * 3600 * 1000).toISOString(),
    },
  ],
};

/** 특정 채널 id 에 해당하는 샘플 영상을 가져오거나, 없으면 기본 프리뷰 영상을 반환 */
export function getSampleVideosForChannel(channelId: string, channelTitle?: string): Video[] {
  if (SampleVideosByChannel[channelId]) {
    return SampleVideosByChannel[channelId];
  }
  // 기본 생성 프리뷰 (임의 채널이라도 썸네일이 반드시 보이도록)
  const title = channelTitle || '최신 업로드 영상';
  return [
    {
      id: `sample-${channelId}-1`,
      title: `${title} - 새로운 영상이 업로드되었습니다`,
      thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80',
      publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
  ];
}
