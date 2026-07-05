import { forwardRef, useRef } from 'react'
import styles from './FairtlCardReference.module.css'
import StickerLayer from './StickerLayer.jsx'
import { fairtlTransform } from '../lib/fairtl.js'
import { genHarmony, tint, shade } from '../lib/color.js'

// 드래그/리사이즈 가능한 창 크롬
function Win({ title, accent, mint, pos, editable, onChange, children, bodyStyle }) {
  const rootRef = useRef(null)
  function scale() {
    const r = rootRef.current?.getBoundingClientRect()
    return r && pos.width ? r.width / pos.width : 1
  }
  function startMove(e) {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    const sc = scale()
    const sx = e.clientX
    const sy = e.clientY
    const ol = pos.left
    const ot = pos.top
    function mv(ev) {
      onChange?.({ left: Math.round(ol + (ev.clientX - sx) / sc), top: Math.round(ot + (ev.clientY - sy) / sc) })
    }
    function up() {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }
  function startResize(e) {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    const sc = scale()
    const sx = e.clientX
    const sy = e.clientY
    const ow = pos.width
    const oh = pos.height
    function mv(ev) {
      onChange?.({
        width: Math.max(80, Math.round(ow + (ev.clientX - sx) / sc)),
        height: Math.max(60, Math.round(oh + (ev.clientY - sy) / sc)),
      })
    }
    function up() {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }
  const tbStyle =
    !mint && accent ? { background: tint(accent, 0.45), borderBottomColor: tint(accent, 0.2) } : undefined
  const tnStyle = accent && !mint ? { color: shade(accent, 0.45) } : undefined
  return (
    <div
      ref={rootRef}
      className={`${styles.win} ${mint ? styles.mint : ''} ${editable ? styles.editing : ''}`}
      style={{ left: pos.left, top: pos.top, width: pos.width, height: pos.height, zIndex: pos.zIndex }}
    >
      <div className={styles.tbar} style={tbStyle} onPointerDown={startMove}>
        <span className={styles.tname} style={tnStyle}>
          {title}
        </span>
        <span className={styles.tbtns}>
          <span className={styles.tb}>–</span>
          <span className={styles.tb}>▢</span>
          <span className={`${styles.tb} ${styles.tbClose}`}>✕</span>
        </span>
      </div>
      <div className={styles.wbody} style={bodyStyle}>
        {children}
      </div>
      {editable && <span className={styles.resize} onPointerDown={startResize} />}
    </div>
  )
}

function patternBg(pattern, line) {
  switch (pattern) {
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }
    case 'dot':
      return { backgroundImage: `radial-gradient(${line} 2px, transparent 2.5px)`, backgroundSize: '34px 34px' }
    case 'line':
      return { backgroundImage: `linear-gradient(${line} 1px, transparent 1px)`, backgroundSize: '100% 42px' }
    default:
      return {}
  }
}

const POS = {
  paint: { left: 504, top: 76, width: 592, height: 848 },
  win1: { left: 16, top: 26, width: 300, height: 278 },
  // 왼쪽 두번째 이미지 창 — Paint 위로
  win2: { left: 304, top: 116, width: 210, height: 208, zIndex: 6 },
  npA: { left: 158, top: 258, width: 226, height: 168 },
  // 아이콘 위 이미지 창 — 그 외 특징(탐색기) 위로
  win3: { left: 6, top: 300, width: 148, height: 206, zIndex: 6 },
  expA: { left: 6, top: 508, width: 316, height: 240 },
  win4: { left: 1272, top: 26, width: 304, height: 272 },
  // 우측 아이콘 위 이미지 창 — 탐색기 위로
  win5: { left: 1446, top: 330, width: 142, height: 212, zIndex: 6 },
  npB: { left: 1032, top: 300, width: 300, height: 150 },
  win6: { left: 1118, top: 738, width: 214, height: 202 },
  expB: { left: 1216, top: 548, width: 368, height: 206 },
}
const ICON_POS = {
  iconA: { left: 12, top: 824 },
  iconB: { left: 1492, top: 824 },
}

const FairtlCardReference = forwardRef(function FairtlCardReference(
  {
    characterA,
    characterB,
    data = {},
    layout = {},
    layoutEditable,
    onLayoutChange,
    stickers,
    stickersEditable,
    stickerSelectedId,
    onStickerSelect,
    onStickersChange,
  },
  ref,
) {
  const a = characterA || {}
  const b = characterB || {}
  const aColor = a.colors?.[0]?.hex || '#9ec9c0'
  const bColor = b.colors?.[0]?.hex || '#b9a3ff'
  const credits = Array.isArray(data.credits) ? data.credits.filter((c) => c && c.trim()) : []
  const harmA = genHarmony(a.colors, 8)
  const harmB = genHarmony(b.colors, 8)
  const aTraits = (data.aTraits || '').split('\n').filter((x) => x.trim())
  const bTraits = (data.bTraits || '').split('\n').filter((x) => x.trim())

  const gradFrom = data.nameGradFrom || aColor
  const gradTo = data.nameGradTo || bColor
  const nameFont = data.nameFont || "'Playfair Display', 'Noto Sans KR', serif"
  const gradStyle = {
    backgroundImage: `linear-gradient(100deg, ${gradFrom}, ${gradTo})`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: gradFrom,
  }

  let bgStyle = { background: data.bgColor || '#fdfdff' }
  if (data.bgMode === 'image' && data.bgImage) {
    bgStyle = { backgroundImage: `url("${data.bgImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
  } else if (data.bgMode === 'pattern' && data.bgPattern && data.bgPattern !== 'plain') {
    bgStyle = { background: data.bgColor || '#f4f6f9', ...patternBg(data.bgPattern, 'rgba(120,130,150,0.18)') }
  }

  const lay = (id) => ({ ...POS[id], ...(layout[id] || {}) })
  const winProps = (id) => ({
    pos: lay(id),
    editable: layoutEditable,
    onChange: (p) => onLayoutChange?.(id, p),
  })

  const ImgWin = ({ id, src, t }) => (
    <Win {...winProps(id)} mint title="" bodyStyle={{ padding: 0 }}>
      {src ? (
        <div className={styles.wimg} style={{ backgroundImage: `url("${src}")`, transform: fairtlTransform(t) }} />
      ) : (
        <div className={styles.wimgEmpty}>이미지</div>
      )}
    </Win>
  )

  const Explorer = ({ id, name, traits, accent }) => (
    <Win {...winProps(id)} accent={accent} title={`${name} ▸ 그 외 특징`} bodyStyle={{ padding: 0 }}>
      <div className={styles.expList}>
        {(traits.length ? traits : ['그 외 특징']).map((t, i) => (
          <div key={i} className={styles.expRow}>
            <span className={styles.expIcon} />
            {t}
          </div>
        ))}
      </div>
    </Win>
  )

  const Notepad = ({ id, alias, text, keywords, accent }) => {
    const kws = (Array.isArray(keywords) ? keywords : []).filter((k) => k && k.trim()).slice(0, 3)
    return (
      <Win {...winProps(id)} accent={accent} title={`${alias || '애칭'}_외관`} bodyStyle={{ padding: 0 }}>
        <div className={styles.npKw}>
          {kws.length ? (
            kws.map((k, i) => (
              <span key={i} className={styles.npTag}>
                #{k}
              </span>
            ))
          ) : (
            <span className={styles.npTagEmpty}>#키워드</span>
          )}
        </div>
        <div className={styles.npText}>{text || ''}</div>
      </Win>
    )
  }

  const Icon = ({ id, src, t, name }) => {
    const rootRef = useRef(null)
    const p = { ...ICON_POS[id], ...(layout[id] || {}) }
    function startMove(e) {
      if (!layoutEditable) return
      e.preventDefault()
      e.stopPropagation()
      const r = rootRef.current?.getBoundingClientRect()
      const sc = r ? r.width / 96 : 1
      const sx = e.clientX
      const sy = e.clientY
      const ol = p.left
      const ot = p.top
      function mv(ev) {
        onLayoutChange?.(id, { left: Math.round(ol + (ev.clientX - sx) / sc), top: Math.round(ot + (ev.clientY - sy) / sc) })
      }
      function up() {
        window.removeEventListener('pointermove', mv)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', mv)
      window.addEventListener('pointerup', up)
    }
    return (
      <div
        ref={rootRef}
        className={`${styles.icon} ${layoutEditable ? styles.iconEditing : ''}`}
        style={{ left: p.left, top: p.top }}
        onPointerDown={startMove}
      >
        <div className={styles.iconBox}>
          {src ? (
            <div className={styles.iconImg} style={{ backgroundImage: `url("${src}")`, transform: fairtlTransform(t) }} />
          ) : (
            <div className={styles.iconDash} />
          )}
        </div>
        <span className={styles.iconName}>{name}</span>
      </div>
    )
  }

  return (
    <div ref={ref} className={styles.card}>
      <div className={styles.bg} style={bgStyle} />

      <ImgWin id="win1" src={data.win1} t={data.win1T} />
      <ImgWin id="win2" src={data.win2} t={data.win2T} />
      <ImgWin id="win3" src={data.win3} t={data.win3T} />
      <ImgWin id="win4" src={data.win4} t={data.win4T} />
      <ImgWin id="win5" src={data.win5} t={data.win5T} />
      <ImgWin id="win6" src={data.win6} t={data.win6T} />

      <Win {...winProps('paint')} title={data.pairName?.trim() ? data.pairName : '페어명'} bodyStyle={{ padding: 0 }}>
        <div className={styles.paintInner}>
          <div className={styles.paintCanvas}>
            <div className={styles.names} style={{ fontFamily: nameFont, opacity: data.nameOpacity ?? 1 }}>
              <div className={styles.nameA}>
                <span className={styles.bigName} style={gradStyle}>
                  {a.name || '캐릭터 A'}
                </span>
                {a.alias && <span className={styles.subName}>{a.alias}</span>}
              </div>
              <span className={styles.times} style={gradStyle}>
                ×
              </span>
              <div className={styles.nameB}>
                <span className={styles.bigName} style={gradStyle}>
                  {b.name || '캐릭터 B'}
                </span>
                {b.alias && <span className={styles.subName}>{b.alias}</span>}
              </div>
            </div>
          </div>
          <div className={styles.paintBottom}>
            <div className={styles.palette}>
              <div className={styles.palRow}>
                {harmA.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </div>
              <div className={styles.palRow}>
                {harmB.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className={styles.relBox}>{data.relation?.trim() ? data.relation : '관계 설명란'}</div>
          </div>
        </div>
      </Win>

      <Notepad id="npA" alias={a.alias} text={data.aAppear} keywords={data.aKeywords} accent={aColor} />
      <Notepad id="npB" alias={b.alias} text={data.bAppear} keywords={data.bKeywords} accent={bColor} />

      <Explorer id="expA" name={a.name || '캐릭터 A'} traits={aTraits} accent={aColor} />
      <Explorer id="expB" name={b.name || '캐릭터 B'} traits={bTraits} accent={bColor} />

      <Icon id="iconA" src={data.aIcon} t={data.aIconT} name={a.name || '캐릭터 A'} />
      <Icon id="iconB" src={data.bIcon} t={data.bIconT} name={b.name || '캐릭터 B'} />

      {credits.length > 0 && (
        <>
          <div className={styles.ctx} style={{ left: 336, bottom: 132, width: 150 }}>
            {credits.map((c, i) => (
              <div key={i} className={styles.ctxRow}>
                {c}
              </div>
            ))}
          </div>
          <svg className={styles.cursor} style={{ left: 308, bottom: 120 }} viewBox="0 0 24 24" width="34" height="34">
            <path d="M3 2 L3 20 L8 15 L11 22 L14 21 L11 14 L18 14 Z" fill="#fff" stroke="#222" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </>
      )}

      <div className={styles.taskbar} style={{ background: `linear-gradient(90deg, ${aColor}, ${bColor})` }}>
        <span className={styles.startBtn}>◐</span>
        <span className={styles.taskCredit}>✦ CASKET</span>
        <span className={styles.anniv}>{data.annivText?.trim() ? data.annivText : 'YYYY / MM / DD'}</span>
      </div>

      <StickerLayer
        stickers={stickers}
        editable={stickersEditable}
        selectedId={stickerSelectedId}
        onSelect={onStickerSelect}
        onChange={onStickersChange}
        cardWidth={1600}
        cardHeight={1000}
      />
    </div>
  )
})

export default FairtlCardReference
