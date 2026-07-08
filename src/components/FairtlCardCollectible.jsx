import { forwardRef } from 'react'
import styles from './FairtlCardCollectible.module.css'
import StickerLayer from './StickerLayer.jsx'
import { parseTags } from '../lib/character.js'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'
import { tint, shade, contrastText } from '../lib/color.js'

const FairtlCardCollectible = forwardRef(function FairtlCardCollectible(
  { character, pointColor, data = {}, adminLayout, stickers, stickersEditable, stickerSelectedId, onStickerSelect, onStickersChange },
  ref,
) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = pointColor || c.mainColor || colors[0]?.hex || '#7ad0a8'
  const tags = parseTags(c.tags)
  const keywords = Array.isArray(c.keywords) ? c.keywords : []
  const level = data.level || '07'
  const rarity = Math.max(1, Math.min(5, Number(data.rarity) || 3))
  const abilityName = data.abilityName || keywords[0] || c.alias || 'HAPPY HUMMING'
  const flavor = data.flavor || c.tagline || c.personality || ''
  const desc = c.appearance || c.tagline || ''
  const onAccent = contrastText(accent)

  return (
    <div
      ref={ref}
      className={styles.card}
      style={{ '--accent': accent, '--soft': tint(accent, 0.8), '--deep': shade(accent, 0.55), '--on': onAccent }}
    >
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <span className={styles.name}>{c.name || '이름 없음'}</span>
          <span className={styles.level}>LV.{level}</span>
        </div>

        <div className={styles.frame} data-region="photo" data-label="일러스트" style={adminTransform(adminLayout, 'photo')}>
          {data.illust ? (
            <div className={styles.img} style={{ backgroundImage: `url("${data.illust}")`, transform: fairtlTransform(data.illustT) }} />
          ) : (
            <div className={styles.ph}>ILLUSTRATION</div>
          )}
          <div className={styles.rarity}>{'★'.repeat(rarity)}</div>
        </div>

        {tags.length > 0 && (
          <div className={styles.types}>
            {tags.slice(0, 4).map((t, i) => (
              <span key={i} className={styles.type}>{t}</span>
            ))}
          </div>
        )}

        <div className={styles.descBox}>
          {desc && <p className={styles.desc}>{desc}</p>}
          <div className={styles.stats}>
            {c.age && <span className={styles.stat}>AGE {c.age}</span>}
            {c.height && <span className={styles.stat}>H {c.height}</span>}
            {c.gender && <span className={styles.stat}>{c.gender}</span>}
          </div>
        </div>

        <div className={styles.ability}>
          <div className={styles.abilityHead}>
            <span className={styles.abilityName}>{abilityName}</span>
            <span className={styles.abilityTag}>skill</span>
          </div>
          {flavor && <p className={styles.flavor}>{flavor}</p>}
        </div>

        <div className={styles.foot}>
          <span className={styles.copy}>© CASKET</span>
          <span className={styles.no}>No. {(c.name || 'C').slice(0, 3).toUpperCase()}·{level}</span>
        </div>
      </div>

      <StickerLayer stickers={stickers} editable={stickersEditable} selectedId={stickerSelectedId} onSelect={onStickerSelect} onChange={onStickersChange} />
    </div>
  )
})

export default FairtlCardCollectible
