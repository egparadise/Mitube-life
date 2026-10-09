import { Category } from '@/types';

/** 카테고리에 쓸 수 있는 색상 팔레트. 새 카테고리 추가 시 순서대로 배정. */
export const CategoryColors = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
  // 사용자 시안(폴더 탭) 색상
  '#EDD035', // sunflower
  '#BEFF6E', // light lime
  '#7ED957', // leaf
  '#1A00A8', // deep indigo
  '#B0258A', // magenta
] as const;

/** 카테고리 추가 모달에서 고를 수 있는 이모지 후보. */
export const CategoryEmojis = [
  '📚', '🤖', '✈️', '🎨', '🏛️', '🗳️', '🙏', '🎬', '🎵', '💪',
  '🍳', '💰', '⚽', '🔬', '🌍', '📰', '🧠', '❤️', '🌱', '⭐',
];

/**
 * 처음 앱을 켰을 때 기본으로 들어있는 분류함.
 * 사용자가 예시로 든 카테고리들을 그대로 채워 넣었다.
 * keywords 는 데모용 자동 분류(규칙 기반)에서 사용한다.
 */
export const DefaultCategories: Category[] = [
  {
    id: 'cat-english',
    name: '영어 학습',
    emoji: '📚',
    color: CategoryColors[3],
    order: 0,
    keywords: ['영어', 'english', '회화', '문법', '원어민', '리스닝', 'speaking', '발음', '단어', 'toeic', '영작'],
  },
  {
    id: 'cat-ai',
    name: '인공지능 기술',
    emoji: '🤖',
    color: CategoryColors[4],
    order: 1,
    keywords: ['ai', '인공지능', '머신러닝', '딥러닝', 'gpt', 'llm', '데이터', '코딩', '개발', 'neural', '파이썬', 'chatgpt', '알고리즘'],
  },
  {
    id: 'cat-travel',
    name: '여행',
    emoji: '✈️',
    color: CategoryColors[2],
    order: 2,
    keywords: ['여행', '세계여행', '배낭', '트래블', 'travel', '캠핑', '맛집투어', '해외', '백패킹', '관광'],
  },
  {
    id: 'cat-humanities',
    name: '인문',
    emoji: '🎨',
    color: CategoryColors[7],
    order: 3,
    keywords: ['철학', '인문', '예술', '문학', '심리', '사유', '고전', '사상', '미술', '책'],
  },
  {
    id: 'cat-history',
    name: '역사',
    emoji: '🏛️',
    color: CategoryColors[1],
    order: 4,
    keywords: ['역사', '세계사', '한국사', '조선', '전쟁', '문명', '왕조', 'history', '유물'],
  },
  {
    id: 'cat-politics',
    name: '정치',
    emoji: '🗳️',
    color: CategoryColors[0],
    order: 5,
    keywords: ['정치', '국제정세', '선거', '외교', '시사', '지정학', '국회', '정세'],
  },
  {
    id: 'cat-faith',
    name: '신앙',
    emoji: '🙏',
    color: CategoryColors[5],
    order: 6,
    keywords: ['신앙', '기독교', '교회', '성경', '예배', '말씀', '목사', '설교', '믿음', '하나님', '기도', '복음'],
  },
];
