import { forwardRef } from 'react'
import styles from './FairtlCardFull.module.css'
import StickerLayer from './StickerLayer.jsx'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'

const CHIP_LABELS = ['머리', '왼눈', '오른눈', '피부']

function Slot({ src, t, cls, label, region, adminLayout }) {
  return (
    <div className={cls} data-region={region} data-label={label} style={adminTransform(adminLayout, region)}>
      {src ? (
        <div className={styles.img} style={{ backgroundImage: `url("${src}")`, transform: fairtlTransform(t) }} />
      ) : (
        <div className={styles.imgEmpty}>{label}</div>
      )}
    </div>
  )
}

function Side({ char, p, data, adminLayout }) {
  const c = char || {}
  const colors = c.colors ?? []
  const accent = colors[0]?.hex || '#888'

  return (
    <div className={styles.side} style={{ '--accent': accent }}>
      <div className={styles.heads}>
        {[1, 2, 3].map((n) => (
          <Slot
            key={n}
            src={data[`${p}Head${n}`]}
            t={data[`${p}Head${n}T`]}
            cls={styles.headBox}
            label={`두상 ${n}`}
            region={`${p}Head${n}`}
            adminLayout={adminLayout}
          />
        ))}
      </div>

      <div className={styles.textBlock}>
        <p className={styles.text}>{(data[`${p}Keywords`] || '').trim() || '—'}</p>
      </div>

      <div className={styles.chips}>
        {CHIP_LABELS.map((lbl, i) => (
          <div key={lbl} className={styles.chipItem}>
            <span
              className={styles.chipDot}
              style={{ background: colors[i] ? colors[i].hex : '#dcdce2' }}
            />
            <span className={styles.chipLbl}>{lbl}</span>
          </div>
        ))}
        <div className={styles.chipItem}>
          <span className={styles.themeChip} style={{ background: accent }} />
          <span className={styles.chipLbl}>테마색</span>
        </div>
      </div>

      <div className={styles.animalRow}>
        <Slot src={data[`${p}Animal`]} t={data[`${p}AnimalT`]} cls={styles.animalBox} label="동물화" region={`${p}Animal`} adminLayout={adminLayout} />
        <div className={styles.animalName}>
          <span className={styles.animalVal}>
            동물화 : {(data[`${p}AnimalName`] || '').trim() || '—'}
          </span>
        </div>
      </div>

      <div className={styles.costumeBox}>
        <p className={styles.costumeHead}>◀ 의상 자료 ▶</p>
        <p className={styles.text}>{(data[`${p}Costume`] || '').trim() || '—'}</p>
        <div className={styles.clothRow}>
          <Slot src={data[`${p}Cloth1`]} t={data[`${p}Cloth1T`]} cls={styles.clothBox} label="디테일1" region={`${p}Cloth1`} adminLayout={adminLayout} />
          <Slot src={data[`${p}Cloth2`]} t={data[`${p}Cloth2T`]} cls={styles.clothBox} label="디테일2" region={`${p}Cloth2`} adminLayout={adminLayout} />
        </div>
      </div>
    </div>
  )
}

function Head({ char, data, p, align }) {
  const c = char || {}
  const h = data[`${p}Height`] || ''
  return (
    <div className={`${styles.topInfo} ${align === 'right' ? styles.topRight : ''}`}>
      <h2 className={styles.tName}>{c.name || '캐릭터'}</h2>
      <p className={styles.tMeta}>
        {c.age?.trim() ? `나이 ${c.age}` : '나이 —'} · {h ? `키 ${h}` : '키 —'}
      </p>
    </div>
  )
}

const FairtlCardFull = forwardRef(function FairtlCardFull(
  {
    characterA,
    characterB,
    data = {},
    adminLayout,
    stickers,
    stickersEditable,
    stickerSelectedId,
    onStickerSelect,
    onStickersChange,
  },
  ref,
) {
  return (
    <div ref={ref} className={styles.card}>
      <div className={styles.top}>
        <Head char={characterA} data={data} p="a" />
        <span className={styles.topMark}>✦ FULL CHARACTER SHEET ✦</span>
        <Head char={characterB} data={data} p="b" align="right" />
      </div>

      <div className={styles.content}>
        <Side char={characterA} p="a" data={data} adminLayout={adminLayout} />

        <div className={styles.center}>
          <Slot src={data.bodyA} t={data.bodyAT} cls={styles.bodyBox} label="전신 A" region="bodyA" adminLayout={adminLayout} />
          <Slot src={data.bodyB} t={data.bodyBT} cls={styles.bodyBox} label="전신 B" region="bodyB" adminLayout={adminLayout} />
        </div>

        <Side char={characterB} p="b" data={data} adminLayout={adminLayout} />
      </div>

      <div className={styles.bottom}>
        <span className={styles.credit}>{(data.credit || '').trim()}</span>
        <span className={styles.mark}>✦ CASKET</span>
      </div>

      <StickerLayer
        stickers={stickers}
        editable={stickersEditable}
        selectedId={stickerSelectedId}
        onSelect={onStickerSelect}
        onChange={onStickersChange}
        cardWidth={1200}
        cardHeight={1800}
      />
    </div>
  )
})

export default FairtlCardFull
