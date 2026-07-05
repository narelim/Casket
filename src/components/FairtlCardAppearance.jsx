import { forwardRef } from 'react'
import styles from './FairtlCardAppearance.module.css'
import StickerLayer from './StickerLayer.jsx'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'

function genderIcon(g) {
  const s = (g || '').trim()
  if (!s) return '•'
  if (/남|male|♂|^m/i.test(s)) return '♂'
  if (/여|female|♀|^f/i.test(s)) return '♀'
  return '⚧'
}

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
  const accent = colors[0]?.hex || '#b9a3ff'
  const appear = data[`${p}Appear`] || ''
  const height = data[`${p}Height`] || ''
  const credit = data[`${p}Credit`] || ''
  const checks = Array.isArray(data[`${p}Checks`]) ? data[`${p}Checks`] : []

  return (
    <div className={styles.side} style={{ '--accent': accent }}>
      <div className={styles.sHeader}>
        <h2 className={styles.sName}>{c.name || '캐릭터'}</h2>
        <span className={styles.gender}>{genderIcon(c.gender)}</span>
        <p className={styles.sMeta}>
          {c.age?.trim() ? `${c.age}` : '나이 —'} · {height ? height : '키 —'}
        </p>
      </div>

      <div className={styles.imgRow}>
        <div className={styles.imgCol}>
          <Slot src={data[`${p}Head`]} t={data[`${p}HeadT`]} cls={styles.headBox} label="두상" region={`${p}Head`} adminLayout={adminLayout} />
          <Slot src={data[`${p}SD`]} t={data[`${p}SDT`]} cls={styles.sdBox} label="SD" region={`${p}SD`} adminLayout={adminLayout} />
        </div>
        <Slot src={data[`${p}Body`]} t={data[`${p}BodyT`]} cls={styles.bodyBox} label="전신" region={`${p}Body`} adminLayout={adminLayout} />
      </div>

      {colors.length > 0 && (
        <div className={styles.chips}>
          {colors.map((col) => (
            <span key={col.id} className={styles.chip} style={{ background: col.hex }} />
          ))}
        </div>
      )}

      <div className={styles.reqBox}>
        <span className={styles.reqTag}>필수</span>
        <p className={styles.reqText}>
          {appear.trim() ? appear : <span className={styles.placeholder}>외관 설명</span>}
        </p>
      </div>

      {checks.length > 0 && (
        <div className={styles.checkList}>
          {checks.map((it) => (
            <div key={it.id} className={styles.checkItem}>
              <span className={styles.checkMark}>{it.done ? '☑' : '☐'}</span>
              <span className={it.done ? styles.checkDone : ''}>{it.text || ''}</span>
            </div>
          ))}
        </div>
      )}

      {credit.trim() && <p className={styles.sCredit}>{credit}</p>}
    </div>
  )
}

const FairtlCardAppearance = forwardRef(function FairtlCardAppearance(
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
      <div className={styles.content}>
        <Side char={characterA} p="a" data={data} adminLayout={adminLayout} />

        <div className={styles.center}>
          <p className={styles.cLabel}>
            {characterA?.name || 'A'} → {characterB?.name || 'B'}
          </p>
          <div className={styles.cBox}>{(data.relAB || '').trim() || '관계 입력'}</div>
          <p className={styles.cLabel}>
            {characterB?.name || 'B'} → {characterA?.name || 'A'}
          </p>
          <div className={styles.cBox}>{(data.relBA || '').trim() || '관계 입력'}</div>
          <p className={styles.cLabel}>RELATION</p>
          <div className={`${styles.cBox} ${styles.cNarr}`}>
            {(data.relNarr || '').trim() || '관계 서사'}
          </div>
        </div>

        <Side char={characterB} p="b" data={data} adminLayout={adminLayout} />
      </div>

      <div className={styles.bottom}>
        <span className={styles.credit}>
          {[data.aCredit, data.bCredit].filter((x) => x && x.trim()).join('  /  ')}
        </span>
        <span className={styles.mark}>✦ CASKET</span>
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

export default FairtlCardAppearance
