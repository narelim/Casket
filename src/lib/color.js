// 포인트 컬러 기반 테마 계산 유틸
function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '')
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  const n = parseInt(s, 16) || 0
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')
}

// hex 를 target(hex) 쪽으로 amt(0~1) 만큼 섞기
export function mix(hex, target, amt) {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  return rgbToHex({
    r: a.r + (b.r - a.r) * amt,
    g: a.g + (b.g - a.g) * amt,
    b: a.b + (b.b - a.b) * amt,
  })
}

export function shade(hex, amt = 0.6) {
  return mix(hex, '#000000', amt)
}

export function tint(hex, amt = 0.86) {
  return mix(hex, '#ffffff', amt)
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// 배경색 위에서 잘 보이는 텍스트 색 (흰/검 자동)
export function contrastText(hex) {
  return luminance(hex) > 0.6 ? '#1b1b22' : '#ffffff'
}

// 패턴 선 등에 쓸 반투명 색
export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 캐릭터 색 + 어울리는 변형색으로 n개 채우기 (팔레트용)
export function genHarmony(colors, n) {
  const base = (colors || []).map((c) => c.hex).filter(Boolean)
  if (base.length === 0) return Array(n).fill('#dddddd')
  const out = [...base]
  const ops = [
    (h) => tint(h, 0.35),
    (h) => shade(h, 0.3),
    (h) => tint(h, 0.6),
    (h) => shade(h, 0.5),
    (h) => tint(h, 0.15),
    (h) => shade(h, 0.15),
  ]
  let oi = 0
  while (out.length < n) {
    out.push(ops[oi % ops.length](base[out.length % base.length]))
    oi++
  }
  return out.slice(0, n)
}
