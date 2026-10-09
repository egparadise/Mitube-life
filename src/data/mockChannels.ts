import { Channel } from '@/types';

/**
 * 데모용 가짜 구독 목록.
 * 실제 앱에서는 이 자리에 YouTube Data API 의 subscriptions.list 응답이 들어온다.
 * categoryId 는 비워두고(자동 분류 전 상태), 불러올 때 classifyChannels() 로 채운다.
 */
export const MockChannels: Omit<Channel, 'categoryId'>[] = [
  {
    id: 'ch-liveacademy',
    title: '라이브아카데미 Live Academy',
    description: '원어민처럼 말하는 영어 회화와 영어 발음, 문법을 쉽게 알려주는 영어 학습 채널',
    subscriberCount: 1980000,
    isLive: true,
  },
  {
    id: 'ch-oliver',
    title: '올리버쌤',
    description: '미국인 영어 선생님이 알려주는 진짜 미국 영어 표현과 회화, 원어민 발음',
    subscriberCount: 2700000,
  },
  {
    id: 'ch-karpathy',
    title: 'Andrej Karpathy',
    description: 'Deep learning, neural networks, LLM, GPT 모델을 밑바닥부터 설명하는 인공지능 강의',
    subscriberCount: 890000,
  },
  {
    id: 'ch-teddynote',
    title: '테디노트 TeddyNote',
    description: '파이썬 데이터 분석과 머신러닝, 딥러닝, AI 개발 실습을 다루는 코딩 채널',
    subscriberCount: 130000,
  },
  {
    id: 'ch-twominute',
    title: 'Two Minute Papers',
    description: '최신 AI 인공지능 연구 논문을 짧게 소개하는 채널. machine learning research',
    subscriberCount: 1500000,
  },
  {
    id: 'ch-panibottle',
    title: '빠니보틀 Pani Bottle',
    description: '전 세계를 배낭 하나로 누비는 세계여행 브이로그. 해외 여행과 맛집투어',
    subscriberCount: 1600000,
  },
  {
    id: 'ch-kwaktube',
    title: '곽튜브',
    description: '혼자 떠나는 해외 여행 이야기. 낯선 나라 구석구석을 여행하는 트래블 채널',
    subscriberCount: 2100000,
  },
  {
    id: 'ch-chungco',
    title: '충코의 철학',
    description: '니체, 칸트 같은 철학과 인문학을 깊이 있게 사유하는 철학 채널',
    subscriberCount: 320000,
  },
  {
    id: 'ch-culture',
    title: '널 위한 문화예술',
    description: '미술과 예술 작품에 담긴 이야기를 풀어주는 인문 교양 채널',
    subscriberCount: 610000,
  },
  {
    id: 'ch-hwang',
    title: '황현필 한국사',
    description: '재미있게 배우는 한국사와 세계사. 조선과 근현대사 역사 강의',
    subscriberCount: 770000,
  },
  {
    id: 'ch-history',
    title: '역사를 보다',
    description: '여러 나라의 역사와 전쟁, 문명 이야기를 전문가들이 풀어내는 역사 토크',
    subscriberCount: 450000,
  },
  {
    id: 'ch-jiyoon',
    title: '김지윤의 지식Play',
    description: '국제 정치와 외교, 지정학을 알기 쉽게 설명하는 시사 채널',
    subscriberCount: 740000,
    isLive: true,
  },
  {
    id: 'ch-basic',
    title: '베이직교회 조정민',
    description: '성경 말씀과 신앙을 나누는 설교. 기독교 믿음과 복음, 예배 메시지',
    subscriberCount: 410000,
  },
  {
    id: 'ch-cgntv',
    title: 'CGN 생명의삶',
    description: '매일 성경 묵상과 큐티, 교회 예배와 기도를 돕는 기독교 신앙 콘텐츠',
    subscriberCount: 230000,
  },
  {
    id: 'ch-veritasium',
    title: 'Veritasium 베리타시움',
    description: '과학과 호기심을 자극하는 실험과 다양한 이야기를 다루는 교양 채널',
    subscriberCount: 1800000,
  },
];
