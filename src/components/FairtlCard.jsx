import { forwardRef } from 'react'
import styles from './FairtlCard.module.css'
import StickerLayer from './StickerLayer.jsx'
import { parseTags, formatBirthdayDisplay } from '../lib/character.js'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'

// 800x1200 고정 크기 페어틀 템플릿 (v1)
const FairtlCard = forwardRef(function FairtlCard(
  {
    character,
    image,
    imageT,
    narrative,
    pointColor,
    adminLayout,
    stickers,
    stickersEditable,
    stickerSelectedId,
    onStickerSelect,
    onStickersChange,
  },
  ref,
) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = pointColor || colors[0]?.hex || '#b9a3ff'
  const tags = parseTags(c.tags)

  const info = [
    { label: '나이', value: c.age },
    { label: '성별', value: c.gender },
    { label: '생일', value: c.birthday && formatBirthdayDisplay(c.birthday) },
  ].filter((i) => i.value && String(i.value).trim())

  return (
    <div ref={ref} className={styles.card} style={{ '--accent': accent }}>
      <div className={styles.accentBar} />

      {/* 1. 상단: 이름 + 별칭 */}
      <header className={styles.header}>
        <h1 className={styles.name}>{c.name || '이름 없음'}</h1>
        {c.alias && <p className={styles.alias}>“{c.alias}”</p>}
      </header>

      {/* 2~3. 중단: 이미지 + 정보 */}
      <div className={styles.middle}>
        <div className={styles.imageBox} data-region="image" data-label="일러스트" style={adminTransform(adminLayout, 'image')}>
          {image ? (
            // html2canvas는 object-fit 미지원 → background-size:cover 로 비율 유지
            <div
              className={styles.image}
              style={{ backgroundImage: `url("${image}")`, transform: fairtlTransform(imageT) }}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span>이미지 없음</span>
            </div>
          )}
        </div>

        <div className={styles.info}>
          {info.map((i) => (
            <div key={i.label} className={styles.infoRow}>
              <span className={styles.infoLabel}>{i.label}</span>
              <span className={styles.infoValue}>{i.value}</span>
            </div>
          ))}

          {tags.length > 0 && (
            <div className={styles.tagBlock}>
              <span className={styles.infoLabel}>태그</span>
              <div className={styles.tags}>
                {tags.map((t, i) => (
                  <span key={i} className={styles.tag}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className={styles.palette}>
              {colors.map((col) => (
                <span key={col.id} className={styles.swatch} style={{ background: col.hex }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. 하단: 서사/소개글 */}
      <div className={styles.narrativeBox}>
        {narrative?.trim() ? (
          <p className={styles.narrative}>{narrative}</p>
        ) : (
          <p className={styles.narrativeEmpty}>서사 / 소개글을 입력하세요</p>
        )}
      </div>

      {/* 5. 워터마크 */}
      <footer className={styles.watermark}>
        <span className={styles.mark}>✦</span> CASKET
      </footer>

      <StickerLayer
        stickers={stickers}
        editable={stickersEditable}
        selectedId={stickerSelectedId}
        onSelect={onStickerSelect}
        onChange={onStickersChange}
      />
    </div>
  )
})

export default FairtlCard
