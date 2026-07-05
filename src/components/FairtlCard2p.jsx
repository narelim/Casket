import { forwardRef } from 'react'
import styles from './FairtlCard2p.module.css'
import StickerLayer from './StickerLayer.jsx'
import { parseTags, formatBirthdayDisplay } from '../lib/character.js'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'

function ImgSlotView({ img, t, region, label, adminLayout }) {
  return (
    <div
      className={styles.imgBox}
      data-region={region}
      data-label={label}
      style={adminTransform(adminLayout, region)}
    >
      {img ? (
        <div
          className={styles.img}
          style={{ backgroundImage: `url("${img}")`, transform: fairtlTransform(t) }}
        />
      ) : (
        <div className={styles.imgEmpty}>두상</div>
      )}
    </div>
  )
}

function Side({ character, imgMain, imgMainT, imgSub, imgSubT, mainKey, subKey, adminLayout }) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = colors[0]?.hex || '#b9a3ff'
  const tags = parseTags(c.tags)
  const info = [
    { label: '나이', value: c.age },
    { label: '성별', value: c.gender },
    { label: '생일', value: c.birthday && formatBirthdayDisplay(c.birthday) },
  ].filter((i) => i.value && String(i.value).trim())

  return (
    <div className={styles.side} style={{ '--accent': accent }}>
      <div className={styles.imgStack}>
        <ImgSlotView img={imgMain} t={imgMainT} region={mainKey} label="두상1" adminLayout={adminLayout} />
        <ImgSlotView img={imgSub} t={imgSubT} region={subKey} label="두상2" adminLayout={adminLayout} />
      </div>
      <div className={styles.info}>
        {info.map((i) => (
          <div key={i.label} className={styles.infoRow}>
            <span className={styles.infoLabel}>{i.label}</span>
            <span className={styles.infoValue}>{i.value}</span>
          </div>
        ))}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((t, i) => (
              <span key={i} className={styles.tag}>
                #{t}
              </span>
            ))}
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
  )
}

// 800x1200 2인용 템플릿 (gap 미사용 — margin 기반)
const FairtlCard2p = forwardRef(function FairtlCard2p(
  {
    characterA,
    characterB,
    imgAMain,
    imgAMainT,
    imgASub,
    imgASubT,
    imgBMain,
    imgBMainT,
    imgBSub,
    imgBSubT,
    narrative,
    adminLayout,
    stickers,
    stickersEditable,
    stickerSelectedId,
    onStickerSelect,
    onStickersChange,
  },
  ref,
) {
  const a = characterA
  const b = characterB
  const accentA = a?.colors?.[0]?.hex || '#b9a3ff'

  return (
    <div ref={ref} className={styles.card} style={{ '--accent': accentA }}>
      <div className={styles.accentBar} />

      <header className={styles.header}>
        <div className={styles.names}>
          <span className={styles.name}>{a?.name || '캐릭터 A'}</span>
          <span className={styles.times}>×</span>
          <span className={styles.name}>{b?.name || '캐릭터 B'}</span>
        </div>
        {(a?.alias || b?.alias) && (
          <div className={styles.aliases}>
            {a?.alias && <span>“{a.alias}”</span>}
            {a?.alias && b?.alias && <span className={styles.aliasDot}>·</span>}
            {b?.alias && <span>“{b.alias}”</span>}
          </div>
        )}
      </header>

      <div className={styles.middle}>
        <Side character={a} imgMain={imgAMain} imgMainT={imgAMainT} imgSub={imgASub} imgSubT={imgASubT} mainKey="imgAMain" subKey="imgASub" adminLayout={adminLayout} />
        <div className={styles.vdiv} />
        <Side character={b} imgMain={imgBMain} imgMainT={imgBMainT} imgSub={imgBSub} imgSubT={imgBSubT} mainKey="imgBMain" subKey="imgBSub" adminLayout={adminLayout} />
      </div>

      <div className={styles.narrativeBox}>
        {narrative?.trim() ? (
          <p className={styles.narrative}>{narrative}</p>
        ) : (
          <p className={styles.narrativeEmpty}>관계 서사를 입력하세요</p>
        )}
      </div>

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

export default FairtlCard2p
