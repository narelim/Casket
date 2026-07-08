import { useState } from 'react'
import styles from './TemplateSelect.module.css'
import { TEMPLATES, CATEGORIES } from '../lib/templates.js'

const NEW_ICONS = {
  'single-id': '🪪',
  'single-collectible': '🃏',
  'single-gacha': '🎰',
  'single-receipt': '🧾',
  'single-inventory': '🎮',
  'single-themesong': '🎵',
}

// 템플릿 미리보기 스케치 (썸네일 이미지 없을 때) — 비율로 레이아웃 암시
function TemplateThumb({ tpl }) {
  const landscape = tpl.width > tpl.height
  return (
    <div className={`${styles.thumb} ${landscape ? styles.thumbLand : styles.thumbPort}`}>
      {NEW_ICONS[tpl.id] && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: 48,
          }}
        >
          {NEW_ICONS[tpl.id]}
        </span>
      )}
      {tpl.id === 'single-basic' && (
        <div className={styles.sketchBasic}>
          <span className={styles.sBar} />
          <span className={styles.sImg} />
          <span className={styles.sLine} />
          <span className={styles.sLineShort} />
        </div>
      )}
      {tpl.id === 'double-basic' && (
        <div className={styles.sketchDouble}>
          <span className={styles.sCol} />
          <span className={styles.sCol} />
        </div>
      )}
      {tpl.id === 'single-charfile' && (
        <div className={styles.sketchCharfile}>
          <span className={`${styles.sP} ${styles.sSide}`} />
          <span className={styles.sP} />
          <span className={styles.sP} />
          <span className={styles.sP} />
        </div>
      )}
      {tpl.category === '2인용' && tpl.id !== 'double-basic' && (
        <div className={styles.sketchWide}>
          <span className={styles.sCol} />
          <span className={styles.sP} />
          <span className={styles.sCol} />
        </div>
      )}
      {tpl.id === 'calendar' && (
        <div className={styles.sketchCal}>
          <span className={styles.calImg} />
          <span className={styles.calGrid} />
        </div>
      )}
      <span className={styles.thumbRatio}>
        {tpl.width}×{tpl.height}
      </span>
    </div>
  )
}

const ALL = '전체'

export default function TemplateSelect({ current, onPick, onExit }) {
  const [cat, setCat] = useState(ALL)
  const tabs = [ALL, ...CATEGORIES]
  const list = cat === ALL ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat)

  return (
    <div className={styles.screen}>
      <header className={styles.topbar}>
        <button className={styles.back} onClick={onExit}>
          ← 아카이브
        </button>
        <h1 className={styles.title}>페어틀 템플릿 선택</h1>
        <span className={styles.spacer} />
      </header>

      <div className={styles.tabs}>
        {tabs.map((c) => (
          <button
            key={c}
            className={`${styles.tab} ${cat === c ? styles.tabActive : ''}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {cat === ALL && (
        <p className={styles.catHint}>모든 템플릿을 한눈에 볼 수 있어요</p>
      )}

      <div className={styles.grid}>
        {list.map((tpl) => (
          <button
            key={tpl.id}
            className={`${styles.card} ${tpl.comingSoon ? styles.cardSoon : ''} ${
              current === tpl.id ? styles.cardCurrent : ''
            }`}
            onClick={() => !tpl.comingSoon && onPick(tpl.id)}
            disabled={tpl.comingSoon}
          >
            <TemplateThumb tpl={tpl} />
            <div className={styles.cardFoot}>
              <span className={styles.cardName}>{tpl.name}</span>
              {tpl.comingSoon && <span className={styles.badge}>준비중</span>}
              {current === tpl.id && !tpl.comingSoon && <span className={styles.curMark}>현재</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
