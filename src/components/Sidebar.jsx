import { useMemo } from 'react'
import styles from './Sidebar.module.css'
import { parseTags } from '../lib/character.js'

export default function Sidebar({
  characters,
  selectedId,
  query,
  onQuery,
  onSelect,
  onAdd,
  onDelete,
  onExport,
  onImport,
  onOpenFairtl,
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((c) => {
      const hay = [c.name, c.alias, c.tagline, c.tags].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [characters, query])

  return (
    <aside className={styles.sidebar}>
      <header className={styles.brand}>
        <span className={styles.logo}>✦</span>
        <div>
          <h1 className={styles.title}>Casket</h1>
          <p className={styles.subtitle}>자캐 아카이브</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <button className={styles.addBtn} onClick={onAdd}>
          + 새 캐릭터
        </button>
      </div>

      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="이름 · 별칭 · 태그 검색"
        />
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <p className={styles.emptyList}>
            {characters.length === 0 ? '아직 캐릭터가 없습니다' : '검색 결과가 없습니다'}
          </p>
        ) : (
          filtered.map((c) => {
            const tags = parseTags(c.tags)
            return (
              <button
                key={c.id}
                className={`${styles.item} ${c.id === selectedId ? styles.active : ''}`}
                onClick={() => onSelect(c.id)}
              >
                <span className={styles.avatar}>{(c.name || '?').slice(0, 1)}</span>
                <span className={styles.itemBody}>
                  <span className={styles.itemName}>{c.name || '이름 없음'}</span>
                  <span className={styles.itemMeta}>
                    {c.alias || tags[0] || c.tagline || ' '}
                  </span>
                </span>
                <span
                  className={styles.del}
                  role="button"
                  tabIndex={-1}
                  title="삭제"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(c.id)
                  }}
                >
                  ✕
                </span>
              </button>
            )
          })
        )}
      </div>

      <div className={styles.fairtlWrap}>
        <button className={styles.fairtlBtn} onClick={onOpenFairtl}>
          ✦ 페어틀 만들기
        </button>
      </div>

      <footer className={styles.footer}>
        <button className={styles.ghost} onClick={onImport}>
          불러오기
        </button>
        <button className={styles.ghost} onClick={onExport}>
          내보내기
        </button>
        <span className={styles.count}>{characters.length}</span>
      </footer>
    </aside>
  )
}
