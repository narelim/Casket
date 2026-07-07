import { useEffect, useRef, useState } from 'react'
import styles from './CharacterForm.module.css'
import TimelineEditor from './TimelineEditor.jsx'
import AutoTextarea from './AutoTextarea.jsx'
import { createColor, createSetting, parseBirthday, formatBirthday } from '../lib/character.js'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function BirthdayField({ id, value, onChange }) {
  const { month, day, legacy } = parseBirthday(value)
  return (
    <div className={styles.birthday}>
      <div className={styles.bdRow}>
        <select
          id={id}
          className={styles.bdSelect}
          value={month}
          onChange={(e) => onChange(formatBirthday(e.target.value, day))}
        >
          <option value="">??</option>
          {MONTHS.map((m) => (
            <option key={m} value={String(m)}>
              {m}월
            </option>
          ))}
        </select>
        <span className={styles.bdSlash}>/</span>
        <select
          className={styles.bdSelect}
          value={day}
          onChange={(e) => onChange(formatBirthday(month, e.target.value))}
        >
          <option value="">??</option>
          {DAYS.map((d) => (
            <option key={d} value={String(d)}>
              {d}일
            </option>
          ))}
        </select>
      </div>
      {legacy && <span className={styles.bdLegacy}>기존 값 “{legacy}” · 선택 시 대체됩니다</span>}
    </div>
  )
}

