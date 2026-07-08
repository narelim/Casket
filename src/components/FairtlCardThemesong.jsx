import { forwardRef } from 'react'
import styles from './FairtlCardThemesong.module.css'
import StickerLayer from './StickerLayer.jsx'
import { fairtlTransform } from '../lib/fairtl.js'
import { adminTransform } from '../lib/admin.js'
import { tint, shade } from '../lib/color.js'

const FairtlCardThemesong = forwardRef(function FairtlCardThemesong(
  { character, pointColor, data = {}, adminLayout, stickers, stickersEditable, stickerSelectedId, onStickerSelect, onStickersChange },
  ref,
) {
  const c = character || {}
  const colors = c.colors ?? []
  const accent = pointColor || c.mainColor || colors[0]?.hex || '#b9a3ff'
  const keywords = Array.isArray(c.keywords) ? c.keywords : []
  const songTitle = data.songTitle || '테마곡 no.1'
  const artist = data.artist || c.name || '이름 없음'
  const album = data.album || c.alias || 'CASKET OST'
  const duration = data.duration || '3:33'
  const lyrics = data.lyrics || c.tagline || ''

  return (
    <div
      ref={ref}
      className={styles.card}
      style={{ '--accent': accent, '--soft': tint(accent, 0.7), '--deep': shade(accent, 0.7), '--deep2': shade(accent, 0.85) }}
    >
      <div className={styles.nowPlaying}>◗ NOW PLAYING</div>

      <div className={styles.artWrap}>
        <div className={styles.art} data-region="photo" data-label="앨범아트" style={adminTransform(adminLayout, 'photo')}>
          {data.illust ? (
            <div className={styles.img} style={{ backgroundImage: `url("${data.illust}")`, transform: fairtlTransform(data.illustT) }} />
          ) : (
            <div className={styles.ph}>ALBUM ART</div>
          )}
        </div>
        <div className={styles.vinyl} />
      </div>

      <div className={styles.meta}>
        <h1 className={styles.song}>{songTitle}</h1>
        <p className={styles.artist}>{artist}</p>
        <p className={styles.album}>{album}</p>
      </div>

      <div className={styles.progress}>
        <div className={styles.bar}>
          <span className={styles.fill} />
          <span className={styles.knob} />
        </div>
        <div className={styles.times}>
          <span>1:11</span>
          <span>{duration}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <span className={styles.ctrl}>⏮</span>
        <span className={styles.play}>▶</span>
        <span className={styles.ctrl}>⏭</span>
      </div>

      {lyrics && (
        <div className={styles.lyricsBox}>
          <p className={styles.lyrics}>{lyrics}</p>
        </div>
      )}

      {keywords.length > 0 && (
        <div className={styles.tags}>
          {keywords.map((k, i) => (
            <span key={i} className={styles.tag}>{k}</span>
          ))}
        </div>
      )}

      <StickerLayer stickers={stickers} editable={stickersEditable} selectedId={stickerSelectedId} onSelect={onStickerSelect} onChange={onStickersChange} />
    </div>
  )
})

export default FairtlCardThemesong
