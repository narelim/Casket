import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import styles from './FairtlEditor.module.css'
import FairtlCard from './FairtlCard.jsx'
import FairtlCard2p from './FairtlCard2p.jsx'
import FairtlCardCharFile from './FairtlCardCharFile.jsx'
import FairtlCardAppearance from './FairtlCardAppearance.jsx'
import FairtlCardReference from './FairtlCardReference.jsx'
import FairtlCardFull from './FairtlCardFull.jsx'
import FairtlCardCalendar from './FairtlCardCalendar.jsx'
import FairtlCardId from './FairtlCardId.jsx'
import FairtlCardCollectible from './FairtlCardCollectible.jsx'
import FairtlCardGacha from './FairtlCardGacha.jsx'
import FairtlCardReceipt from './FairtlCardReceipt.jsx'
import FairtlCardInventory from './FairtlCardInventory.jsx'
import FairtlCardThemesong from './FairtlCardThemesong.jsx'
import EditableSlot from './EditableSlot.jsx'
import TemplateSelect from './TemplateSelect.jsx'
import StickerPicker from './StickerPicker.jsx'
import AdminLayer from './AdminLayer.jsx'
import { getTemplate, CALENDAR_RATIOS } from '../lib/templates.js'
import { tintImage } from '../lib/presetStickers.js'
import {
  createFairtl,
  createPreset,
  createSticker,
  loadFairtls,
  saveFairtls,
  loadPresets,
  savePresets,
  defaultTransform,
} from '../lib/fairtl.js'

const NOTE_PATTERNS = [
  { id: 'grid', label: '모눈' },
  { id: 'dot', label: '도트' },
  { id: 'line', label: '줄' },
  { id: 'plain', label: '무지' },
]

