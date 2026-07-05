// 캐릭터 필드 정의 — 폼과 카드가 공유합니다.
export const FIELDS = [
  { key: 'name', label: '이름', type: 'text', placeholder: '캐릭터 이름' },
  { key: 'alias', label: '별칭', type: 'text', placeholder: '닉네임 · 이명' },
  { key: 'age', label: '나이', type: 'text', placeholder: '예: 19, 불명' },
  { key: 'gender', label: '성별', type: 'text', placeholder: '성별' },
  { key: 'height', label: '키', type: 'text', placeholder: '예: 172' },
  { key: 'birthday', label: '생일', type: 'birthday' },
  { key: 'tagline', label: '한줄소개', type: 'text', placeholder: '한 문장으로 표현한다면', full: true },
  { key: 'appearance', label: '외관설명', type: 'textarea', placeholder: '머리/눈 색, 체형, 복장 등' },
  { key: 'personality', label: '성격', type: 'textarea', placeholder: '성격, 말투, 습관 등' },
  { key: 'tags', label: '태그', type: 'text', placeholder: '쉼표로 구분 (예: 마법사, 츤데레)', full: true },
]

let counter = 0
function uid() {
  // crypto.randomUUID 우선, 미지원 환경은 시간+카운터 폴백
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  counter += 1
  return `c_${Date.now().toString(36)}_${counter}`
}

export function createCharacter(overrides = {}) {
  const base = {
    id: uid(),
    name: '',
    alias: '',
    age: '',
    gender: '',
    height: '',
    birthday: '',
    tagline: '',
    appearance: '',
    personality: '',
    background: '',
    tags: '',
    mainColor: '', // 대표색 (단일 hex)
    keywords: [], // 성격 키워드 (문자열 배열)
    colors: [], // [{ id, hex, name }]
    settings: [], // [{ id, category, content }]
    timeline: [], // [{ id, period, title, content }]
    background: '', // (구버전 호환) settings 로 마이그레이션됨
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const merged = { ...base, ...overrides, id: overrides.id || base.id }

  // 대표색 / 키워드 정규화 (불러온 데이터 방어)
  merged.mainColor = typeof merged.mainColor === 'string' ? merged.mainColor : ''
  merged.keywords = Array.isArray(merged.keywords)
    ? merged.keywords.map((k) => (typeof k === 'string' ? k.trim() : '')).filter(Boolean)
    : []

  // colors 정규화 (불러온 데이터 방어)
  merged.colors = Array.isArray(merged.colors)
    ? merged.colors.map((c) => createColor(c)).filter((c) => c.hex)
    : []

  // settings 정규화
  if (Array.isArray(overrides.settings)) {
    // 이미 카테고리 데이터가 있으면 그대로 사용 (빈 배열=전부 삭제한 상태도 존중)
    merged.settings = overrides.settings.map((s) => createSetting(s)).filter((s) => s.category)
  } else {
    // 신규/구버전 데이터: 기본 카테고리 시드 + 구버전 background 보존
    const seeded = DEFAULT_SETTING_CATEGORIES.map((category) => createSetting({ category }))
    if (typeof overrides.background === 'string' && overrides.background.trim()) {
      seeded.push(createSetting({ category: '설정/배경', content: overrides.background }))
    }
    merged.settings = seeded
  }

  // timeline 정규화
  merged.timeline = Array.isArray(merged.timeline)
    ? merged.timeline.map((t) => createTimelineEvent(t)).filter((t) => t.period || t.title || t.content)
    : []

  return merged
}

export function createTimelineEvent(overrides = {}) {
  return {
    id: overrides.id || uid(),
    period: typeof overrides.period === 'string' ? overrides.period : '',
    title: typeof overrides.title === 'string' ? overrides.title : '',
    content: typeof overrides.content === 'string' ? overrides.content : '',
  }
}

export const DEFAULT_SETTING_CATEGORIES = ['좋아하는 것', '싫어하는 것', '취미', '기타']

export function createSetting(overrides = {}) {
  return {
    id: overrides.id || uid(),
    category: typeof overrides.category === 'string' ? overrides.category.trim() : '',
    content: typeof overrides.content === 'string' ? overrides.content : '',
  }
}

export function createColor(overrides = {}) {
  return {
    id: overrides.id || uid(),
    hex: typeof overrides.hex === 'string' ? overrides.hex : '#b9a3ff',
    name: typeof overrides.name === 'string' ? overrides.name : '',
  }
}

// 태그 문자열 -> 배열
export function parseTags(tags) {
  if (!tags) return []
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

// ── 생일: 월/일 ↔ 문자열 ──
// 저장 포맷: "3월 14일" / "3월 ??" / "?? 14일" / "생일 불명"
// 인식 불가한 기존 자유 텍스트는 legacy 로 보존합니다.
const UNKNOWN_BIRTHDAY = '생일 불명'

function clampNum(raw, min, max) {
  const n = parseInt(raw, 10)
  if (Number.isNaN(n) || n < min || n > max) return ''
  return String(n)
}

export function parseBirthday(value) {
  const str = (value ?? '').trim()
  if (!str || str === UNKNOWN_BIRTHDAY || str === '??' || str === '미정' || str === '불명') {
    return { month: '', day: '', legacy: null }
  }
  const monthMatch = str.match(/(\d{1,2})\s*월/)
  const dayMatch = str.match(/(\d{1,2})\s*일/)
  if (monthMatch || dayMatch) {
    // 인식 패턴(숫자+월/일, ??, 공백)을 제거하고 남는 텍스트가 있으면 legacy
    const leftover = str
      .replace(/(\d{1,2})\s*월/g, '')
      .replace(/(\d{1,2})\s*일/g, '')
      .replace(/\?\?/g, '')
      .replace(/[월일\s]/g, '')
      .trim()
    if (leftover) return { month: '', day: '', legacy: str }
    return {
      month: monthMatch ? clampNum(monthMatch[1], 1, 12) : '',
      day: dayMatch ? clampNum(dayMatch[1], 1, 31) : '',
      legacy: null,
    }
  }
  // ?? 기호/공백만 있으면 불명, 그 외엔 보존할 자유 텍스트
  if (/^[?？\s]*$/.test(str)) return { month: '', day: '', legacy: null }
  return { month: '', day: '', legacy: str }
}

// 저장용 문자열
export function formatBirthday(month, day) {
  if (!month && !day) return UNKNOWN_BIRTHDAY
  const m = month ? `${month}월` : '??'
  const d = day ? `${day}일` : '??'
  return `${m} ${d}`
}

// 카드 표시용 ("3월 ??" / "??" / 보존된 기존 텍스트)
export function formatBirthdayDisplay(value) {
  const { month, day, legacy } = parseBirthday(value)
  if (legacy) return legacy
  if (!month && !day) return '??'
  const m = month ? `${month}월` : '??'
  const d = day ? `${day}일` : '??'
  return `${m} ${d}`
}

// 불러온 JSON을 안전하게 정규화
export function normalizeImport(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.characters) ? data.characters : null
  if (!list) return null
  return list.map((c) => createCharacter({ ...c }))
}
