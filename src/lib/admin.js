// 관리자 편집 — 이미지 슬롯 위치/크기 오프셋
// adminLayout = { [regionKey]: { dx, dy, sx, sy } }
//  dx,dy = 카드 px 이동 / sx,sy = 가로·세로 배율(따로) — transform 만 사용해 다른 요소 흐름에 영향 없음
export function adminTransform(adminLayout, key) {
  const o = adminLayout && adminLayout[key]
  if (!o) return undefined
  const dx = o.dx || 0
  const dy = o.dy || 0
  const sx = o.sx || 1
  const sy = o.sy || 1
  if (!dx && !dy && sx === 1 && sy === 1) return undefined
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
    transformOrigin: 'top left',
  }
}
