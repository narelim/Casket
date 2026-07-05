// 기본 제공 스티커 라이브러리
// - 6×4 = 24개/페이지, 최대 32페이지
// - 흰색(단색) 이미지는 recolorable: true 로 두면 보관함에서 색 변경 가능
// - 사용자가 직접 사진 스티커를 추가할 때: CUSTOM_PRESETS 에 { id, name, src, recolorable } 를 넣으면 됨
export const STICKER_PAGE_SIZE = 24
export const STICKER_MAX_PAGES = 32

// 흰색 SVG 도형을 data URI 로 (recolor 가능)
function svg(inner) {
  const body = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${inner}</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(body)
}
const W = "fill='#ffffff'"
const SW = "fill='none' stroke='#ffffff' stroke-width='7' stroke-linejoin='round' stroke-linecap='round'"

// 내장 벡터 스티커 (흰색 → 색 변경 가능)
const BUILTIN = [
  { id: 'heart', name: '하트', inner: `<path ${W} d='M50 86 L20 54 A18 18 0 0 1 50 30 A18 18 0 0 1 80 54 Z'/>` },
  { id: 'heart-o', name: '하트(선)', inner: `<path ${SW} d='M50 84 L23 55 A16 16 0 0 1 50 33 A16 16 0 0 1 77 55 Z'/>` },
  { id: 'star', name: '별', inner: `<path ${W} d='M50 12 61 40 92 42 68 62 76 92 50 74 24 92 32 62 8 42 39 40 Z'/>` },
  { id: 'star-o', name: '별(선)', inner: `<path ${SW} d='M50 16 60 40 86 42 66 60 73 86 50 71 27 86 34 60 14 42 40 40 Z'/>` },
  { id: 'sparkle', name: '반짝', inner: `<path ${W} d='M50 8 C54 36 64 46 92 50 64 54 54 64 50 92 46 64 36 54 8 50 36 46 46 36 50 8 Z'/>` },
  { id: 'circle', name: '원', inner: `<circle ${W} cx='50' cy='50' r='38'/>` },
  { id: 'ring', name: '링', inner: `<circle ${SW} cx='50' cy='50' r='35'/>` },
  { id: 'square', name: '사각', inner: `<rect ${W} x='16' y='16' width='68' height='68' rx='10'/>` },
  { id: 'square-o', name: '사각(선)', inner: `<rect ${SW} x='18' y='18' width='64' height='64' rx='10'/>` },
  { id: 'diamond', name: '다이아', inner: `<path ${W} d='M50 12 88 50 50 88 12 50 Z'/>` },
  { id: 'triangle', name: '삼각', inner: `<path ${W} d='M50 16 86 82 14 82 Z'/>` },
  { id: 'flower', name: '꽃', inner: `<g ${W}><circle cx='50' cy='28' r='15'/><circle cx='72' cy='44' r='15'/><circle cx='64' cy='70' r='15'/><circle cx='36' cy='70' r='15'/><circle cx='28' cy='44' r='15'/></g><circle fill='#ffffff' cx='50' cy='52' r='12'/>` },
  { id: 'cloud', name: '구름', inner: `<path ${W} d='M28 66 a16 16 0 0 1 2-31 a20 20 0 0 1 38 4 a14 14 0 0 1 4 27 Z'/>` },
  { id: 'bolt', name: '번개', inner: `<path ${W} d='M56 8 28 54 46 54 40 92 74 42 54 42 Z'/>` },
  { id: 'note', name: '음표', inner: `<g ${W}><rect x='44' y='20' width='8' height='50'/><path d='M44 20 76 12 76 24 44 32 Z'/><circle cx='38' cy='70' r='13'/><circle cx='70' cy='62' r='11'/></g>` },
  { id: 'paw', name: '발바닥', inner: `<g ${W}><circle cx='32' cy='38' r='9'/><circle cx='50' cy='30' r='9'/><circle cx='68' cy='38' r='9'/><circle cx='78' cy='56' r='8'/><path d='M50 50 C66 50 76 64 70 76 C64 86 36 86 30 76 C24 64 34 50 50 50 Z'/></g>` },
  { id: 'cross', name: '플러스', inner: `<path ${W} d='M42 16 H58 V42 H84 V58 H58 V84 H42 V58 H16 V42 H42 Z'/>` },
  { id: 'speech', name: '말풍선', inner: `<path ${W} d='M18 22 h64 a8 8 0 0 1 8 8 v34 a8 8 0 0 1 -8 8 H44 L28 88 V80 H18 a8 8 0 0 1 -8 -8 V30 a8 8 0 0 1 8 -8 Z'/>` },
  { id: 'check', name: '체크', inner: `<path ${SW} d='M22 52 42 72 80 28'/>` },
  { id: 'crown', name: '왕관', inner: `<path ${W} d='M18 76 14 36 36 54 50 26 64 54 86 36 82 76 Z'/>` },
]

const BUILTIN_PRESETS = BUILTIN.map((b) => ({
  id: `builtin-${b.id}`,
  name: b.name,
  src: svg(b.inner),
  recolorable: true,
}))

// 사용자 제공 사진 스티커는 여기에 추가 (예: { id:'cat-01', name:'고양이', src:'data:image/png;base64,...', recolorable:false })
export const CUSTOM_PRESETS = []

export const PRESET_STICKERS = [...BUILTIN_PRESETS, ...CUSTOM_PRESETS]

export function presetPageCount() {
  const pages = Math.ceil(PRESET_STICKERS.length / STICKER_PAGE_SIZE) || 1
  return Math.min(STICKER_MAX_PAGES, Math.max(1, pages))
}

// 흰색(단색) 이미지를 지정 색으로 틴트 → 새 dataURL 반환 (미리보기/저장 모두 안전)
export function tintImage(src, color) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const cv = document.createElement('canvas')
        cv.width = img.naturalWidth || 200
        cv.height = img.naturalHeight || 200
        const ctx = cv.getContext('2d')
        ctx.drawImage(img, 0, 0, cv.width, cv.height)
        ctx.globalCompositeOperation = 'source-in'
        ctx.fillStyle = color
        ctx.fillRect(0, 0, cv.width, cv.height)
        resolve(cv.toDataURL('image/png'))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = reject
    img.src = src
  })
}
