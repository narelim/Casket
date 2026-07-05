import { forwardRef } from 'react'
import styles from './FairtlCardCalendar.module.css'
import StickerLayer from './StickerLayer.jsx'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'
import { contrastText } from '../lib/color.js'

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WD_KO = ['일', '월', '화', '수', '목', '금', '토']
const WD_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function monthGrid(year, month) {
  const first = new Date(year, month - 1, 1).getDay()
  const days = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const FairtlCardCalendar = forwardRef(function FairtlCardCalendar(
  {
    image,
    imageT,
    year,
    month,
    accentColor,
    bgColor,
    lang,
    dateStickers = [],
    cardW = 1080,
    cardH = 1920,
    onDateClick,
    datesEditable,
    adminLayout,
    stickers,
    stickersEditable,
    stickerSelectedId,
    onStickerSelect,
    onStickersChange,
  },
  ref,
) {
  const accent = accentColor || '#b9a3ff'
  const bg = bgColor || '#ffffff'
  const landscape = cardW > cardH
  const cells = monthGrid(year, month)
  const now = new Date()
  const isThisMonth = now.getFullYear() === year && now.getMonth() + 1 === month
  const today = now.getDate()
  const wd = lang === 'en' ? WD_EN : WD_KO
  const monthLabel = lang === 'en' ? EN_MONTHS[month - 1] : `${month}월`
  const dsMap = {}
  dateStickers.forEach((d) => {
    dsMap[d.date] = d.src
  })
  const todayText = contrastText(accent)

  return (
    <div
      ref={ref}
      className={`${styles.card} ${landscape ? styles.landscape : ''}`}
      style={{ width: cardW, height: cardH }}
    >
      <div className={styles.imageArea} data-region="image" data-label="이미지" style={adminTransform(adminLayout, 'image')}>
        {image ? (
          <div className={styles.img} style={{ backgroundImage: `url("${image}")`, transform: fairtlTransform(imageT) }} />
        ) : (
          <div className={styles.imgEmpty}>이미지를 업로드하세요</div>
        )}
      </div>

      <div className={styles.cal} style={{ background: bg }}>
        <div className={styles.monthRow}>
          <span className={styles.monthBig} style={{ color: accent }}>
            {monthLabel}
          </span>
          <span className={styles.monthSub}>
            {year}. {String(month).padStart(2, '0')}
          </span>
        </div>

        <div className={styles.wdRow}>
          {wd.map((w, i) => (
            <span
              key={w}
              className={styles.wdCell}
              style={{ color: i === 0 ? '#e0607a' : accent }}
            >
              {w}
            </span>
          ))}
        </div>

        <div className={styles.grid}>
          {cells.map((d, i) => {
            const isToday = d && isThisMonth && d === today
            const hasImg = d && dsMap[d]
            return (
              <div
                key={i}
                className={`${styles.cell} ${d && datesEditable ? styles.cellEditable : ''}`}
                onClick={d && datesEditable ? () => onDateClick?.(d) : undefined}
              >
                {d && (
                  <span
                    className={`${styles.dayNum} ${isToday ? styles.today : ''}`}
                    style={isToday ? { background: accent, color: todayText } : (i % 7 === 0 ? { color: '#e0607a' } : undefined)}
                  >
                    {d}
                  </span>
                )}
                {hasImg && (
                  <span className={styles.daySticker} style={{ backgroundImage: `url("${dsMap[d]}")` }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <StickerLayer
        stickers={stickers}
        editable={stickersEditable}
        selectedId={stickerSelectedId}
        onSelect={onStickerSelect}
        onChange={onStickersChange}
        cardWidth={cardW}
        cardHeight={cardH}
      />
    </div>
  )
})

export default FairtlCardCalendar
