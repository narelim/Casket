import { forwardRef } from 'react'
import styles from './FairtlCardGacha.module.css'
import StickerLayer from './StickerLayer.jsx'
import { parseTags, formatBirthdayDisplay } from '../lib/character.js'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'
import { tint, shade, contrastText } from '../lib/color.js'

const FairtlCardGacha = forwardRef(function FairtlCardGacha(
  { character, pointColor, data = {}, adminLayout, stickers, stickersEditable, stickerSelectedId, onStickerSelect, onStickersChange },
  ref,
) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = pointColor || c.mainColor || colors[0]?.hex || '#ff8fbf'
  const tags = parseTags(c.tags)
  const keywords = Array.isArray(c.keywords) ? c.keywords : []
  const rarityLabel = data.rarity || 'SSR'
  const onAccent = contrastText(accent)

  const stats = [
    { label: '나이', value: c.age },
    { label: '키', value: c.height && `${c.height}cm` },
    { label: '성별', value: c.gender },
    { label: '생일', value: c.birthday && formatBirthdayDisplay(c.birthday) },
  ].filter((s) => s.value && String(s.value).trim())

  return (
    <div
      ref={ref}
      className={styles.card}
      style={{ '--accent': accent, '--soft': tint(accent, 0.9), '--deep': shade(accent, 0.5), '--on': onAccent }}
    >
      <div className={styles.topbar}>
        <span className={styles.title}>★ SUMMON RESULT</span>
        <span className={styles.close}>✕</span>
      </div>

      <div className={styles.stage}>
        <div className={styles.illustCol}>
          <div className={styles.ribbon}>{rarityLabel}</div>
          <div className={styles.frame} data-region="photo" data-label="일러스트" style={adminTransform(adminLayout, 'photo')}>
            {data.illust ? (
              <div className={styles.img} style={{ backgroundImage: `url("${data.illust}")`, transform: fairtlTransform(data.illustT) }} />
            ) : (
              <div className={styles.ph}>CHARACTER</div>
            )}
            <div className={styles.namePlate}>
              <span className={styles.plateName}>{c.name || '이름 없음'}</span>
              {c.alias && <span className={styles.plateAlias}>{c.alias}</span>}
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.newTag}>NEW!</div>
          <div className={styles.stars}>{'★'.repeat(Math.min(5, rarityLabel.length + 2))}</div>
          <h2 className={styles.pName}>{c.name || '이름 없음'}</h2>
          {c.tagline && <p className={styles.pTagline}>{c.tagline}</p>}

          <div className={styles.statGrid}>
            {stats.map((s) => (
              <div key={s.label} className={styles.statChip}>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={styles.statValue}>{s.value}</span>
              </div>
            ))}
          </div>

          {(tags.length > 0 || keywords.length > 0) && (
            <div className={styles.tags}>
              {tags.map((t, i) => (
                <span key={`t${i}`} className={styles.tag}>#{t}</span>
              ))}
              {keywords.map((k, i) => (
                <span key={`k${i}`} className={styles.kw}>{k}</span>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.confirm}>확인</button>
            <button className={styles.again}>다시 뽑기 ×10</button>
          </div>
        </div>
      </div>

      <StickerLayer stickers={stickers} editable={stickersEditable} selectedId={stickerSelectedId} onSelect={onStickerSelect} onChange={onStickersChange} />
    </div>
  )
})

export default FairtlCardGacha
