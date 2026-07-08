import { forwardRef } from 'react'
import styles from './FairtlCardReceipt.module.css'
import StickerLayer from './StickerLayer.jsx'
import { parseTags, formatBirthdayDisplay } from '../lib/character.js'
import { tint, shade } from '../lib/color.js'

const FairtlCardReceipt = forwardRef(function FairtlCardReceipt(
  { character, pointColor, data = {}, stickers, stickersEditable, stickerSelectedId, onStickerSelect, onStickersChange },
  ref,
) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = pointColor || c.mainColor || colors[0]?.hex || '#ec6ea0'
  const tags = parseTags(c.tags)
  const keywords = Array.isArray(c.keywords) ? c.keywords : []
  const orderNo = data.orderNo || (c.id || 'CASKET').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
  const dateText = data.dateText || '2026 . 07 . 08'
  const pay = data.pay || 'card'

  const items = [
    { name: 'NAME', value: c.name || '—' },
    { name: 'AGE', value: c.age },
    { name: 'HEIGHT', value: c.height && `${c.height}cm` },
    { name: 'GENDER', value: c.gender },
    { name: 'BIRTHDAY', value: c.birthday && formatBirthdayDisplay(c.birthday) },
    ...tags.map((t) => ({ name: 'TAG', value: `#${t}` })),
    ...keywords.map((k) => ({ name: 'KEYWORD', value: k })),
  ].filter((i) => i.value && String(i.value).trim())

  return (
    <div ref={ref} className={styles.card} style={{ '--accent': accent, '--soft': tint(accent, 0.9), '--deep': shade(accent, 0.35) }}>
      <div className={styles.paper}>
        <h1 className={styles.title}>Receipt</h1>
        <p className={styles.thanks}>THANK YOU FOR YOUR PURCHASE!</p>

        <div className={styles.metaRow}>
          <span>ORDER NO. {orderNo}</span>
          <span>DATE {dateText}</span>
        </div>

        <div className={styles.dash} />
        <div className={styles.thead}>
          <span className={styles.cItem}>ITEM</span>
          <span className={styles.cQty}>QTY</span>
          <span className={styles.cPrice}>DETAIL</span>
        </div>
        <div className={styles.dash} />

        <div className={styles.items}>
          {items.map((it, i) => (
            <div key={i} className={styles.item}>
              <span className={styles.cItem}>{it.name}</span>
              <span className={styles.cQty}>01</span>
              <span className={styles.cPrice}>{it.value}</span>
            </div>
          ))}
        </div>

        <div className={styles.dash} />
        <div className={styles.total}>
          <span>Total :</span>
          <span className={styles.totalVal}>{c.tagline || c.alias || c.name || '♡'}</span>
        </div>
        <div className={styles.dash} />

        <div className={styles.pays}>
          <span className={pay === 'cash' ? styles.payOn : styles.pay}>♡ CASH</span>
          <span className={pay === 'card' ? styles.payOn : styles.pay}>♡ CARD</span>
          <span className={pay === 'ewallet' ? styles.payOn : styles.pay}>♡ E-WALLET</span>
        </div>

        <p className={styles.notify}>UPON ORDER ARRIVAL, NOTIFY ME THROUGH:</p>
        <p className={styles.contact}>{data.contact || '@casket'}</p>

        <div className={styles.barcode} />
        <p className={styles.code}>{orderNo}</p>
      </div>

      <StickerLayer stickers={stickers} editable={stickersEditable} selectedId={stickerSelectedId} onSelect={onStickerSelect} onChange={onStickersChange} />
    </div>
  )
})

export default FairtlCardReceipt
