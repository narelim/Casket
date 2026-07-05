// 페어틀(캐릭터 소개 카드) 데이터 · 프리셋 저장 유틸
const FAIRTL_KEY = 'casket.fairtl.v1'
const PRESET_KEY = 'casket.fairtl.presets'

let counter = 0
function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  counter += 1
  return `f_${Date.now().toString(36)}_${counter}`
}

function readArray(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeArray(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* 용량 초과 등은 조용히 무시 */
  }
}

// ── 페어틀 ──
// 이미지 transform: x,y = 슬롯 크기 대비 비율(translate), scale = 배율
export function defaultTransform() {
  return { x: 0, y: 0, scale: 1 }
}
function tf(v) {
  if (!v || typeof v !== 'object') return defaultTransform()
  return {
    x: Number(v.x) || 0,
    y: Number(v.y) || 0,
    scale: Number(v.scale) > 0 ? Number(v.scale) : 1,
  }
}

// 슬롯/카드 공통 transform CSS (비율 기반 → 어떤 크기에서도 동일하게 재현)
export function fairtlTransform(t) {
  const { x, y, scale } = tf(t)
  return `translate(${x * 100}%, ${y * 100}%) scale(${scale})`
}

export function createFairtl(overrides = {}) {
  const now = Date.now()
  const str = (v) => (typeof v === 'string' ? v : '')
  const NOTE = ['grid', 'dot', 'line', 'plain']
  return {
    id: overrides.id || uid(),
    // 템플릿 id (구버전 type 호환)
    template:
      overrides.template || (overrides.type === '2p' ? 'double-basic' : 'single-basic'),
    // 1인용 / 캐릭터 파일 (단일 캐릭터)
    characterId: overrides.characterId || '',
    image: str(overrides.image),
    imageT: tf(overrides.imageT),
    pointColor: str(overrides.pointColor),
    // 2인용
    characterA: overrides.characterA || '',
    characterB: overrides.characterB || '',
    imgAMain: str(overrides.imgAMain),
    imgAMainT: tf(overrides.imgAMainT),
    imgASub: str(overrides.imgASub),
    imgASubT: tf(overrides.imgASubT),
    imgBMain: str(overrides.imgBMain),
    imgBMainT: tf(overrides.imgBMainT),
    imgBSub: str(overrides.imgBSub),
    imgBSubT: tf(overrides.imgBSubT),
    // 캐릭터 파일 전용
    cfPoint1: str(overrides.cfPoint1),
    cfPoint1T: tf(overrides.cfPoint1T),
    cfPoint2: str(overrides.cfPoint2),
    cfPoint2T: tf(overrides.cfPoint2T),
    cfPoint3: str(overrides.cfPoint3),
    cfPoint3T: tf(overrides.cfPoint3T),
    cfMain: str(overrides.cfMain),
    cfMainT: tf(overrides.cfMainT),
    cfSub: str(overrides.cfSub),
    cfSubT: tf(overrides.cfSubT),
    height: str(overrides.height),
    weight: str(overrides.weight),
    credit: str(overrides.credit),
    notePattern: NOTE.includes(overrides.notePattern) ? overrides.notePattern : 'grid',
    // 캘린더 전용
    ratio: ['mobile', 'tablet', 'desktop'].includes(overrides.ratio) ? overrides.ratio : 'mobile',
    year: Number(overrides.year) > 0 ? Number(overrides.year) : new Date().getFullYear(),
    month: Number(overrides.month) >= 1 && Number(overrides.month) <= 12 ? Number(overrides.month) : new Date().getMonth() + 1,
    bgColor: str(overrides.bgColor),
    lang: overrides.lang === 'en' ? 'en' : 'ko',
    dateStickers: Array.isArray(overrides.dateStickers)
      ? overrides.dateStickers
          .map((d) => ({ date: Number(d.date) || 0, src: typeof d.src === 'string' ? d.src : '' }))
          .filter((d) => d.date >= 1 && d.src)
      : [],
    // 템플릿별 자유 확장 데이터 (외관카드/레퍼런스/풀시트 등)
    extra:
      overrides.extra && typeof overrides.extra === 'object' ? { ...overrides.extra } : {},
    // 공통
    narrative: str(overrides.narrative),
    stickers: Array.isArray(overrides.stickers)
      ? overrides.stickers.map((s) => createSticker(s)).filter((s) => s.src)
      : [],
    createdAt: overrides.createdAt || now,
    updatedAt: overrides.updatedAt || now,
  }
}

// 스티커: 카드 좌표 기준 px 위치/크기
export function createSticker(overrides = {}) {
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d)
  const src = typeof overrides.src === 'string' ? overrides.src : ''
  return {
    id: overrides.id || uid(),
    // 'upload' (직접 업로드) | 'preset' (기본 제공)
    type: overrides.type === 'preset' ? 'preset' : 'upload',
    src, // 실제 렌더되는 이미지 (틴트 적용 시 틴트된 결과)
    baseSrc: typeof overrides.baseSrc === 'string' && overrides.baseSrc ? overrides.baseSrc : src,
    color: typeof overrides.color === 'string' ? overrides.color : '', // 틴트 색 ('' = 원본)
    recolorable: !!overrides.recolorable,
    x: num(overrides.x, 0),
    y: num(overrides.y, 0),
    width: num(overrides.width, 200) > 0 ? num(overrides.width, 200) : 200,
    height: num(overrides.height, 200) > 0 ? num(overrides.height, 200) : 200,
  }
}

export function loadFairtls() {
  return readArray(FAIRTL_KEY).map((f) => createFairtl(f))
}

export function saveFairtls(list) {
  writeArray(FAIRTL_KEY, list)
}

// ── 서사 프리셋 ──
export function createPreset(overrides = {}) {
  return {
    id: overrides.id || uid(),
    name: typeof overrides.name === 'string' ? overrides.name : '',
    content: typeof overrides.content === 'string' ? overrides.content : '',
  }
}

export function loadPresets() {
  return readArray(PRESET_KEY).map((p) => createPreset(p))
}

export function savePresets(list) {
  writeArray(PRESET_KEY, list)
}