export default function CharacterForm({ character, onChange, onDelete, onToast }) {
  const [draft, setDraft] = useState(null) // 색상 추가 중 { hex, name }
  const [catDraft, setCatDraft] = useState(null) // 카테고리 이름 문자열
  const [kwDraft, setKwDraft] = useState(null) // 키워드 문자열
  const [saved, setSaved] = useState(true) // true=자동 저장됨 / false=편집 중
  const savedTimer = useRef(null)
  const lastUpdated = useRef(character.updatedAt)
  const colors = character.colors ?? []
  const settings = character.settings ?? []
  const keywords = character.keywords ?? []

  // updatedAt 이 실제로 바뀔 때만 '편집 중' → 잠시 뒤 '자동 저장됨'
  // (값 비교라 StrictMode 이중 실행에도 오작동하지 않음. 저장은 App에서 즉시 수행됨)
  useEffect(() => {
    if (character.updatedAt === lastUpdated.current) return
    lastUpdated.current = character.updatedAt
    setSaved(false)
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(true), 900)
    return () => clearTimeout(savedTimer.current)
  }, [character.updatedAt])

  function update(key, value) {
    onChange({ [key]: value })
  }

  function startAddColor() {
    setDraft({ hex: '#b9a3ff', name: '' })
  }
  function confirmAddColor() {
    onChange({ colors: [...colors, createColor({ hex: draft.hex, name: draft.name.trim() })] })
    setDraft(null)
  }
  function removeColor(id) {
    onChange({ colors: colors.filter((c) => c.id !== id) })
  }
  async function copyHex(hex) {
    try {
      await navigator.clipboard.writeText(hex)
      onToast?.(`${hex} 복사됨`)
    } catch {
      onToast?.('복사할 수 없습니다')
    }
  }

  function confirmAddKeyword() {
    const k = (kwDraft || '').trim()
    if (k && !keywords.includes(k)) onChange({ keywords: [...keywords, k] })
    setKwDraft(null)
  }
  function removeKeyword(k) {
    onChange({ keywords: keywords.filter((x) => x !== k) })
  }

  function updateSetting(id, content) {
    onChange({ settings: settings.map((s) => (s.id === id ? { ...s, content } : s)) })
  }
  function removeSetting(id) {
    onChange({ settings: settings.filter((s) => s.id !== id) })
  }
  function confirmAddCategory() {
    const name = (catDraft || '').trim()
    if (!name) {
      setCatDraft(null)
      return
    }
    onChange({ settings: [...settings, createSetting({ category: name })] })
    setCatDraft(null)
  }

  return (
    <section className={styles.sheet}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.heading}>{character.name || '이름 없음'}</h2>
          <p className={styles.updated}>
            {saved ? '자동 저장됨' : '편집 중'}{' '}
            <span className={`sparkle ${styles.spark} ${saved ? '' : styles.spinning}`}>✦</span>
          </p>
        </div>
        <button className={styles.delBtn} onClick={onDelete}>
          캐릭터 삭제
        </button>
      </header>

      {/* 이름 · 별칭 · 대표색 */}
      <div className={styles.rowIdentity}>
        <label className={`${styles.field} ${styles.idName}`}>
          <span className={styles.inlineLabel}>이름</span>
          <input
            className={styles.input}
            value={character.name ?? ''}
            placeholder="캐릭터 이름"
            onChange={(e) => update('name', e.target.value)}
          />
        </label>
        <label className={`${styles.field} ${styles.idAlias}`}>
          <span className={styles.inlineLabel}>별칭</span>
          <input
            className={styles.input}
            value={character.alias ?? ''}
            placeholder="닉네임 · 이명"
            onChange={(e) => update('alias', e.target.value)}
          />
        </label>
        <div className={styles.mainColorField}>
          <span className={styles.inlineLabel}>대표색</span>
          <label
            className={styles.mainSwatch}
            style={{ background: character.mainColor || 'transparent' }}
            title={character.mainColor ? character.mainColor.toUpperCase() : '대표색 선택'}
          >
            <input
              type="color"
              value={character.mainColor || '#b9a3ff'}
              onChange={(e) => update('mainColor', e.target.value)}
            />
            {!character.mainColor && <span className={styles.swatchHint}>+</span>}
          </label>
        </div>
      </div>

      {/* 나이 · 성별 · 키 · 한줄소개 */}
      <div className={styles.rowStats}>
        <label className={`${styles.field} ${styles.short}`}>
          <span className={styles.inlineLabel}>나이</span>
          <input
            className={styles.input}
            value={character.age ?? ''}
            placeholder="19"
            onChange={(e) => update('age', e.target.value)}
          />
        </label>
        <label className={`${styles.field} ${styles.short}`}>
          <span className={styles.inlineLabel}>성별</span>
          <input
            className={styles.input}
            value={character.gender ?? ''}
            placeholder="여성"
            onChange={(e) => update('gender', e.target.value)}
          />
        </label>
        <label className={`${styles.field} ${styles.short}`}>
          <span className={styles.inlineLabel}>키</span>
          <span className={styles.withSuffix}>
            <input
              className={styles.input}
              value={character.height ?? ''}
              placeholder="172"
              onChange={(e) => update('height', e.target.value)}
            />
            <span className={styles.suffix}>cm</span>
          </span>
        </label>
        <label className={`${styles.field} ${styles.grow2}`}>
          <span className={styles.inlineLabel}>한줄소개</span>
          <input
            className={styles.input}
            value={character.tagline ?? ''}
            placeholder="한 문장으로 표현한다면"
            onChange={(e) => update('tagline', e.target.value)}
          />
        </label>
      </div>

      {/* 생일 · 태그 */}
      <div className={styles.rowBirthTag}>
        <label className={`${styles.field} ${styles.bdField}`}>
          <span className={styles.inlineLabel}>생일</span>
          <BirthdayField
            id="f-birthday"
            value={character.birthday ?? ''}
            onChange={(v) => update('birthday', v)}
          />
        </label>
        <label className={`${styles.field} ${styles.grow2}`}>
          <span className={styles.inlineLabel}>태그</span>
          <input
            className={styles.input}
            value={character.tags ?? ''}
            placeholder="쉼표로 구분 (예: 마법사, 츤데레)"
            onChange={(e) => update('tags', e.target.value)}
          />
        </label>
      </div>

      {/* 외관 설명 · 컬러 팔레트 */}
      <div className={styles.twoCol}>
        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>외관 설명</span>
          </div>
          <AutoTextarea
            className={styles.textarea}
            value={character.appearance ?? ''}
            placeholder="머리/눈 색, 체형, 복장 등"
            onChange={(e) => update('appearance', e.target.value)}
          />
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>컬러 팔레트</span>
          </div>

          <div className={styles.chips}>
            {colors.map((c) => (
              <div key={c.id} className={styles.chipWrap}>
                <button
                  type="button"
                  className={styles.chip}
                  style={{ background: c.hex }}
                  onClick={() => copyHex(c.hex)}
                  aria-label={`${c.name || c.hex} 복사`}
                />
                <button
                  type="button"
                  className={styles.chipDel}
                  title="삭제"
                  onClick={() => removeColor(c.id)}
                >
                  ✕
                </button>
                <span className={styles.chipTip}>
                  {c.name && <strong>{c.name}</strong>}
                  <em>{c.hex.toUpperCase()}</em>
                </span>
              </div>
            ))}
            {!draft && (
              <button
                type="button"
                className={styles.addSquare}
                onClick={startAddColor}
                title="색상 추가"
                aria-label="색상 추가"
              >
                +
              </button>
            )}
          </div>

          {draft && (
            <div className={styles.draftRow}>
              <label className={styles.swatchPick} style={{ background: draft.hex }}>
                <input
                  type="color"
                  value={draft.hex}
                  onChange={(e) => setDraft((d) => ({ ...d, hex: e.target.value }))}
                />
              </label>
              <input
                className={styles.draftName}
                autoFocus
                value={draft.name}
                placeholder="색 이름 (예: 머리카락)"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAddColor()
                  if (e.key === 'Escape') setDraft(null)
                }}
              />
              <button
                type="button"
                className={styles.draftAdd}
                onClick={confirmAddColor}
                title="추가"
                aria-label="추가"
              >
                ✓
              </button>
              <button
                type="button"
                className={styles.draftCancel}
                onClick={() => setDraft(null)}
                title="취소"
                aria-label="취소"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 성격 · 키워드 */}
      <div className={styles.twoCol}>
        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>성격</span>
          </div>
          <AutoTextarea
            className={styles.textarea}
            value={character.personality ?? ''}
            placeholder="성격, 말투, 습관 등"
            onChange={(e) => update('personality', e.target.value)}
          />
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>키워드</span>
          </div>

          <div className={styles.kwList}>
            {keywords.map((k) => (
              <span key={k} className={styles.kw}>
                {k}
                <button
                  type="button"
                  className={styles.kwDel}
                  title="삭제"
                  onClick={() => removeKeyword(k)}
                >
                  ✕
                </button>
              </span>
            ))}
            {kwDraft === null && (
              <button
                type="button"
                className={styles.addSquare}
                onClick={() => setKwDraft('')}
                title="키워드 추가"
                aria-label="키워드 추가"
              >
                +
              </button>
            )}
          </div>

          {kwDraft !== null && (
            <div className={styles.draftRow}>
              <input
                className={styles.draftName}
                autoFocus
                value={kwDraft}
                placeholder="키워드 (예: 다정함)"
                onChange={(e) => setKwDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAddKeyword()
                  if (e.key === 'Escape') setKwDraft(null)
                }}
              />
              <button
                type="button"
                className={styles.draftAdd}
                onClick={confirmAddKeyword}
                title="추가"
                aria-label="추가"
              >
                ✓
              </button>
              <button
                type="button"
                className={styles.draftCancel}
                onClick={() => setKwDraft(null)}
                title="취소"
                aria-label="취소"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 설정 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>설정</span>
        </div>

        {settings.length > 0 && (
          <div className={styles.catList}>
            {settings.map((s) => (
              <div key={s.id} className={styles.catRow}>
                <span className={styles.catName}>{s.category}</span>
                <AutoTextarea
                  className={`${styles.textarea} ${styles.catText}`}
                  value={s.content}
                  placeholder={`${s.category}에 대해 적어보세요`}
                  onChange={(e) => updateSetting(s.id, e.target.value)}
                />
                <button
                  type="button"
                  className={styles.catDel}
                  onClick={() => removeSetting(s.id)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        {catDraft !== null ? (
          <div className={`${styles.draftRow} ${settings.length > 0 ? styles.draftRowGap : ''}`}>
            <input
              className={styles.draftName}
              autoFocus
              value={catDraft}
              placeholder="카테고리 이름 (예: 좋아하는 음악)"
              onChange={(e) => setCatDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddCategory()
                if (e.key === 'Escape') setCatDraft(null)
              }}
            />
            <button
              type="button"
              className={styles.draftAdd}
              onClick={confirmAddCategory}
              title="추가"
              aria-label="추가"
            >
              ✓
            </button>
            <button
              type="button"
              className={styles.draftCancel}
              onClick={() => setCatDraft(null)}
              title="취소"
              aria-label="취소"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.addBar} ${settings.length > 0 ? styles.addBarGap : ''}`}
            onClick={() => setCatDraft('')}
          >
            + 카테고리 추가
          </button>
        )}
      </section>

      {/* 타임라인 */}
      <section className={styles.section}>
        <TimelineEditor
          timeline={character.timeline ?? []}
          onChange={(tl) => onChange({ timeline: tl })}
        />
      </section>

      <footer className={styles.sheetFooter}>
        <span className="wordmark">Casket</span>
      </footer>
    </section>
  )
}
