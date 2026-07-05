import styles from './CharacterCard.module.css'
import { parseTags, formatBirthdayDisplay } from '../lib/character.js'

export default function CharacterCard({ character }) {
  const tags = parseTags(character.tags)
  const colors = character.colors ?? []
  const meta = [
    character.age && `${character.age}`,
    character.gender,
    character.birthday && formatBirthdayDisplay(character.birthday),
  ].filter(Boolean)

  const sections = [
    { label: '외관', value: character.appearance },
    { label: '성격', value: character.personality },
    ...(character.settings ?? []).map((s) => ({ label: s.category, value: s.content })),
  ].filter((s) => s.value?.trim())

  const timeline = (character.timeline ?? []).filter(
    (t) => t.period?.trim() || t.title?.trim() || t.content?.trim(),
  )

  return (
    <aside className={styles.wrap}>
      <p className={styles.previewLabel}>미리보기</p>
      <article className={styles.card}>
        <div className={styles.banner}>
          <span className={styles.avatar}>{(character.name || '?').slice(0, 1)}</span>
        </div>

        <div className={styles.body}>
          <h3 className={styles.name}>{character.name || '이름 없음'}</h3>
          {character.alias && <p className={styles.alias}>“{character.alias}”</p>}

          {meta.length > 0 && (
            <div className={styles.metaRow}>
              {meta.map((m, i) => (
                <span key={i} className={styles.metaItem}>
                  {m}
                </span>
              ))}
            </div>
          )}

          {character.tagline && <p className={styles.tagline}>{character.tagline}</p>}

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
              {colors.map((c) => (
                <span
                  key={c.id}
                  className={styles.swatch}
                  style={{ background: c.hex }}
                  title={[c.name, c.hex.toUpperCase()].filter(Boolean).join(' · ')}
                />
              ))}
            </div>
          )}

          {sections.length > 0 && <div className={styles.divider} />}

          {sections.map((s, i) => (
            <div key={i} className={styles.section}>
              <p className={styles.sectionLabel}>{s.label}</p>
              <p className={styles.sectionText}>{s.value}</p>
            </div>
          ))}

          {timeline.length > 0 && (
            <>
              {(sections.length > 0 || colors.length > 0) && (
                <div className={styles.divider} />
              )}
              <div className={styles.section}>
                <p className={styles.sectionLabel}>타임라인</p>
                <ol className={styles.timeline}>
                  {timeline.map((t) => (
                    <li key={t.id} className={styles.tlItem}>
                      <span className={styles.tlNode} aria-hidden />
                      {t.period?.trim() && <p className={styles.tlPeriod}>{t.period}</p>}
                      {t.title?.trim() && <p className={styles.tlTitle}>{t.title}</p>}
                      {t.content?.trim() && <p className={styles.tlContent}>{t.content}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      </article>
    </aside>
  )
}
