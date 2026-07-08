import { forwardRef } from 'react'
import styles from './FairtlCardInventory.module.css'
import StickerLayer from './StickerLayer.jsx'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'
import { tint, shade, contrastText } from '../lib/color.js'

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

const FairtlCardInventory = forwardRef(function FairtlCardInventory(
  { character, pointColor, data = {}, adminLayout, stickers, stickersEditable, stickerSelectedId, onStickerSelect, onStickersChange },
  ref,
) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = pointColor || c.mainColor || colors[0]?.hex || '#f4a7c6'
  const keywords = Array.isArray(c.keywords) ? c.keywords : []
  const mood = data.mood || keywords[0] || 'happy'
  const line = data.line || c.tagline || '...'
  const hearts = Math.max(0, Math.min(10, Number(data.hearts) === 0 ? 0 : Number(data.hearts) || 8))
  const onAccent = contrastText(accent)

  return (
    <div
      ref={ref}
      className={styles.card}
      style={{ '--accent': accent, '--soft': tint(accent, 0.82), '--deep': shade(accent, 0.45), '--on': onAccent }}
    >
      <div className={styles.statusBar}>
        <span className={styles.moon}>☾</span>
        <span className={styles.time}>{data.timeText || '00:00'}</span>
        <span className={styles.date}>{data.dateText || 'spring 15'}</span>
        <span className={styles.hearts}>
          {'♥'.repeat(hearts)}
          <span className={styles.heartsOff}>{'♡'.repeat(10 - hearts)}</span>
        </span>
        <span className={styles.mood}>mood: {mood}</span>
      </div>

      <div className={styles.middle}>
        <div className={styles.portraitCol}>
          <div className={styles.portrait} data-region="photo" data-label="일러스트" style={adminTransform(adminLayout, 'photo')}>
            {data.illust ? (
              <div className={styles.img} style={{ backgroundImage: `url("${data.illust}")`, transform: fairtlTransform(data.illustT) }} />
            ) : (
              <div className={styles.ph}>CHARACTER</div>
            )}
          </div>
          <div className={styles.namePlate}>{c.name || '이름 없음'}</div>
        </div>

        <div className={styles.invCol}>
          <div className={styles.invHead}>◈ INVENTORY</div>
          <div className={styles.grid}>
            {SLOTS.map((n) => (
              <div key={n} className={styles.slot} data-region={`item${n}`} data-label={`아이템 ${n}`} style={adminTransform(adminLayout, `item${n}`)}>
                {data[`item${n}`] ? (
                  <div className={styles.slotImg} style={{ backgroundImage: `url("${data[`item${n}`]}")`, transform: fairtlTransform(data[`item${n}T`]) }} />
                ) : (
                  <span className={styles.slotPlus} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.dialogue}>
        <div className={styles.speaker}>{c.name || '???'}</div>
        <p className={styles.line}>“{line}”</p>
        <div className={styles.choices}>
          <span className={styles.yes}>▶ yes</span>
          <span className={styles.no}>no</span>
        </div>
      </div>

      <StickerLayer stickers={stickers} editable={stickersEditable} selectedId={stickerSelectedId} onSelect={onStickerSelect} onChange={onStickersChange} />
    </div>
  )
})

export default FairtlCardInventory
