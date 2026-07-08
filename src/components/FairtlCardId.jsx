import { forwardRef } from 'react'
import styles from './FairtlCardId.module.css'
import StickerLayer from './StickerLayer.jsx'
import { parseTags, formatBirthdayDisplay } from '../lib/character.js'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'
import { tint, shade, contrastText } from '../lib/color.js'

function genderShort(g = '') {
  if (/여|female|^f/i.test(g)) return 'F'
  if (/남|male|^m/i.test(g)) return 'M'
  return (g || '').slice(0, 3).toUpperCase()
}

const FairtlCardId = forwardRef(function FairtlCardId(
  { character, pointColor, data = {}, adminLayout, stickers, stickersEditable, stickerSelectedId, onStickerSelect, onStickersChange },
  ref,
) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = pointColor || c.mainColor || colors[0]?.hex || '#e8688f'
  const tags = parseTags(c.tags)
  const digits = (c.birthday || '').replace(/\D/g, '')
  const idNo = data.idNo || `${digits.padStart(6, '9')}180502`
  const dob = [c.birthday && formatBirthdayDisplay(c.birthday), genderShort(c.gender)].filter(Boolean).join(' / ')
  const onAccent = contrastText(accent)

  const rows = [
    ['Name', c.name || '이름 없음'],
    ['Date of Birth', dob || '—'],
    ['Type', data.idType || tags[0] || 'CAT'],
    ['MBTI', data.mbti || (c.keywords && c.keywords[0]) || '—'],
    ['Date of Issue', data.issueDate || '2023-05-15'],
  ]

  return (
    <div
      ref={ref}
      className={styles.card}
      style={{ '--accent': accent, '--soft': tint(accent, 0.86), '--deep': shade(accent, 0.5), '--on': onAccent }}
    >
      <div className={styles.head}>
        <span className={styles.brand}>( CASKET )</span>
        <span className={styles.headTitle}>CASKET IDENTITY CARD</span>
        <span className={styles.serial}>001</span>
      </div>

      <div className={styles.body}>
        <div className={styles.photoCol}>
          <div className={styles.photo} data-region="photo" data-label="사진" style={adminTransform(adminLayout, 'photo')}>
            {data.illust ? (
              <div className={styles.img} style={{ backgroundImage: `url("${data.illust}")`, transform: fairtlTransform(data.illustT) }} />
            ) : (
              <div className={styles.ph}>PHOTO</div>
            )}
            <span className={styles.heart}>♥</span>
          </div>
          <span className={styles.idLabel}>ID. {idNo}</span>
        </div>

        <div className={styles.fields}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles.row}>
              <span className={styles.label}>{label}</span>
              <span className={styles.value}>{value}</span>
            </div>
          ))}
          {c.alias && <p className={styles.alias}>“{c.alias}”</p>}
        </div>
      </div>

      <div className={styles.strip}>
        {'★'.repeat(28).split('').map((s, i) => (
          <span key={i} className={styles.star}>★</span>
        ))}
      </div>
      <div className={styles.foot}>
        &gt;&gt;&gt; CASKET &gt;&gt;&gt; {c.tagline || 'IDENTITY'} &gt;&gt;&gt; {idNo.slice(-4)}
      </div>

      <StickerLayer stickers={stickers} editable={stickersEditable} selectedId={stickerSelectedId} onSelect={onStickerSelect} onChange={onStickersChange} />
    </div>
  )
})

export default FairtlCardId
