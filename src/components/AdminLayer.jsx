import { useLayoutEffect, useRef, useState } from 'react'
import styles from './AdminLayer.module.css'

// 미리보기 위 오버레이 — [data-region] 이미지 슬롯을 드래그/리사이즈
export default function AdminLayer({ previewRef, scale, adminLayout, onChange }) {
  const selfRef = useRef(null)
  const [rects, setRects] = useState([])

  function measure() {
    const root = previewRef.current
    const self = selfRef.current
    if (!root || !self) return
    const base = self.getBoundingClientRect()
    const list = []
    root.querySelectorAll('[data-region]').forEach((n) => {
      const r = n.getBoundingClientRect()
      list.push({
        key: n.getAttribute('data-region'),
        label: n.getAttribute('data-label') || n.getAttribute('data-region'),
        x: r.left - base.left,
        y: r.top - base.top,
        w: r.width,
        h: r.height,
      })
    })
    setRects(list)
  }

  useLayoutEffect(() => {
    measure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminLayout, scale])

  function startMove(e, key) {
    e.preventDefault()
    e.stopPropagation()
    const o = adminLayout[key] || {}
    const odx = o.dx || 0
    const ody = o.dy || 0
    const sx = e.clientX
    const sy = e.clientY
    function mv(ev) {
      onChange(key, { dx: Math.round(odx + (ev.clientX - sx) / scale), dy: Math.round(ody + (ev.clientY - sy) / scale) })
    }
    function up() {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
      measure()
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  // mode: 'x'(가로 배율) | 'y'(세로 배율) | 'xy'(둘 다) — transform 배율로 저장(흐름 영향 없음)
  function startResize(e, key, rect, mode) {
    e.preventDefault()
    e.stopPropagation()
    const o = adminLayout[key] || {}
    const sx0 = o.sx || 1
    const sy0 = o.sy || 1
    const px = e.clientX
    const py = e.clientY
    const w0 = rect.w || 1
    const h0 = rect.h || 1
    function mv(ev) {
      const patch = {}
      if (mode.includes('x')) {
        const r = Math.max(0.1, (w0 + (ev.clientX - px)) / w0)
        patch.sx = Math.round(sx0 * r * 1000) / 1000
      }
      if (mode.includes('y')) {
        const r = Math.max(0.1, (h0 + (ev.clientY - py)) / h0)
        patch.sy = Math.round(sy0 * r * 1000) / 1000
      }
      onChange(key, patch)
    }
    function up() {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
      measure()
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  return (
    <div ref={selfRef} className={styles.layer}>
      {rects.map((r) => (
        <div
          key={r.key}
          className={styles.box}
          style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
          onPointerDown={(e) => startMove(e, r.key)}
        >
          <span className={styles.label}>{r.label}</span>
          <span className={`${styles.edge} ${styles.edgeR}`} title="너비" onPointerDown={(e) => startResize(e, r.key, r, 'x')} />
          <span className={`${styles.edge} ${styles.edgeB}`} title="높이" onPointerDown={(e) => startResize(e, r.key, r, 'y')} />
          <span className={styles.resize} title="가로·세로" onPointerDown={(e) => startResize(e, r.key, r, 'xy')} />
        </div>
      ))}
    </div>
  )
}