export default function FairtlEditor({ characters, initialCharacterId, onExit, showToast }) {
  const [fairtls, setFairtls] = useState(loadFairtls)
  const [presets, setPresets] = useState(loadPresets)
  const [phase, setPhase] = useState('select') // 'select' | 'edit'
  const [working, setWorking] = useState(() =>
    createFairtl({ characterId: initialCharacterId || characters[0]?.id || '' }),
  )
  const [exporting, setExporting] = useState(false)
  const [selectedStickerId, setSelectedStickerId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [layoutMode, setLayoutMode] = useState(false)
  const [adminMode, setAdminMode] = useState(false)
  const cardRef = useRef(null)
  const previewRef = useRef(null)
  const stickerFileRef = useRef(null)
  const dateFileRef = useRef(null)
  const pendingDay = useRef(null)

  const tpl = getTemplate(working.template)
  const isDouble = working.template.startsWith('double-')
  const is2p = working.template === 'double-basic'
  const isCharFile = working.template === 'single-charfile'
  const isAppearance = working.template === 'double-appearance'
  const isReference = working.template === 'double-reference'
  const isFull = working.template === 'double-full'
  const isCalendar = working.template === 'calendar'
  const isId = working.template === 'single-id'
  const isCollectible = working.template === 'single-collectible'
  const isGacha = working.template === 'single-gacha'
  const isReceipt = working.template === 'single-receipt'
  const isInventory = working.template === 'single-inventory'
  const isThemesong = working.template === 'single-themesong'
  const isNewSingle = isId || isCollectible || isGacha || isReceipt || isInventory || isThemesong
  const ratioDims = isCalendar ? CALENDAR_RATIOS[working.ratio] || CALENDAR_RATIOS.mobile : null
  const CARD_W = ratioDims ? ratioDims.w : tpl.width
  const CARD_H = ratioDims ? ratioDims.h : tpl.height
  const previewScale = Math.min(900 / CARD_W, 620 / CARD_H)

  // extra 데이터 헬퍼
  const ex = working.extra || {}
  const getEx = (k, d = '') => (ex[k] === undefined || ex[k] === null ? d : ex[k])
  const setEx = (k, v) => setWorking((w) => ({ ...w, extra: { ...(w.extra || {}), [k]: v } }))
  const uploadEx = (k, v) =>
    setWorking((w) => ({ ...w, extra: { ...(w.extra || {}), [k]: v, [k + 'T']: defaultTransform() } }))
  const clearEx = (k) =>
    setWorking((w) => ({ ...w, extra: { ...(w.extra || {}), [k]: '', [k + 'T']: defaultTransform() } }))
  const transformEx = (k, t) =>
    setWorking((w) => ({ ...w, extra: { ...(w.extra || {}), [k + 'T']: t } }))
  const slotBind = (k) => ({
    src: getEx(k),
    transform: ex[k + 'T'],
    onUpload: (v) => uploadEx(k, v),
    onTransform: (t) => transformEx(k, t),
    onClear: () => clearEx(k),
  })

  const byId = useMemo(() => {
    const m = {}
    characters.forEach((c) => (m[c.id] = c))
    return m
  }, [characters])

  const selectedChar = byId[working.characterId] || null
  const selectedA = byId[working.characterA] || null
  const selectedB = byId[working.characterB] || null

  function patch(p) {
    setWorking((w) => ({ ...w, ...p }))
  }

  // 템플릿 선택 화면에서 템플릿을 고르면 새 페어틀로 진입
  function handlePickTemplate(templateId) {
    const firstId = initialCharacterId || characters[0]?.id || ''
    const dbl = templateId.startsWith('double-')
    const aId = dbl ? firstId : ''
    const bId = dbl ? characters[1]?.id || '' : ''
    const extra = dbl
      ? mergeEmpty({}, {
          ...autofillSide(templateId, 'a', byId[aId]),
          ...autofillSide(templateId, 'b', byId[bId]),
        })
      : {}
    const firstChar = byId[firstId]
    const pointColor = dbl ? '' : firstChar?.mainColor || firstChar?.colors?.[0]?.hex || ''
    setSelectedStickerId(null)
    setWorking(
      createFairtl({
        template: templateId,
        characterId: dbl ? '' : firstId,
        characterA: aId,
        characterB: bId,
        pointColor,
        extra,
      }),
    )
    setPhase('edit')
  }

  // "← 템플릿 변경" — 작성 중 데이터 초기화 확인
  function handleChangeTemplate() {
    if (!window.confirm('템플릿을 변경하면 작성 중인 내용이 초기화됩니다. 계속할까요?')) return
    setSelectedStickerId(null)
    setPhase('select')
  }

  function handleCharacterChange(id) {
    const ch = byId[id]
    const palette = ch?.colors ?? []
    const keep = palette.some((col) => col.hex === working.pointColor) || working.pointColor === ch?.mainColor
    patch({
      characterId: id,
      pointColor: keep ? working.pointColor : ch?.mainColor || palette[0]?.hex || '',
    })
  }

  // 2인용 — 캐릭터 선택 시 설정 텍스트 자동 가져오기 (빈 칸만)
  function pickDoubleChar(slot, id) {
    const fills = autofillSide(working.template, slot, byId[id])
    setWorking((w) => ({
      ...w,
      [slot === 'a' ? 'characterA' : 'characterB']: id,
      extra: mergeEmpty(w.extra, fills),
    }))
  }

  // ── 스티커 ──
  function handleAddSticker(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataURL = String(reader.result)
      const img = new Image()
      img.onload = () => {
        const baseW = 240
        const ratio = img.naturalHeight / img.naturalWidth || 1
        const w = baseW
        const h = Math.round(baseW * ratio)
        setWorking((wk) => {
          const count = (wk.stickers || []).length
          const off = (count % 5) * 24
          const st = createSticker({
            src: dataURL,
            x: CARD_W / 2 - w / 2 + off,
            y: CARD_H / 2 - h / 2 + off,
            width: w,
            height: h,
          })
          setSelectedStickerId(st.id)
          return { ...wk, stickers: [...(wk.stickers || []), st] }
        })
      }
      img.src = dataURL
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function deleteSticker(id) {
    patch({ stickers: (working.stickers || []).filter((s) => s.id !== id) })
    if (selectedStickerId === id) setSelectedStickerId(null)
  }

  // 레이아웃 편집 — 창 위치/크기를 extra.layout 에 저장
  function handleLayoutChange(id, partial) {
    setWorking((w) => {
      const layout = { ...(w.extra?.layout || {}) }
      layout[id] = { ...(layout[id] || {}), ...partial }
      return { ...w, extra: { ...(w.extra || {}), layout } }
    })
  }
  function resetLayout() {
    setWorking((w) => {
      const extra = { ...(w.extra || {}) }
      delete extra.layout
      return { ...w, extra }
    })
  }

  // 관리자 — 이미지 슬롯 오프셋 (다른 템플릿용)
  function handleAdminChange(key, partial) {
    setWorking((w) => {
      const adminLayout = { ...(w.extra?.adminLayout || {}) }
      adminLayout[key] = { ...(adminLayout[key] || {}), ...partial }
      return { ...w, extra: { ...(w.extra || {}), adminLayout } }
    })
  }
  function resetAdmin() {
    setWorking((w) => {
      const extra = { ...(w.extra || {}) }
      delete extra.adminLayout
      return { ...w, extra }
    })
  }

  // ── 캘린더 날짜 이미지 ──
  function onDateClick(day) {
    pendingDay.current = day
    dateFileRef.current?.click()
  }
  function handleDateFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const day = pendingDay.current
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      setWorking((w) => {
        const others = (w.dateStickers || []).filter((d) => d.date !== day)
        return { ...w, dateStickers: [...others, { date: day, src }] }
      })
    }
    reader.readAsDataURL(file)
  }
  function removeDateSticker(day) {
    patch({ dateStickers: (working.dateStickers || []).filter((d) => d.date !== day) })
  }
  function shiftMonth(delta) {
    setWorking((w) => {
      let m = w.month + delta
      let y = w.year
      while (m < 1) {
        m += 12
        y -= 1
      }
      while (m > 12) {
        m -= 12
        y += 1
      }
      return { ...w, month: m, year: y }
    })
  }

  // 보관함에서 기본 스티커 추가 (tintColor 지정 시 흰색 스티커를 색칠)
  async function addPresetSticker(preset, tintColor) {
    let src = preset.src
    if (tintColor && preset.recolorable) {
      try {
        src = await tintImage(preset.src, tintColor)
      } catch {
        src = preset.src
      }
    }
    const size = 180
    setWorking((wk) => {
      const count = (wk.stickers || []).length
      const off = (count % 5) * 24
      const st = createSticker({
        type: 'preset',
        src,
        baseSrc: preset.src,
        color: tintColor || '',
        recolorable: preset.recolorable,
        x: CARD_W / 2 - size / 2 + off,
        y: CARD_H / 2 - size / 2 + off,
        width: size,
        height: size,
      })
      setSelectedStickerId(st.id)
      return { ...wk, stickers: [...(wk.stickers || []), st] }
    })
    setPickerOpen(false)
  }

  // ── 저장된 페어틀 ──
  function freshFairtl() {
    return isDouble
      ? createFairtl({
          template: working.template,
          characterA: working.characterA,
          characterB: working.characterB,
        })
      : createFairtl({
          template: working.template,
          characterId: working.characterId || characters[0]?.id || '',
        })
  }

  function handleSaveFairtl() {
    if (!isCalendar && (isDouble ? !(selectedA && selectedB) : !selectedChar)) {
      showToast?.(isDouble ? '캐릭터 A·B를 모두 선택하세요' : '먼저 캐릭터를 선택하세요')
      return
    }
    const now = Date.now()
    const exists = fairtls.some((f) => f.id === working.id)
    const next = exists
      ? fairtls.map((f) => (f.id === working.id ? { ...working, updatedAt: now } : f))
      : [{ ...working, updatedAt: now }, ...fairtls]
    setFairtls(next)
    saveFairtls(next)
    showToast?.('페어틀을 저장했습니다')
  }

  function handleLoadFairtl(id) {
    setSelectedStickerId(null)
    if (id === '__new') {
      setWorking(freshFairtl())
      return
    }
    const f = fairtls.find((x) => x.id === id)
    if (f) setWorking({ ...f })
  }

  function handleDeleteFairtl() {
    if (!fairtls.some((f) => f.id === working.id)) {
      showToast?.('저장되지 않은 페어틀입니다')
      return
    }
    if (!window.confirm('이 페어틀을 삭제할까요?')) return
    const next = fairtls.filter((f) => f.id !== working.id)
    setFairtls(next)
    saveFairtls(next)
    setWorking(freshFairtl())
    showToast?.('페어틀을 삭제했습니다')
  }

  // ── 프리셋 ──
  function handleSavePreset() {
    const content = working.narrative.trim()
    if (!content) {
      showToast?.('저장할 서사 내용이 없습니다')
      return
    }
    const name = window.prompt('프리셋 이름을 입력하세요')
    if (name === null) return
    const trimmed = name.trim() || `프리셋 ${presets.length + 1}`
    const next = [createPreset({ name: trimmed, content }), ...presets]
    setPresets(next)
    savePresets(next)
    showToast?.(`프리셋 "${trimmed}" 저장됨`)
  }

  function handleLoadPreset(id) {
    const p = presets.find((x) => x.id === id)
    if (p) patch({ narrative: p.content })
  }

  function handleDeletePreset(id) {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    savePresets(next)
  }

  // ── 이미지로 저장 ──
  async function handleExport() {
    if (!cardRef.current) return
    setExporting(true)
    try {
      if (document.fonts?.ready) await document.fonts.ready
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        width: CARD_W,
        height: CARD_H,
        windowWidth: CARD_W,
        windowHeight: CARD_H,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = isCalendar
        ? `${working.year}-${String(working.month).padStart(2, '0')}_캘린더.png`
        : isDouble
        ? `${selectedA?.name || 'A'}×${selectedB?.name || 'B'}_페어틀.png`
        : `${selectedChar?.name || '캐릭터'}_페어틀.png`
      a.click()
      showToast?.(`이미지를 저장했습니다 (${CARD_W * 3}×${CARD_H * 3})`)
    } catch (err) {
      console.error(err)
      showToast?.('이미지 저장에 실패했습니다')
    } finally {
      setExporting(false)
    }
  }

  const palette = selectedChar?.colors ?? []
  const isSaved = fairtls.some((f) => f.id === working.id)
  const fairtlTemplate = (f) => f.template || (f.type === '2p' ? 'double-basic' : 'single-basic')
  const savedList = fairtls.filter((f) => {
    if (fairtlTemplate(f) !== working.template) return false
    if (isCalendar) return true
    return isDouble ? f.characterA === working.characterA : f.characterId === working.characterId
  })

  function fairtlLabel(f) {
    if (fairtlTemplate(f) === 'calendar') return `${f.year}.${String(f.month).padStart(2, '0')}`
    if (fairtlTemplate(f).startsWith('double-')) {
      const an = byId[f.characterA]?.name || 'A'
      const bn = byId[f.characterB]?.name || 'B'
      return `${an}×${bn}`
    }
    return byId[f.characterId]?.name || (f.narrative || '내용 없음').slice(0, 20) || '무제'
  }

  function renderCard(ref, interactive) {
    const adminLayout = working.extra?.adminLayout || {}
    const stickerProps = {
      stickers: working.stickers,
      stickersEditable: interactive,
      stickerSelectedId: interactive ? selectedStickerId : null,
      onStickerSelect: interactive ? setSelectedStickerId : undefined,
      onStickersChange: interactive ? (list) => patch({ stickers: list }) : undefined,
    }
    if (isCalendar) {
      return (
        <FairtlCardCalendar
          ref={ref}
          adminLayout={adminLayout}
          image={working.image}
          imageT={working.imageT}
          year={working.year}
          month={working.month}
          accentColor={working.pointColor}
          bgColor={working.bgColor}
          lang={working.lang}
          dateStickers={working.dateStickers}
          cardW={CARD_W}
          cardH={CARD_H}
          onDateClick={interactive ? onDateClick : undefined}
          datesEditable={interactive}
          {...stickerProps}
        />
      )
    }
    const doubleProps = {
      characterA: selectedA,
      characterB: selectedB,
      data: working.extra || {},
      adminLayout,
      ...stickerProps,
    }
    if (isAppearance) return <FairtlCardAppearance ref={ref} {...doubleProps} />
    if (isReference)
      return (
        <FairtlCardReference
          ref={ref}
          {...doubleProps}
          layout={working.extra?.layout || {}}
          layoutEditable={interactive && layoutMode}
          onLayoutChange={interactive ? handleLayoutChange : undefined}
        />
      )
    if (isFull) return <FairtlCardFull ref={ref} {...doubleProps} />
    if (isNewSingle) {
      const singleExtProps = {
        character: selectedChar,
        pointColor: working.pointColor,
        data: working.extra || {},
        adminLayout,
        ...stickerProps,
      }
      if (isId) return <FairtlCardId ref={ref} {...singleExtProps} />
      if (isCollectible) return <FairtlCardCollectible ref={ref} {...singleExtProps} />
      if (isGacha) return <FairtlCardGacha ref={ref} {...singleExtProps} />
      if (isReceipt) return <FairtlCardReceipt ref={ref} {...singleExtProps} />
      if (isInventory) return <FairtlCardInventory ref={ref} {...singleExtProps} />
      if (isThemesong) return <FairtlCardThemesong ref={ref} {...singleExtProps} />
    }
    if (isCharFile) {
      return (
        <FairtlCardCharFile
          ref={ref}
          character={selectedChar}
          pointColor={working.pointColor}
          cfPoint1={working.cfPoint1}
          cfPoint1T={working.cfPoint1T}
          cfPoint2={working.cfPoint2}
          cfPoint2T={working.cfPoint2T}
          cfPoint3={working.cfPoint3}
          cfPoint3T={working.cfPoint3T}
          cfMain={working.cfMain}
          cfMainT={working.cfMainT}
          cfSub={working.cfSub}
          cfSubT={working.cfSubT}
          height={working.height}
          weight={working.weight}
          credit={working.credit}
          notePattern={working.notePattern}
          adminLayout={adminLayout}
          {...stickerProps}
        />
      )
    }
    return is2p ? (
      <FairtlCard2p
        ref={ref}
        adminLayout={adminLayout}
        characterA={selectedA}
        characterB={selectedB}
        imgAMain={working.imgAMain}
        imgAMainT={working.imgAMainT}
        imgASub={working.imgASub}
        imgASubT={working.imgASubT}
        imgBMain={working.imgBMain}
        imgBMainT={working.imgBMainT}
        imgBSub={working.imgBSub}
        imgBSubT={working.imgBSubT}
        narrative={working.narrative}
        {...stickerProps}
      />
    ) : (
      <FairtlCard
        ref={ref}
        character={selectedChar}
        image={working.image}
        imageT={working.imageT}
        narrative={working.narrative}
        pointColor={working.pointColor}
        adminLayout={adminLayout}
        {...stickerProps}
      />
    )
  }

  if (phase === 'select') {
    return <TemplateSelect current={working.template} onPick={handlePickTemplate} onExit={onExit} />
  }

  const card = renderCard(cardRef, false)
  const previewCard = renderCard(undefined, true)

  return (
    <div className={styles.editor}>
      <header className={styles.topbar}>
        <button className={styles.back} onClick={handleChangeTemplate}>
          ← 템플릿 변경
        </button>
        <h1 className={styles.title}>
          페어틀 · <span className={styles.tplName}>{tpl.name}</span>
        </h1>
        {isCalendar && (
          <div className={styles.tabs}>
            {Object.entries(CALENDAR_RATIOS).map(([key, r]) => (
              <button
                key={key}
                className={`${styles.tab} ${working.ratio === key ? styles.tabActive : ''}`}
                onClick={() => patch({ ratio: key })}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        <div className={styles.topActions}>
          {!isReference && (
            <>
              <button
                className={`${styles.ghost} ${adminMode ? styles.layoutOn : ''}`}
                onClick={() => setAdminMode((v) => !v)}
                title="이미지 슬롯을 직접 드래그·리사이즈"
              >
                {adminMode ? '✓ 이미지 배치' : '⊞ 이미지 배치'}
              </button>
              {adminMode && (
                <button className={styles.ghost} onClick={resetAdmin}>
                  배치 초기화
                </button>
              )}
            </>
          )}
          <button className={styles.ghost} onClick={onExit}>
            아카이브
          </button>
          <button className={styles.ghost} onClick={handleSaveFairtl}>
            저장
          </button>
          <button className={styles.primary} onClick={handleExport} disabled={exporting}>
            {exporting ? '저장 중…' : '이미지로 저장'}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {/* 왼쪽: 설정 패널 */}
        <aside className={styles.panel}>
          {characters.length === 0 && !isCalendar ? (
            <p className={styles.notice}>먼저 아카이브에서 캐릭터를 만들어주세요.</p>
          ) : (
            <>
              <Field label="저장된 페어틀">
                <select
                  className={styles.select}
                  value={isSaved ? working.id : '__new'}
                  onChange={(e) => handleLoadFairtl(e.target.value)}
                >
                  <option value="__new">+ 새 페어틀</option>
                  {savedList.map((f, i) => (
                    <option key={f.id} value={f.id}>
                      {savedList.length - i}. {fairtlLabel(f)}
                    </option>
                  ))}
                </select>
                {isSaved && (
                  <button className={styles.linkDanger} onClick={handleDeleteFairtl}>
                    이 페어틀 삭제
                  </button>
                )}
              </Field>

              {isCalendar ? (
                <>
                  <Field label="상단 이미지">
                    <EditableSlot
                      label="이미지"
                      width={220}
                      height={150}
                      src={working.image}
                      transform={working.imageT}
                      onUpload={(v) => patch({ image: v, imageT: defaultTransform() })}
                      onTransform={(t) => patch({ imageT: t })}
                      onClear={() => patch({ image: '', imageT: defaultTransform() })}
                    />
                  </Field>
                  <Field label="년 / 월">
                    <div className={styles.twoCol}>
                      <input
                        className={styles.input}
                        type="number"
                        value={working.year}
                        onChange={(e) => patch({ year: Number(e.target.value) || working.year })}
                      />
                      <div className={styles.monthCtrl}>
                        <button onClick={() => shiftMonth(-1)}>−</button>
                        <span>{working.month}월</span>
                        <button onClick={() => shiftMonth(1)}>＋</button>
                      </div>
                    </div>
                  </Field>
                  <Field label="포인트 컬러">
                    <div className={styles.colorInputRow}>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={working.pointColor || '#b9a3ff'}
                        onChange={(e) => patch({ pointColor: e.target.value })}
                      />
                      <span className={styles.colorVal}>
                        {(working.pointColor || '#b9a3ff').toUpperCase()}
                      </span>
                    </div>
                  </Field>
                  <Field label="배경 컬러">
                    <div className={styles.colorInputRow}>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={working.bgColor || '#ffffff'}
                        onChange={(e) => patch({ bgColor: e.target.value })}
                      />
                      <button className={styles.ghostSm} onClick={() => patch({ bgColor: '' })}>
                        흰색
                      </button>
                    </div>
                  </Field>
                  <Field label="언어">
                    <div className={styles.patternRow}>
                      <button
                        className={`${styles.patternBtn} ${working.lang === 'ko' ? styles.patternActive : ''}`}
                        onClick={() => patch({ lang: 'ko' })}
                      >
                        한국어
                      </button>
                      <button
                        className={`${styles.patternBtn} ${working.lang === 'en' ? styles.patternActive : ''}`}
                        onClick={() => patch({ lang: 'en' })}
                      >
                        English
                      </button>
                    </div>
                  </Field>
                  <Field label="날짜 이미지">
                    <p className={styles.hint}>미리보기에서 날짜 칸을 클릭하면 이미지를 넣을 수 있어요.</p>
                    {(working.dateStickers || []).length > 0 && (
                      <div className={styles.stickerStrip}>
                        {working.dateStickers.map((d) => (
                          <div
                            key={d.date}
                            className={styles.stickerThumb}
                            style={{ backgroundImage: `url("${d.src}")` }}
                            title={`${d.date}일`}
                          >
                            <button
                              className={styles.stickerThumbDel}
                              onClick={() => removeDateSticker(d.date)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                </>
              ) : isAppearance ? (
                <AppearancePanel
                  characters={characters}
                  aVal={working.characterA}
                  bVal={working.characterB}
                  onSelectA={(id) => pickDoubleChar('a', id)}
                  onSelectB={(id) => pickDoubleChar('b', id)}
                  getEx={getEx}
                  setEx={setEx}
                  slotBind={slotBind}
                />
              ) : isReference ? (
                <ReferencePanel
                  characters={characters}
                  aVal={working.characterA}
                  bVal={working.characterB}
                  onSelectA={(id) => pickDoubleChar('a', id)}
                  onSelectB={(id) => pickDoubleChar('b', id)}
                  getEx={getEx}
                  setEx={setEx}
                  slotBind={slotBind}
                  layoutMode={layoutMode}
                  setLayoutMode={setLayoutMode}
                  resetLayout={resetLayout}
                />
              ) : isFull ? (
                <FullPanel
                  characters={characters}
                  aVal={working.characterA}
                  bVal={working.characterB}
                  onSelectA={(id) => pickDoubleChar('a', id)}
                  onSelectB={(id) => pickDoubleChar('b', id)}
                  getEx={getEx}
                  setEx={setEx}
                  slotBind={slotBind}
                />
              ) : is2p ? (
                <>
                  <SideSettings
                    title="캐릭터 A"
                    characters={characters}
                    value={working.characterA}
                    onSelect={(id) => patch({ characterA: id })}
                    main={working.imgAMain}
                    mainT={working.imgAMainT}
                    sub={working.imgASub}
                    subT={working.imgASubT}
                    onMain={(v) => patch({ imgAMain: v, imgAMainT: defaultTransform() })}
                    onMainT={(t) => patch({ imgAMainT: t })}
                    onMainClear={() => patch({ imgAMain: '', imgAMainT: defaultTransform() })}
                    onSub={(v) => patch({ imgASub: v, imgASubT: defaultTransform() })}
                    onSubT={(t) => patch({ imgASubT: t })}
                    onSubClear={() => patch({ imgASub: '', imgASubT: defaultTransform() })}
                  />
                  <SideSettings
                    title="캐릭터 B"
                    characters={characters}
                    value={working.characterB}
                    onSelect={(id) => patch({ characterB: id })}
                    main={working.imgBMain}
                    mainT={working.imgBMainT}
                    sub={working.imgBSub}
                    subT={working.imgBSubT}
                    onMain={(v) => patch({ imgBMain: v, imgBMainT: defaultTransform() })}
                    onMainT={(t) => patch({ imgBMainT: t })}
                    onMainClear={() => patch({ imgBMain: '', imgBMainT: defaultTransform() })}
                    onSub={(v) => patch({ imgBSub: v, imgBSubT: defaultTransform() })}
                    onSubT={(t) => patch({ imgBSubT: t })}
                    onSubClear={() => patch({ imgBSub: '', imgBSubT: defaultTransform() })}
                  />
                </>
              ) : isCharFile ? (
                <>
                  <Field label="캐릭터">
                    <select
                      className={styles.select}
                      value={working.characterId}
                      onChange={(e) => handleCharacterChange(e.target.value)}
                    >
                      <option value="">캐릭터 선택…</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || '이름 없음'}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="포인트 컬러">
                    <div className={styles.colorInputRow}>
                      <input
                        type="color"
                        className={styles.colorInput}
                        value={working.pointColor || '#b9a3ff'}
                        onChange={(e) => patch({ pointColor: e.target.value })}
                      />
                      <span className={styles.colorVal}>
                        {(working.pointColor || '#b9a3ff').toUpperCase()}
                      </span>
                    </div>
                  </Field>

                  <Field label="키 · 몸무게">
                    <div className={styles.twoCol}>
                      <input
                        className={styles.input}
                        value={working.height}
                        placeholder="키 (예: 175cm)"
                        onChange={(e) => patch({ height: e.target.value })}
                      />
                      <input
                        className={styles.input}
                        value={working.weight}
                        placeholder="몸무게 (예: 60kg)"
                        onChange={(e) => patch({ weight: e.target.value })}
                      />
                    </div>
                  </Field>

                  <Field label="커미션 출처 (크레딧)">
                    <input
                      className={styles.input}
                      value={working.credit}
                      placeholder="예: ©작가명"
                      onChange={(e) => patch({ credit: e.target.value })}
                    />
                  </Field>

                  <Field label="SPECIAL POINT 두상 3">
                    <div className={styles.cfPointRow}>
                      {[1, 2, 3].map((n) => (
                        <EditableSlot
                          key={n}
                          label={`P${n}`}
                          width={92}
                          height={70}
                          src={working[`cfPoint${n}`]}
                          transform={working[`cfPoint${n}T`]}
                          onUpload={(v) =>
                            patch({ [`cfPoint${n}`]: v, [`cfPoint${n}T`]: defaultTransform() })
                          }
                          onTransform={(t) => patch({ [`cfPoint${n}T`]: t })}
                          onClear={() =>
                            patch({ [`cfPoint${n}`]: '', [`cfPoint${n}T`]: defaultTransform() })
                          }
                        />
                      ))}
                    </div>
                  </Field>

                  <Field label="메인 두상">
                    <EditableSlot
                      label="메인"
                      width={200}
                      height={232}
                      src={working.cfMain}
                      transform={working.cfMainT}
                      onUpload={(v) => patch({ cfMain: v, cfMainT: defaultTransform() })}
                      onTransform={(t) => patch({ cfMainT: t })}
                      onClear={() => patch({ cfMain: '', cfMainT: defaultTransform() })}
                    />
                  </Field>

                  <Field label="OTHER (SD / 전신)">
                    <EditableSlot
                      label="OTHER"
                      width={210}
                      height={162}
                      src={working.cfSub}
                      transform={working.cfSubT}
                      onUpload={(v) => patch({ cfSub: v, cfSubT: defaultTransform() })}
                      onTransform={(t) => patch({ cfSubT: t })}
                      onClear={() => patch({ cfSub: '', cfSubT: defaultTransform() })}
                    />
                  </Field>

                  <Field label="FREE NOTE 배경 패턴">
                    <div className={styles.patternRow}>
                      {NOTE_PATTERNS.map((p) => (
                        <button
                          key={p.id}
                          className={`${styles.patternBtn} ${
                            working.notePattern === p.id ? styles.patternActive : ''
                          }`}
                          onClick={() => patch({ notePattern: p.id })}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              ) : isNewSingle ? (
                <SinglePlusPanel
                  template={working.template}
                  characters={characters}
                  working={working}
                  onCharacter={handleCharacterChange}
                  patch={patch}
                  getEx={getEx}
                  setEx={setEx}
                  slotBind={slotBind}
                />
              ) : (
                <>
                  <Field label="캐릭터">
                    <select
                      className={styles.select}
                      value={working.characterId}
                      onChange={(e) => handleCharacterChange(e.target.value)}
                    >
                      <option value="">캐릭터 선택…</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || '이름 없음'}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="캐릭터 일러스트">
                    <EditableSlot
                      label="이미지"
                      width={240}
                      height={330}
                      src={working.image}
                      transform={working.imageT}
                      onUpload={(v) => patch({ image: v, imageT: defaultTransform() })}
                      onTransform={(t) => patch({ imageT: t })}
                      onClear={() => patch({ image: '', imageT: defaultTransform() })}
                    />
                  </Field>
                </>
              )}

              {(working.template === 'single-basic' || is2p) && (
              <Field label={is2p ? '관계 서사 (공통)' : '서사 / 소개글'}>
                <textarea
                  className={styles.textarea}
                  rows={7}
                  value={working.narrative}
                  placeholder={is2p ? '두 캐릭터의 관계 서사를 입력하세요' : '캐릭터의 서사나 소개글을 입력하세요'}
                  onChange={(e) => patch({ narrative: e.target.value })}
                />
                <div className={styles.presetRow}>
                  <button className={styles.ghostSm} onClick={handleSavePreset}>
                    프리셋으로 저장
                  </button>
                  <select
                    className={styles.selectSm}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleLoadPreset(e.target.value)
                      e.target.value = ''
                    }}
                  >
                    <option value="">프리셋 불러오기…</option>
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {presets.length > 0 && (
                  <div className={styles.presetList}>
                    {presets.map((p) => (
                      <span key={p.id} className={styles.presetChip}>
                        {p.name}
                        <button
                          className={styles.presetDel}
                          title="프리셋 삭제"
                          onClick={() => handleDeletePreset(p.id)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
              )}

              {working.template === 'single-basic' && (
                <Field label="포인트 컬러 (팔레트)">
                  {palette.length === 0 ? (
                    <p className={styles.hint}>
                      이 캐릭터에 등록된 컬러가 없습니다. 기본 컬러로 표시됩니다.
                    </p>
                  ) : (
                    <div className={styles.colorPick}>
                      {palette.map((col) => (
                        <button
                          key={col.id}
                          className={`${styles.colorDot} ${
                            working.pointColor === col.hex ? styles.colorActive : ''
                          }`}
                          style={{ background: col.hex }}
                          title={col.name || col.hex}
                          onClick={() => patch({ pointColor: col.hex })}
                        />
                      ))}
                    </div>
                  )}
                </Field>
              )}

              <Field label="스티커">
                <div className={styles.stickerBtns}>
                  <button
                    className={styles.ghostSm}
                    onClick={() => stickerFileRef.current?.click()}
                  >
                    ＋ 이미지 추가
                  </button>
                  <button className={styles.ghostSm} onClick={() => setPickerOpen(true)}>
                    🗂 보관함
                  </button>
                </div>
                {(working.stickers || []).length > 0 && (
                  <>
                    <div className={styles.stickerStrip}>
                      {working.stickers.map((s) => (
                        <div
                          key={s.id}
                          className={`${styles.stickerThumb} ${
                            selectedStickerId === s.id ? styles.stickerThumbSel : ''
                          }`}
                          style={{ backgroundImage: `url("${s.src}")` }}
                          onClick={() => setSelectedStickerId(s.id)}
                        >
                          <button
                            className={styles.stickerThumbDel}
                            title="삭제"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSticker(s.id)
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className={styles.hint}>
                      미리보기에서 스티커를 클릭해 이동·크기조절, Delete로 삭제할 수 있습니다.
                    </p>
                  </>
                )}
                <input
                  ref={stickerFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAddSticker}
                />
                <input
                  ref={dateFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleDateFile}
                />
              </Field>
            </>
          )}
        </aside>

        {/* 오른쪽: 미리보기 (표시용 — 축소) */}
        <div className={styles.previewArea}>
          <p className={styles.previewLabel}>
            미리보기 · {CARD_W} × {CARD_H} · {tpl.name}
          </p>
          <div
            className={styles.previewFrame}
            style={{ width: CARD_W * previewScale, height: CARD_H * previewScale }}
          >
            <div
              ref={previewRef}
              className={styles.scaler}
              style={{ width: CARD_W, height: CARD_H, transform: `scale(${previewScale})` }}
            >
              {previewCard}
            </div>
            {adminMode && !isReference && (
              <AdminLayer
                previewRef={previewRef}
                scale={previewScale}
                adminLayout={working.extra?.adminLayout || {}}
                onChange={handleAdminChange}
              />
            )}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <StickerPicker onPick={addPresetSticker} onClose={() => setPickerOpen(false)} />
      )}

      {/* 캡처 전용 — 화면 밖, 변형 없이 원본 크기로 렌더 */}
      <div className={styles.exportHost} aria-hidden style={{ width: CARD_W, height: CARD_H }}>
        {card}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </div>
  )
}

function SideSettings({
  title,
  characters,
  value,
  onSelect,
  main,
  mainT,
  sub,
  subT,
  onMain,
  onMainT,
  onMainClear,
  onSub,
  onSubT,
  onSubClear,
}) {
  // 2인용 두상 슬롯 — 카드 슬롯 비율(≈315×180)에 맞춤
  const W = 290
  const H = 165
  return (
    <div className={styles.sideCard}>
      <span className={styles.sideTitle}>{title}</span>
      <select className={styles.select} value={value} onChange={(e) => onSelect(e.target.value)}>
        <option value="">캐릭터 선택…</option>
        {characters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name || '이름 없음'}
          </option>
        ))}
      </select>
      <EditableSlot
        label="두상 1"
        width={W}
        height={H}
        src={main}
        transform={mainT}
        onUpload={onMain}
        onTransform={onMainT}
        onClear={onMainClear}
      />
      <EditableSlot
        label="두상 2"
        width={W}
        height={H}
        src={sub}
        transform={subT}
        onUpload={onSub}
        onTransform={onSubT}
        onClear={onSubClear}
      />
    </div>
  )
}

let _idc = 0
function genId() {
  _idc += 1
  return 'k' + Date.now().toString(36) + _idc
}

// 캐릭터 settings 카테고리에서 키워드 매칭 텍스트 찾기
function charSettingText(char, keywords) {
  const list = char?.settings || []
  for (const k of keywords) {
    const hit = list.find((x) => (x.category || '').includes(k))
    if (hit && hit.content?.trim()) return hit.content
  }
  return ''
}

// 템플릿별 — 캐릭터 데이터에서 자동으로 가져올 텍스트 (한 쪽 p='a'|'b')
function autofillSide(template, p, char) {
  if (!char) return {}
  if (template === 'double-appearance') {
    return { [`${p}Appear`]: char.appearance || char.personality || '' }
  }
  if (template === 'double-reference') {
    const kw = (char.tags || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3)
    return { [`${p}Appear`]: char.appearance || char.personality || '', [`${p}Keywords`]: kw }
  }
  if (template === 'double-full') {
    return {
      [`${p}Keywords`]: char.appearance || char.tagline || '',
      [`${p}Costume`]: charSettingText(char, ['의상', '복장', '옷', '코디']),
    }
  }
  return {}
}

// 빈 칸만 채우기 (사용자 수정값 보존)
function mergeEmpty(extra, fills) {
  const out = { ...(extra || {}) }
  for (const k in fills) {
    const cur = out[k]
    if (cur === undefined || cur === null || cur === '') out[k] = fills[k]
  }
  return out
}

function CharSelect({ characters, value, onChange }) {
  return (
    <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">캐릭터 선택…</option>
      {characters.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name || '이름 없음'}
        </option>
      ))}
    </select>
  )
}

// 외관카드 설정
function AppearancePanel({ characters, aVal, bVal, onSelectA, onSelectB, getEx, setEx, slotBind }) {
  const sides = [
    ['a', '캐릭터 A', aVal, onSelectA],
    ['b', '캐릭터 B', bVal, onSelectB],
  ]
  const checks = (p) => (Array.isArray(getEx(`${p}Checks`, [])) ? getEx(`${p}Checks`, []) : [])
  return (
    <>
      {sides.map(([p, title, val, onSel]) => (
        <div className={styles.sideCard} key={p}>
          <span className={styles.sideTitle}>{title}</span>
          <CharSelect characters={characters} value={val} onChange={onSel} />
          <input
            className={styles.input}
            value={getEx(`${p}Height`)}
            placeholder="키 (예: 175cm)"
            onChange={(e) => setEx(`${p}Height`, e.target.value)}
          />
          <div className={styles.slotRow}>
            <EditableSlot label="두상" width={120} height={120} {...slotBind(`${p}Head`)} />
            <EditableSlot label="SD" width={120} height={120} {...slotBind(`${p}SD`)} />
          </div>
          <EditableSlot label="전신" width={150} height={210} {...slotBind(`${p}Body`)} />
          <textarea
            className={styles.areaSm}
            value={getEx(`${p}Appear`)}
            placeholder="외관 설명 (캐릭터 설정에서 자동 입력 · 수정 가능)"
            rows={4}
            onChange={(e) => setEx(`${p}Appear`, e.target.value)}
          />
          <span className={styles.miniHead}>체크 항목</span>
          {checks(p).map((it) => (
            <div className={styles.checkEdit} key={it.id}>
              <input
                type="checkbox"
                checked={!!it.done}
                onChange={() =>
                  setEx(`${p}Checks`, checks(p).map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))
                }
              />
              <input
                className={styles.input}
                value={it.text}
                placeholder="항목"
                onChange={(e) =>
                  setEx(`${p}Checks`, checks(p).map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))
                }
              />
              <button
                className={styles.checkDel}
                onClick={() => setEx(`${p}Checks`, checks(p).filter((x) => x.id !== it.id))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className={styles.ghostSm}
            onClick={() => setEx(`${p}Checks`, [...checks(p), { id: genId(), text: '', done: false }])}
          >
            ＋ 체크 항목 추가
          </button>
          <input
            className={styles.input}
            value={getEx(`${p}Credit`)}
            placeholder="커미션 출처 (예: ©작가명)"
            onChange={(e) => setEx(`${p}Credit`, e.target.value)}
          />
        </div>
      ))}
      <div className={styles.sideCard}>
        <span className={styles.sideTitle}>관계 (가운데)</span>
        <input
          className={styles.input}
          value={getEx('relAB')}
          placeholder="A→B 관계 (예: 신체적 공)"
          onChange={(e) => setEx('relAB', e.target.value)}
        />
        <input
          className={styles.input}
          value={getEx('relBA')}
          placeholder="B→A 관계 (예: 정신적 수)"
          onChange={(e) => setEx('relBA', e.target.value)}
        />
        <textarea
          className={styles.areaSm}
          value={getEx('relNarr')}
          placeholder="관계 서사 (짧게)"
          onChange={(e) => setEx('relNarr', e.target.value)}
        />
      </div>
    </>
  )
}

// 레퍼런스 시트 (데스크탑 인터페이스) 설정
function ReferencePanel({
  characters,
  aVal,
  bVal,
  onSelectA,
  onSelectB,
  getEx,
  setEx,
  slotBind,
  layoutMode,
  setLayoutMode,
  resetLayout,
}) {
  const sides = [
    ['a', '캐릭터 A', aVal, onSelectA],
    ['b', '캐릭터 B', bVal, onSelectB],
  ]
  const credits = Array.isArray(getEx('credits', [])) ? getEx('credits', []) : []
  return (
    <>
      <div className={styles.sideCard}>
        <span className={styles.sideTitle}>레이아웃</span>
        <button
          className={`${styles.upload} ${layoutMode ? styles.layoutOn : ''}`}
          onClick={() => setLayoutMode(!layoutMode)}
        >
          {layoutMode ? '✓ 레이아웃 편집 중 (끄기)' : '⊞ 레이아웃 편집 (창 직접 이동·크기)'}
        </button>
        {layoutMode && (
          <p className={styles.hint}>
            미리보기에서 창 제목줄을 끌어 이동, 우하단 모서리로 크기 조절. 아이콘은 통째로 드래그.
          </p>
        )}
        <button className={styles.ghostSm} onClick={resetLayout}>
          위치·크기 초기화
        </button>
      </div>

      <div className={styles.sideCard}>
        <span className={styles.sideTitle}>페어 · 이름 · 배경</span>
        <input
          className={styles.input}
          value={getEx('pairName')}
          placeholder="페어명 (Paint 창 제목)"
          onChange={(e) => setEx('pairName', e.target.value)}
        />
        <textarea
          className={styles.areaSm}
          value={getEx('relation')}
          placeholder="관계 설명란"
          rows={2}
          onChange={(e) => setEx('relation', e.target.value)}
        />
        <input
          className={styles.input}
          value={getEx('annivText')}
          placeholder="페어 기념일 (예: 2024 / 03 / 14)"
          onChange={(e) => setEx('annivText', e.target.value)}
        />

        <span className={styles.miniHead}>이름 그라데이션</span>
        <div className={styles.colorInputRow}>
          <input
            type="color"
            className={styles.colorInput}
            value={getEx('nameGradFrom', '#9ec9c0')}
            onChange={(e) => setEx('nameGradFrom', e.target.value)}
          />
          <span className={styles.colorVal}>→</span>
          <input
            type="color"
            className={styles.colorInput}
            value={getEx('nameGradTo', '#b9a3ff')}
            onChange={(e) => setEx('nameGradTo', e.target.value)}
          />
        </div>
        <label className={styles.rangeRow}>
          투명도
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={getEx('nameOpacity', 1)}
            onChange={(e) => setEx('nameOpacity', Number(e.target.value))}
          />
        </label>
        <select
          className={styles.select}
          value={getEx('nameFont', "'Playfair Display', 'Noto Sans KR', serif")}
          onChange={(e) => setEx('nameFont', e.target.value)}
        >
          <option value="'Playfair Display', 'Noto Sans KR', serif">명조</option>
          <option value="'Noto Sans KR', sans-serif">고딕</option>
          <option value="cursive">손글씨</option>
        </select>

        <span className={styles.miniHead}>배경화면</span>
        <div className={styles.patternRow}>
          <button
            className={`${styles.patternBtn} ${getEx('bgMode', 'pattern') === 'pattern' ? styles.patternActive : ''}`}
            onClick={() => setEx('bgMode', 'pattern')}
          >
            패턴
          </button>
          <button
            className={`${styles.patternBtn} ${getEx('bgMode') === 'image' ? styles.patternActive : ''}`}
            onClick={() => setEx('bgMode', 'image')}
          >
            이미지
          </button>
        </div>
        {getEx('bgMode') === 'image' ? (
          <EditableSlot label="배경 이미지" width={220} height={140} {...slotBind('bgImage')} />
        ) : (
          <>
            <div className={styles.patternRow}>
              {[
                ['grid', '모눈'],
                ['dot', '도트'],
                ['line', '줄'],
                ['plain', '무지'],
              ].map(([id, lbl]) => (
                <button
                  key={id}
                  className={`${styles.patternBtn} ${getEx('bgPattern', 'grid') === id ? styles.patternActive : ''}`}
                  onClick={() => setEx('bgPattern', id)}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className={styles.colorInputRow}>
              <input
                type="color"
                className={styles.colorInput}
                value={getEx('bgColor', '#f4f6f9')}
                onChange={(e) => setEx('bgColor', e.target.value)}
              />
              <span className={styles.colorVal}>배경색</span>
            </div>
          </>
        )}
      </div>

      {sides.map(([p, title, val, onSel]) => (
        <div className={styles.sideCard} key={p}>
          <span className={styles.sideTitle}>{title}</span>
          <CharSelect characters={characters} value={val} onChange={onSel} />
          <span className={styles.miniHead}>키워드 (메모장 상단 · 최대 3)</span>
          <div className={styles.twoCol}>
            {[0, 1, 2].map((idx) => {
              const kws = Array.isArray(getEx(`${p}Keywords`, [])) ? getEx(`${p}Keywords`, []) : []
              return (
                <input
                  key={idx}
                  className={styles.input}
                  value={kws[idx] || ''}
                  placeholder={`#${idx + 1}`}
                  onChange={(e) => {
                    const next = [...kws]
                    next[idx] = e.target.value
                    setEx(`${p}Keywords`, next)
                  }}
                />
              )
            })}
          </div>
          <span className={styles.miniHead}>외관 설명 (메모장)</span>
          <textarea
            className={styles.areaSm}
            value={getEx(`${p}Appear`)}
            placeholder="외관 설명 (설정에서 자동 입력 · 수정 가능)"
            rows={4}
            onChange={(e) => setEx(`${p}Appear`, e.target.value)}
          />
          <span className={styles.miniHead}>그 외 특징 (한 줄에 하나)</span>
          <textarea
            className={styles.areaSm}
            value={getEx(`${p}Traits`)}
            placeholder={'특징 1\n특징 2\n특징 3'}
            rows={3}
            onChange={(e) => setEx(`${p}Traits`, e.target.value)}
          />
          <span className={styles.miniHead}>아이콘 이미지 (투명 배경)</span>
          <EditableSlot label="아이콘" width={90} height={90} {...slotBind(`${p}Icon`)} />
        </div>
      ))}

      <div className={styles.sideCard}>
        <span className={styles.sideTitle}>이미지 창 · 커미션</span>
        <span className={styles.miniHead}>이미지 창 (민트 창 · 6개)</span>
        <div className={styles.slotRow}>
          <EditableSlot label="창1" width={100} height={92} {...slotBind('win1')} />
          <EditableSlot label="창2" width={100} height={92} {...slotBind('win2')} />
          <EditableSlot label="창3" width={100} height={92} {...slotBind('win3')} />
        </div>
        <div className={styles.slotRow}>
          <EditableSlot label="창4" width={100} height={92} {...slotBind('win4')} />
          <EditableSlot label="창5" width={100} height={92} {...slotBind('win5')} />
          <EditableSlot label="창6" width={100} height={92} {...slotBind('win6')} />
        </div>
        <p className={styles.hint}>전신 이미지는 아래 “스티커”로 추가해 Paint 창 위에 배치하세요.</p>

        <span className={styles.miniHead}>커미션 출처 (우클릭 메뉴)</span>
        {credits.map((c, i) => (
          <div className={styles.checkEdit} key={i}>
            <input
              className={styles.input}
              value={c}
              placeholder="©작가명"
              onChange={(e) => setEx('credits', credits.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <button
              className={styles.checkDel}
              onClick={() => setEx('credits', credits.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button className={styles.ghostSm} onClick={() => setEx('credits', [...credits, ''])}>
          ＋ 출처 추가
        </button>
      </div>
    </>
  )
}

// 풀 캐릭터 시트 설정
function FullPanel({ characters, aVal, bVal, onSelectA, onSelectB, getEx, setEx, slotBind }) {
  const sides = [
    ['a', '캐릭터 A', aVal, onSelectA],
    ['b', '캐릭터 B', bVal, onSelectB],
  ]
  return (
    <>
      {sides.map(([p, title, val, onSel]) => (
        <div className={styles.sideCard} key={p}>
          <span className={styles.sideTitle}>{title}</span>
          <CharSelect characters={characters} value={val} onChange={onSel} />
          <input
            className={styles.input}
            value={getEx(`${p}Height`)}
            placeholder="키 (예: 175cm)"
            onChange={(e) => setEx(`${p}Height`, e.target.value)}
          />
          <span className={styles.miniHead}>두상 3</span>
          <div className={styles.slotRow}>
            {[1, 2, 3].map((n) => (
              <EditableSlot key={n} label={`두상${n}`} width={86} height={86} {...slotBind(`${p}Head${n}`)} />
            ))}
          </div>
          <span className={styles.miniHead}>동물화</span>
          <div className={styles.slotRow}>
            <EditableSlot label="동물화" width={110} height={110} {...slotBind(`${p}Animal`)} />
            <input
              className={styles.input}
              value={getEx(`${p}AnimalName`)}
              placeholder="동물화 이름"
              onChange={(e) => setEx(`${p}AnimalName`, e.target.value)}
            />
          </div>
          <textarea
            className={styles.areaSm}
            value={getEx(`${p}Keywords`)}
            placeholder="외관 키워드"
            onChange={(e) => setEx(`${p}Keywords`, e.target.value)}
          />
          <textarea
            className={styles.areaSm}
            value={getEx(`${p}Costume`)}
            placeholder="의상 자료"
            onChange={(e) => setEx(`${p}Costume`, e.target.value)}
          />
          <span className={styles.miniHead}>의상 디테일</span>
          <div className={styles.slotRow}>
            <EditableSlot label="디테일1" width={110} height={130} {...slotBind(`${p}Cloth1`)} />
            <EditableSlot label="디테일2" width={110} height={130} {...slotBind(`${p}Cloth2`)} />
          </div>
        </div>
      ))}
      <div className={styles.sideCard}>
        <span className={styles.sideTitle}>전신 (가운데) · 공통</span>
        <EditableSlot label="전신 A" width={130} height={280} {...slotBind('bodyA')} />
        <EditableSlot label="전신 B" width={130} height={280} {...slotBind('bodyB')} />
        <input
          className={styles.input}
          value={getEx('credit')}
          placeholder="커미션 출처 (예: ©작가명)"
          onChange={(e) => setEx('credit', e.target.value)}
        />
      </div>
    </>
  )
}

// 새 1인용 템플릿 공용 설정 패널
function SinglePlusPanel({ template, characters, working, onCharacter, patch, getEx, setEx, slotBind }) {
  const charSel = (
    <Field label="캐릭터">
      <CharSelect characters={characters} value={working.characterId} onChange={onCharacter} />
      <p className={styles.hint}>이름·나이·키·성별·생일·태그·키워드·대표색이 자동으로 채워집니다.</p>
    </Field>
  )
  const color = (
    <Field label="포인트 컬러 (대표색 자동)">
      <div className={styles.colorInputRow}>
        <input
          type="color"
          className={styles.colorInput}
          value={working.pointColor || '#b9a3ff'}
          onChange={(e) => patch({ pointColor: e.target.value })}
        />
        <span className={styles.colorVal}>{(working.pointColor || '#b9a3ff').toUpperCase()}</span>
      </div>
    </Field>
  )
  const illust = (label, w = 240, h = 300) => (
    <Field label={label}>
      <EditableSlot label="이미지" width={w} height={h} {...slotBind('illust')} />
    </Field>
  )
  const text = (label, key, ph) => (
    <Field label={label}>
      <input
        className={styles.input}
        value={getEx(key)}
        placeholder={ph}
        onChange={(e) => setEx(key, e.target.value)}
      />
    </Field>
  )
  const area = (label, key, ph) => (
    <Field label={label}>
      <textarea
        className={styles.textarea}
        rows={5}
        value={getEx(key)}
        placeholder={ph}
        onChange={(e) => setEx(key, e.target.value)}
      />
    </Field>
  )

  if (template === 'single-id') {
    return (
      <>
        {charSel}
        {color}
        {illust('사진', 220, 250)}
        {text('ID 번호', 'idNo', '비우면 생일 기반 자동')}
        {text('Type', 'idType', '예: CAT / QUEEN')}
        {text('MBTI', 'mbti', '예: ENFP')}
        {text('발급일', 'issueDate', '2023-05-15')}
      </>
    )
  }
  if (template === 'single-collectible') {
    return (
      <>
        {charSel}
        {color}
        {illust('일러스트', 240, 300)}
        {text('레벨', 'level', '07')}
        <Field label="레어도 (별)">
          <select
            className={styles.select}
            value={getEx('rarity', '3')}
            onChange={(e) => setEx('rarity', e.target.value)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)}
              </option>
            ))}
          </select>
        </Field>
        {text('스킬 이름', 'abilityName', '비우면 키워드 사용')}
        {area('플레이버 텍스트', 'flavor', '비우면 한줄소개 사용')}
      </>
    )
  }
  if (template === 'single-gacha') {
    return (
      <>
        {charSel}
        {color}
        {illust('캐릭터 일러스트', 240, 320)}
        {text('등급 라벨', 'rarity', 'SSR')}
      </>
    )
  }
  if (template === 'single-receipt') {
    return (
      <>
        {charSel}
        {color}
        {text('주문번호', 'orderNo', '비우면 자동')}
        {text('날짜', 'dateText', '2026 . 07 . 08')}
        <Field label="결제 수단">
          <select
            className={styles.select}
            value={getEx('pay', 'card')}
            onChange={(e) => setEx('pay', e.target.value)}
          >
            <option value="cash">CASH</option>
            <option value="card">CARD</option>
            <option value="ewallet">E-WALLET</option>
          </select>
        </Field>
        {text('연락처', 'contact', '@casket')}
        <p className={styles.hint}>이름·나이·키·성별·생일·태그·키워드가 영수증 항목으로 자동 생성됩니다.</p>
      </>
    )
  }
  if (template === 'single-inventory') {
    return (
      <>
        {charSel}
        {color}
        {illust('포트레이트', 240, 300)}
        <Field label="인벤토리 아이템 (8칸)">
          <div className={styles.slotRow}>
            {[1, 2, 3, 4].map((n) => (
              <EditableSlot key={n} label={`${n}`} width={64} height={64} {...slotBind(`item${n}`)} />
            ))}
          </div>
          <div className={styles.slotRow}>
            {[5, 6, 7, 8].map((n) => (
              <EditableSlot key={n} label={`${n}`} width={64} height={64} {...slotBind(`item${n}`)} />
            ))}
          </div>
        </Field>
        {text('시간', 'timeText', '00:00')}
        {text('날짜', 'dateText', 'spring 15')}
        {text('기분(mood)', 'mood', '비우면 키워드 사용')}
        {text('하트 (0~10)', 'hearts', '8')}
        {text('대사', 'line', '비우면 한줄소개 사용')}
      </>
    )
  }
  if (template === 'single-themesong') {
    return (
      <>
        {charSel}
        {color}
        {illust('앨범 아트', 240, 240)}
        {text('곡 제목', 'songTitle', '테마곡 no.1')}
        {text('아티스트', 'artist', '비우면 캐릭터명')}
        {text('앨범', 'album', 'CASKET OST')}
        {text('재생 시간', 'duration', '3:33')}
        {area('가사 / 모티브', 'lyrics', '가사 한 구절이나 모티브 설명 (비우면 한줄소개)')}
      </>
    )
  }
  return charSel
}
