import { useState } from 'react'
import styles from './StickerPicker.module.css'
import {
  PRESET_STICKERS,
  STICKER_PAGE_SIZE,
  presetPageCount,
} from '../lib/presetStickers.js'

// 기본 제공 스티커 보관함 — 6×4 그리드, 페이지네이션, 흰색 스티커 색 변경
export default function StickerPicker({ onPick, onClose }) {
  const [page, setPage] = useState(0)
  const [useColor, setUseColor] = useState(false)
  const [color, setColor] = useState('#ff8fb1')

  const total = presetPageCount()
  const start = page * STICKER_PAGE_SIZE
  const items = PRESET_STICKERS.slice(start, start + STICKER_PAGE_SIZE)

  function handlePick(st) {
    const tint = useColor && st.recolorable ? color : null
    onPick(st, tint)
  }

  return (
    <div className={styles.overlay} onPointerDown={onClose}>
      <div className={styles.modal} onPointerDown={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <h2 className={styles.title}>스티커 보관함</h2>
          <button className={styles.close} onClick={onClose}>
            ✕
          </button>
        </header>

        <div className={styles.toolbar}>
          <label className={styles.colorToggle}>
            <input
              type="checkbox"
              checked={useColor}
              onChange={(e) => setUseColor(e.target.checked)}
            />
            색상 적용
          </label>
          <input
            type="color"
            className={styles.colorInput}
            value={color}
            disabled={!useColor}
            onChange={(e) => setColor(e.target.value)}
          />
          <span className={styles.toolHint}>흰색 스티커만 색 변경됩니다</span>
        </div>

        <div className={styles.grid}>
          {items.length === 0 ? (
            <p className={styles.empty}>이 페이지에는 스티커가 없습니다.</p>
          ) : (
            items.map((st) => {
              const tinted = useColor && st.recolorable
              const imgStyle = tinted
                ? {
                    backgroundColor: color,
                    WebkitMaskImage: `url("${st.src}")`,
                    maskImage: `url("${st.src}")`,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                  }
                : { backgroundImage: `url("${st.src}")` }
              return (
                <button
                  key={st.id}
                  className={styles.cell}
                  title={st.name}
                  onClick={() => handlePick(st)}
                >
                  <span className={styles.cellImg} style={imgStyle} />
                </button>
              )
            })
          )}
        </div>

        <footer className={styles.pager}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← 이전
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {total}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= total - 1}
            onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
          >
            다음 →
          </button>
        </footer>
      </div>
    </div>
  )
}
