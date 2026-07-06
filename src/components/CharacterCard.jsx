import styles from './CharacterCard.module.css'
import { parseTags, formatBirthdayDisplay } from '../lib/character.js'

function fmtDate(ts) {
  const d = ts ? new Date(ts) : new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

export default function CharacterCard({ character }) {
  const tags = parseTags(character.tags)
  const keywords = character.keywords ?? []
  const colors = character.colors ?? []

  const meta = [
    { label: '나이', value: character.age },
    { label: '키', value: character.height && `${character.height} cm` },
    { label: '성별', value: character.gender },
    { label: '생일', value: character.birthday && formatBirthdayDisplay(character.birthday) },
  ].filter((m) => m.value)

  const sections = [
    { label: '외관', value: character.appearance },
    { label: '성격', value: character.personality, keywords },
    ...(character.settings ?? []).map((s) => ({ label: s.category, value: s.content })),
  ].filter((s) => s.value?.trim() || (s.keywords && s.keywords.length > 0))

  const timeline = (character.timeline ?? []).filter(
    (t) => t.period?.trim() || t.title?.trim() || t.content?.trim(),
  )

  const code = (character.id || 'casket').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()

  return (
    <aside className={styles.wrap}>
      <p className={styles.previewLabel}>미리보기</p>

      <article className={styles.receipt}>
        <div className={styles.body}>
          {/* 헤더 */}
          <div className={styles.top}>
            <span className={`${styles.brand} wordmark`}>Casket</span>
            <span className={styles.brandSub}>CHARACTER RECEIPT</span>
          </div>

          {character.mainColor && (
            <div className={styles.mainBar} style={{ background: character.mainColor }} />
          )}

          <h3 className={styles.name}>{character.name || '이름 없음'}</h3>
          {character.alias && <p className={styles.alias}>{character.alias}</p>}

          {meta.length > 0 && (
            <>
              <div className={styles.dash} />
              <div className={styles.rows}>
                {meta.map((m) => (
                  <div key={m.label} className={styles.row}>
                    <span className={styles.k}>{m.label}</span>
                    <span className={styles.leader} />
                    <span className={styles.v}>{m.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {colors.length > 0 && (
            <>
              <div className={styles.dash} />
              <div className={styles.rows}>
                {colors.map((c) => (
                  <div key={c.id} className={styles.row}>
                    <span className={styles.swatchDot} style={{ background: c.hex }} />
                    <span className={styles.k}>{c.name || '색상'}</span>
                    <span className={styles.leader} />
                    <span className={styles.v}>{c.hex.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {(character.tagline || tags.length > 0) && (
            <>
              <div className={styles.dash} />
              {character.tagline && <p className={styles.tagline}>“{character.tagline}”</p>}
              {tags.length > 0 && (
                <p className={styles.tags}>{tags.map((t) => `#${t}`).join('  ')}</p>
              )}
            </>
          )}

          {sections.length > 0 && <div className={styles.dash} />}
          {sections.map((s, i) => (
            <div key={i} className={styles.section}>
              <div className={styles.sectionHeadRow}>
                <p className={styles.sectionLabel}>{s.label}</p>
                {s.keywords && s.keywords.length > 0 && (
                  <span className={styles.kwsInline}>
                    {s.keywords.map((k) => `#${k}`).join(' ')}
                  </span>
                )}
              </div>
              {s.value?.trim() && <p className={styles.sectionText}>{s.value}</p>}
            </div>
          ))}

          {timeline.length > 0 && (
            <>
              <div className={styles.dash} />
              <p className={styles.sectionTitle}>타임라인</p>
              <div className={styles.dash} />
              <ol className={styles.timeline}>
                {timeline.map((t) => (
                  <li key={t.id} className={styles.tlItem}>
                    <span className={`${styles.tlNode} sparkle`} aria-hidden>
                      ✳
                    </span>
                    {t.period?.trim() && <p className={styles.tlPeriod}>{t.period}</p>}
                    {t.title?.trim() && <p className={styles.tlTitle}>{t.title}</p>}
                    {t.content?.trim() && <p className={styles.tlContent}>{t.content}</p>}
                  </li>
                ))}
              </ol>
            </>
          )}

          {/* 영수증 하단 */}
          <div className={styles.dash} />
          <div className={styles.barcode} aria-hidden />
          <p className={styles.code}>
            {code} · {fmtDate(character.createdAt)}
          </p>
          <p className={styles.thanks}>THANK YOU FOR YOUR CHARACTER</p>
        </div>
      </article>
    </aside>
  )
}
