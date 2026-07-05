import { forwardRef } from 'react'
import styles from './FairtlCardCharFile.module.css'
import StickerLayer from './StickerLayer.jsx'
import { parseTags } from '../lib/character.js'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'
import { shade, tint, contrastText, luminance, rgba } from '../lib/color.js'

const BARS = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3]

function Slot({ src, t, boxClass, label, region, adminLayout }) {
  return (
    <div className={boxClass} data-region={region} data-label={label} style={adminTransform(adminLayout, region)}>
      {src ? (
        <div
          className={styles.img}
          style={{ backgroundImage: `url("${src}")`, transform: fairtlTransform(t) }}
        />
      ) : (
        <div className={styles.imgEmpty}>{label || '이미지'}</div>
      )}
    </div>
  )
}

function patternStyle(pattern, line) {
  switch (pattern) {
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: '26px 26px',
      }
    case 'dot':
      return {
        backgroundImage: `radial-gradient(${line} 1.6px, transparent 1.7px)`,
        backgroundSize: '22px 22px',
      }
    case 'line':
      return {
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px)`,
        backgroundSize: '100% 28px',
      }
    default:
      return {}
  }
}

const FairtlCardCharFile = forwardRef(function FairtlCardCharFile(
  {
    character,
    pointColor,
    cfPoint1,
    cfPoint1T,
    cfPoint2,
    cfPoint2T,
    cfPoint3,
    cfPoint3T,
    cfMain,
    cfMainT,
    cfSub,
    cfSubT,
    height,
    weight,
    credit,
    notePattern,
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
  const point = pointColor || colors[0]?.hex || '#b9a3ff'
  const sideBg = shade(point, 0.66)
  const mainBg = tint(point, 0.9)
  const textSide = contrastText(sideBg)
  const textMain = contrastText(mainBg)
  // 밝은 메인 패널에서 읽히도록 헤더용 진한 포인트
  const pointInk = luminance(point) > 0.66 ? shade(point, 0.45) : point
  const line = rgba(pointInk, 0.16)
  const tags = parseTags(c.tags)

  const vars = {
    '--point': point,
    '--point-ink': pointInk,
    '--side-bg': sideBg,
    '--main-bg': mainBg,
    '--text-side': textSide,
    '--text-main': textMain,
  }

  const points = [
    { src: cfPoint1, t: cfPoint1T, n: '01', key: 'cfPoint1' },
    { src: cfPoint2, t: cfPoint2T, n: '02', key: 'cfPoint2' },
    { src: cfPoint3, t: cfPoint3T, n: '03', key: 'cfPoint3' },
  ]

  const Barcode = () => (
    <span className={styles.barcode}>
      {BARS.map((w, i) => (
        <span key={i} style={{ width: `${w}px` }} />
      ))}
    </span>
  )

  return (
    <div ref={ref} className={styles.card} style={vars}>
      {/* 상단 장식 바 */}
      <div className={styles.topBar}>✦ CHARACTER FILE ✦</div>

      <div className={styles.content}>
        {/* 패널1 — 좌측 사이드 */}
        <div className={styles.side}>
          <p className={styles.sideHeader}>SPECIAL POINT</p>
          <div className={styles.points}>
            {points.map((p, i) => (
              <div className={styles.pointRow} key={i}>
                <span className={styles.pointNo}>POINT {p.n}</span>
                <Slot src={p.src} t={p.t} boxClass={styles.pointBox} label={`POINT ${p.n}`} region={p.key} adminLayout={adminLayout} />
              </div>
            ))}
          </div>

          {colors.length > 0 && (
            <div className={styles.sideColors}>
              {colors.map((col) => (
                <span key={col.id} className={styles.sideChip} style={{ background: col.hex }} />
              ))}
            </div>
          )}

          <div className={styles.sideSpacer} />

          <div className={styles.credit}>
            <Barcode />
            <span className={styles.creditMark}>CASKET</span>
            {credit?.trim() && <span className={styles.creditSrc}>{credit}</span>}
          </div>
        </div>

        {/* 패널2 — 메인 정보 */}
        <div className={styles.main}>
          <p className={styles.mainTop}>✦ CHARACTER FILE — 캐릭터 정보 카드</p>

          <div className={styles.section}>
            <span className={styles.label}>NAME</span>
            <h1 className={styles.name}>{c.name || '이름 없음'}</h1>
            {c.alias && <p className={styles.alias}>“{c.alias}”</p>}
          </div>

          <div className={styles.section}>
            <span className={styles.label}>INFO</span>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoKey}>나이</span>
                <span className={styles.infoVal}>{c.age?.trim() ? c.age : '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoKey}>키</span>
                <span className={styles.infoVal}>{height?.trim() ? height : '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoKey}>몸무게</span>
                <span className={styles.infoVal}>{weight?.trim() ? weight : '—'}</span>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((t, i) => (
                <span key={i} className={styles.tag}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {c.appearance?.trim() && (
            <div className={styles.section}>
              <span className={styles.label}>APPEARANCE</span>
              <p className={styles.body}>{c.appearance}</p>
            </div>
          )}

          {c.personality?.trim() && (
            <div className={styles.section}>
              <span className={styles.label}>PERSONALITY</span>
              <p className={styles.body}>{c.personality}</p>
            </div>
          )}
        </div>

        {/* 패널3 — 이미지 */}
        <div className={styles.imgs}>
          <div className={styles.mainImgWrap}>
            <Slot src={cfMain} t={cfMainT} boxClass={styles.mainImgBox} label="MAIN" region="cfMain" adminLayout={adminLayout} />
          </div>
          <p className={styles.otherLabel}>OTHER</p>
          <Slot src={cfSub} t={cfSubT} boxClass={styles.subImgBox} label="SD / 전신" region="cfSub" adminLayout={adminLayout} />
        </div>

        {/* 패널4 — FREE NOTE */}
        <div className={styles.note}>
          <p className={styles.noteHeader}>FREE NOTE</p>
          <div className={styles.notePad} style={patternStyle(notePattern, line)} />
        </div>
      </div>

      {/* 하단 장식 바 */}
      <div className={styles.bottomBar}>
        <span className={styles.deco}>✦ ♡</span>
        <Barcode />
        <span className={styles.deco}>☐ ✦</span>
      </div>

      <StickerLayer
        stickers={stickers}
        editable={stickersEditable}
        selectedId={stickerSelectedId}
        onSelect={onStickerSelect}
        onChange={onStickersChange}
        cardWidth={1400}
        cardHeight={900}
      />
    </div>
  )
})

export default FairtlCardCharFile
