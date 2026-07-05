import { useState } from 'react'
import styles from './CharacterForm.module.css'
import TimelineEditor from './TimelineEditor.jsx'
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
  const colors = character.colors ?? []
  const settings = character.settings ?? []
  const keywords = character.keywords ?? []

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
            편집 중 <span className="sparkle">✦</span> 자동 저장됨
          </p>
        </div>
        <button className={styles.delBtn} onClick={onDelete}>
          캐릭터 삭제
        </button>
      </header>

      {/* 이름 · 별칭 · 대표색 */}
      <div className={styles.rowIdentity}>
        <label className={`${styles.field} ${styles.grow2}`}>
          <span className={styles.inlineLabel}>이름</span>
          <input
            className={styles.input}
            value={character.name ?? ''}
            placeholder="캐릭터 이름"
            onChange={(e) => update('name', e.target.value)}
          />
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
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
        <label className={styles.field}>
          <span className={styles.inlineLabel}>생일</span>
          <BirthdayField
            id="f-birthday"
            value={character.birthday ?? ''}
            onChange={(v) => update('birthday', v)}
          />
        </label>
        <label className={`${styles.field} ${styles.grow}`}>
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
          <textarea
            className={styles.textarea}
            value={character.appearance ?? ''}
            placeholder="머리/눈 색, 체형, 복장 등"
            rows={7}
            onChange={(e) => update('appearance', e.target.value)}
          />
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>컬러 팔레트</span>
            {!draft && (
              <button type="button" className={styles.ghostBtn} onClick={startAddColor}>
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
            !draft && <p className={styles.hint}>아직 색상이 없습니다</p>
          )}
        </div>
      </div>

      {/* 성격 · 키워드 */}
      <div className={styles.twoCol}>
        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>성격</span>
          </div>
          <textarea
            className={styles.textarea}
            value={character.personality ?? ''}
            placeholder="성격, 말투, 습관 등"
            rows={7}
            onChange={(e) => update('personality', e.target.value)}
          />
        </div>

        <div className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockLabel}>키워드</span>
            {kwDraft === null && (
              <button type="button" className={styles.ghostBtn} onClick={() => setKwDraft('')}>
                + 키워드 추가
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
              <button type="button" className={styles.draftAdd} onClick={confirmAddKeyword}>
                추가
              </button>
              <button type="button" className={styles.draftCancel} onClick={() => setKwDraft(null)}>
                취소
              </button>
            </div>
          )}

          {keywords.length > 0 ? (
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
            </div>
          ) : (
            kwDraft === null && <p className={styles.hint}>아직 키워드가 없습니다</p>
          )}
        </div>
      </div>

      {/* 설정 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>설정</span>
          {catDraft === null && (
            <button type="button" className={styles.ghostBtn} onClick={() => setCatDraft('')}>
              + 카테고리 추가
            </button>
          )}
        </div>

        {catDraft !== null && (
          <div className={styles.draftRow}>
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
            <button type="button" className={styles.draftAdd} onClick={confirmAddCategory}>
              추가
            </button>
            <button type="button" className={styles.draftCancel} onClick={() => setCatDraft(null)}>
              취소
            </button>
          </div>
        )}

        {settings.length === 0 && catDraft === null ? (
          <p className={styles.hint}>카테고리가 없습니다 · 추가해보세요</p>
        ) : (
          <div className={styles.catList}>
            {settings.map((s) => (
              <div key={s.id} className={styles.catRow}>
                <span className={styles.catName}>{s.category}</span>
                <textarea
                  className={`${styles.textarea} ${styles.catText}`}
                  value={s.content}
                  placeholder={`${s.category}에 대해 적어보세요`}
                  rows={2}
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
