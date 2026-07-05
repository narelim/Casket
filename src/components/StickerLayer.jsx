import { useEffect, useRef } from 'react'
import styles from './StickerLayer.module.css'

// 카드 위 스티커 레이어 (슬롯 이미지보다 상위).
// editable=true 일 때만 선택/드래그/리사이즈/삭제 가능 (미리보기 전용).
export default function StickerLayer({
  stickers = [],
  selectedId,
  onSelect,
  onChange,
  editable,
  cardWidth = 800,
  cardHeight = 1200,
}) {
  const layerRef = useRef(null)
  const CARD_W = cardWidth

  // Delete / Backspace 로 선택 스티커 삭제
  useEffect(() => {
    if (!editable || !selectedId) return
    function onKey(e) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      onChange?.(stickers.filter((s) => s.id !== selectedId))
      onSelect?.(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editable, selectedId, stickers, onChange, onSelect])

  // 빈 곳 클릭 시 선택 해제 (레이어는 클릭을 통과시키므로 document 로 감지)
  useEffect(() => {
    if (!editable || !selectedId) return
    function onDown(e) {
      if (!e.target.closest?.('[data-sticker]')) onSelect?.(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [editable, selectedId, onSelect])

  // 화면 px → 카드 좌표 변환 배율
  function scale() {
    const r = layerRef.current?.getBoundingClientRect()
    return r && r.width ? r.width / CARD_W : 1
  }

  function startMove(e, st) {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(st.id)
    const sc = scale()
    const sx = e.clientX
    const sy = e.clientY
    const ox = st.x
    const oy = st.y
    function move(ev) {
      onChange?.(
        stickers.map((s) =>
          s.id === st.id ? { ...s, x: ox + (ev.clientX - sx) / sc, y: oy + (ev.clientY - sy) / sc } : s,
        ),
      )
    }
    function up() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function startResize(e, st) {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(st.id)
    const sc = scale()
    const r = layerRef.current.getBoundingClientRect()
    const cx = st.x + st.width / 2
    const cy = st.y + st.height / 2
    const ratio = st.height / st.width || 1
    const startW = st.width
    const toCard = (ev) => ({ x: (ev.clientX - r.left) / sc, y: (ev.clientY - r.top) / sc })
    const p0 = toCard(e)
    const startDist = Math.hypot(p0.x - cx, p0.y - cy) || 1
    function move(ev) {
      const p = toCard(ev)
      const dist = Math.hypot(p.x - cx, p.y - cy)
      const w = Math.max(40, startW * (dist / startDist))
      const h = w * ratio
      onChange?.(
        stickers.map((s) =>
          s.id === st.id ? { ...s, width: w, height: h, x: cx - w / 2, y: cy - h / 2 } : s,
        ),
      )
    }
    function up() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function deleteSticker(id) {
    onChange?.(stickers.filter((s) => s.id !== id))
    onSelect?.(null)
  }

  return (
    <div ref={layerRef} className={styles.layer}>
      {stickers.map((st) => {
        const isSel = editable && selectedId === st.id
        return (
          <div
            key={st.id}
            data-sticker
            className={`${styles.sticker} ${isSel ? styles.selected : ''}`}
            style={{
              left: st.x,
              top: st.y,
              width: st.width,
              height: st.height,
              backgroundImage: `url("${st.src}")`,
              pointerEvents: editable ? 'auto' : 'none',
            }}
            onPointerDown={editable ? (e) => startMove(e, st) : undefined}
          >
            {isSel && (
              <>
                <span className={`${styles.handle} ${styles.tl}`} onPointerDown={(e) => startResize(e, st)} />
                <span className={`${styles.handle} ${styles.tr}`} onPointerDown={(e) => startResize(e, st)} />
                <span className={`${styles.handle} ${styles.bl}`} onPointerDown={(e) => startResize(e, st)} />
                <span className={`${styles.handle} ${styles.br}`} onPointerDown={(e) => startResize(e, st)} />
                <button
                  className={styles.trash}
                  title="삭제"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    deleteSticker(st.id)
                  }}
                >
                  🗑
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
