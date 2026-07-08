// 페어틀 템플릿 레지스트리 — 항목만 추가하면 선택 UI/에디터에 자동 반영됨
export const TEMPLATES = [
  { id: 'single-basic', category: '1인용', name: '기본', width: 800, height: 1200 },
  { id: 'single-charfile', category: '1인용', name: '캐릭터 파일', width: 1400, height: 900 },
  { id: 'single-id', category: '1인용', name: 'ID 카드', width: 1000, height: 640 },
  { id: 'single-collectible', category: '1인용', name: '수집 카드', width: 760, height: 1060 },
  { id: 'single-gacha', category: '1인용', name: '가챠 화면', width: 1280, height: 800 },
  { id: 'single-receipt', category: '1인용', name: '영수증', width: 720, height: 1180 },
  { id: 'single-inventory', category: '1인용', name: '인벤토리', width: 1040, height: 780 },
  { id: 'single-themesong', category: '1인용', name: '테마곡', width: 820, height: 1120 },
  { id: 'double-basic', category: '2인용', name: '기본', width: 800, height: 1200 },
  { id: 'double-appearance', category: '2인용', name: '외관카드', width: 1400, height: 900 },
  { id: 'double-reference', category: '2인용', name: '레퍼런스 시트', width: 1600, height: 1000 },
  { id: 'double-full', category: '2인용', name: '풀 캐릭터 시트', width: 1200, height: 1800 },
  { id: 'calendar', category: '기타', name: '캘린더', width: 1080, height: 1920 },
]

// 캘린더 비율별 캔버스 크기
export const CALENDAR_RATIOS = {
  mobile: { w: 1080, h: 1920, label: '휴대폰 9:16' },
  tablet: { w: 1640, h: 2360, label: '태블릿 3:4' },
  desktop: { w: 2560, h: 1440, label: '데스크탑 16:9' },
}

// 카테고리 순서 (TEMPLATES 등장 순서 유지)
export const CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

// 구버전 데이터(type) → template 마이그레이션
export function templateFromType(type) {
  return type === '2p' ? 'double-basic' : 'single-basic'
}
