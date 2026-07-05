import { useEffect, useRef, useState } from 'react'
import styles from './EditableSlot.module.css'
import { fairtlTransform, defaultTransform } from '../lib/fairtl.js'

const MIN_SCALE = 0.3
const MAX_SCALE = 5

// 인터랙티브 이미지 슬롯 (이동/확대 + transform 저장)
// src 없으면 업로드 버튼, 있으면 클릭 시 편집 모드.
export default function EditableSlot({
  src,
  transform,
  onUpload,
  onTransform,
  onClear,
  width,
  height,
  label,
}) {
  const [editing, setEditing] = useState(false)
  const wrapRef = useRef(null)
  const slotRef = useRef(null)
  const fileRef = useRef(null)
  const t = transform || defaultTransform()

  // 빈 곳 클릭 시 편집 모드 해제
  useEffect(() => {
    if (!editing) return
    function onDocDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setEditing(false)
    }
    document.addEventListener('pointerdown', onDocDown)
    return () => document.removeEventListener('pointerdown', onDocDown)
  }, [editing])

  function pickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => onUpload?.(String(reader.result))
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  function startDrag(e, mode) {
    if (!editing) return
    e.preventDefault()
    e.stopPropagation()
    const rect = slotRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const start = { ...t }
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1

    function move(ev) {
      if (mode === 'move') {
        onTransform?.({
          ...start,
          x: start.x + (ev.clientX - e.clientX) / rect.width,
          y: start.y + (ev.clientY - e.clientY) / rect.height,
        })
      } else {
        const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy)
        let s = start.scale * (dist / startDist)
        s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s))
        onTransform?.({ ...start, scale: Number(s.toFixed(3)) })
      }
    }
    function up() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function onImageDown(e) {
    if (!editing) {
      setEditing(true)
      wrapRef.current?.focus()
      return
    }
    startDrag(e, 'move')
  }

  function onKeyDown(e) {
    if (!editing || !src) return
    const rect = slotRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = 1 / rect.width
    const sy = 1 / rect.height
    let handled = true
    if (e.key === 'ArrowLeft') onTransform?.({ ...t, x: t.x - sx })
    else if (e.key === 'ArrowRight') onTransform?.({ ...t, x: t.x + sx })
    else if (e.key === 'ArrowUp') onTransform?.({ ...t, y: t.y - sy })
    else if (e.key === 'ArrowDown') onTransform?.({ ...t, y: t.y + sy })
    else handled = false
    if (handled) e.preventDefault()
  }

  return (
    <div
      className={styles.wrap}
      ref={wrapRef}
      tabIndex={editing ? 0 : -1}
      onKeyDown={onKeyDown}
      style={{ width }}
    >
      <div
        ref={slotRef}
        className={`${styles.slot} ${editing ? styles.editing : ''}`}
        style={{ width, height }}
      >
        {src ? (
          <div
            className={styles.image}
            style={{ backgroundImage: `url("${src}")`, transform: fairtlTransform(t) }}
            onPointerDown={onImageDown}
          />
        ) : (
          <button className={styles.empty} onClick={() => fileRef.current?.click()}>
            <span className={styles.plus}>＋</span>
            <span className={styles.emptyLabel}>{label}</span>
          </button>
        )}

        {editing && src && (
          <>
            <span className={`${styles.handle} ${styles.tl}`} onPointerDown={(e) => startDrag(e, 'resize')} />
            <span className={`${styles.handle} ${styles.tr}`} onPointerDown={(e) => startDrag(e, 'resize')} />
            <span className={`${styles.handle} ${styles.bl}`} onPointerDown={(e) => startDrag(e, 'resize')} />
            <span className={`${styles.handle} ${styles.br}`} onPointerDown={(e) => startDrag(e, 'resize')} />
          </>
        )}
      </div>

      {/* 슬롯 하단 툴바 */}
      {editing && src ? (
        <div className={styles.toolbar}>
          <span className={styles.hint}>드래그 이동 · 모서리 크기조절 · 방향키 미세조정</span>
          <span className={styles.toolBtns}>
            <button className={styles.toolBtn} onClick={() => onTransform?.(defaultTransform())}>
              리셋
            </button>
            <button
              className={`${styles.toolBtn} ${styles.done}`}
              onClick={() => setEditing(false)}
            >
              완료
            </button>
          </span>
        </div>
      ) : (
        src && (
          <div className={styles.idleBar}>
            <button className={styles.link} onClick={() => fileRef.current?.click()}>
              {label} 변경
            </button>
            <button className={styles.linkDanger} onClick={() => onClear?.()}>
              제거
            </button>
          </div>
        )
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
    </div>
  )
}
