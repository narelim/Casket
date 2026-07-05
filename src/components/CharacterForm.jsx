import { useState } from 'react'
import styles from './CharacterForm.module.css'
import TimelineEditor from './TimelineEditor.jsx'
import { FIELDS, createColor, createSetting, parseBirthday, formatBirthday } from '../lib/character.js'

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
  const [draft, setDraft] = useState(null) // 색상 추가 중인 임시 값 { hex, name }
  const [catDraft, setCatDraft] = useState(null) // 카테고리 추가 중인 이름 문자열
  const colors = character.colors ?? []
  const settings = character.settings ?? []

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
    <section className={styles.form}>
      <header className={styles.head}>
        <div>
          <h2 className={styles.heading}>{character.name || '이름 없음'}</h2>
          <p className={styles.updated}>편집 중 · 자동 저장됨</p>
        </div>
        <button className={styles.delBtn} onClick={onDelete}>
          삭제
        </button>
      </header>

      <div className={styles.grid}>
        {FIELDS.map((f) => (
          <div
            key={f.key}
            className={`${styles.field} ${f.type === 'textarea' || f.full ? styles.full : ''}`}
          >
            <label className={styles.label} htmlFor={`f-${f.key}`}>
              {f.label}
            </label>
            {f.type === 'birthday' ? (
              <BirthdayField
                id={`f-${f.key}`}
                value={character[f.key] ?? ''}
                onChange={(v) => update(f.key, v)}
              />
            ) : f.type === 'textarea' ? (
              <textarea
                id={`f-${f.key}`}
                className={styles.textarea}
                value={character[f.key] ?? ''}
                placeholder={f.placeholder}
                rows={4}
                onChange={(e) => update(f.key, e.target.value)}
              />
            ) : (
              <input
                id={`f-${f.key}`}
                className={styles.input}
                type="text"
                value={character[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => update(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <section className={styles.settings}>
        <div className={styles.settingsHead}>
          <span className={styles.label}>설정 / 배경</span>
          {catDraft === null && (
            <button type="button" className={styles.addColorBtn} onClick={() => setCatDraft('')}>
              + 카테고리 추가
            </button>
          )}
        </div>

        {catDraft !== null && (
          <div className={styles.catDraftRow}>
            <input
              className={styles.draftName}
              type="text"
              autoFocus
              value={catDraft}
              placeholder="카테고리 이름 (예: 좋아하는 음악)"
              onChange={(e) => setCatDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddCategory()
                if (e.key === 'Escape') setCatDraft(null)
              }}
            />
            <button type="button" className={styles.draftAdd} onClick={confirmAddCategory}>
              추가
            </button>
            <button type="button" className={styles.draftCancel} onClick={() => setCatDraft(null)}>
              취소
            </button>
          </div>
        )}

        {settings.length === 0 && catDraft === null ? (
          <p className={styles.paletteEmpty}>카테고리가 없습니다 · 추가해보세요</p>
        ) : (
          <div className={styles.catList}>
            {settings.map((s) => (
              <div key={s.id} className={styles.catBlock}>
                <div className={styles.catHead}>
                  <span className={styles.catName}>{s.category}</span>
                  <button
                    type="button"
                    className={styles.catDel}
                    onClick={() => removeSetting(s.id)}
                  >
                    삭제
                  </button>
                </div>
                <textarea
                  className={styles.textarea}
                  value={s.content}
                  placeholder={`${s.category}에 대해 적어보세요`}
                  rows={3}
                  onChange={(e) => updateSetting(s.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.settings}>
        <TimelineEditor
          timeline={character.timeline ?? []}
          onChange={(tl) => onChange({ timeline: tl })}
        />
      </section>

      <section className={styles.palette}>
        <div className={styles.paletteHead}>
          <span className={styles.label}>컬러 팔레트</span>
          {!draft && (
            <button type="button" className={styles.addColorBtn} onClick={startAddColor}>
              + 색상 추가
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
              type="text"
              autoFocus
              value={draft.name}
              placeholder="색 이름 (예: 머리카락)"
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAddColor()
                if (e.key === 'Escape') setDraft(null)
              }}
            />
            <span className={styles.draftHex}>{draft.hex.toUpperCase()}</span>
            <button type="button" className={styles.draftAdd} onClick={confirmAddColor}>
              추가
            </button>
            <button type="button" className={styles.draftCancel} onClick={() => setDraft(null)}>
              취소
            </button>
          </div>
        )}

        {colors.length > 0 ? (
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
          </div>
        ) : (
          !draft && <p className={styles.paletteEmpty}>아직 색상이 없습니다</p>
        )}
      </section>
    </section>
  )
}
