import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './App.module.css'
import Sidebar from './components/Sidebar.jsx'
import CharacterForm from './components/CharacterForm.jsx'
import CharacterCard from './components/CharacterCard.jsx'
import FairtlEditor from './components/FairtlEditor.jsx'
import { createCharacter, normalizeImport } from './lib/character.js'

const STORAGE_KEY = 'casket.characters.v1'
const SELECTED_KEY = 'casket.selected.v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((c) => createCharacter(c)) : []
  } catch {
    return []
  }
}

export default function App() {
  const [characters, setCharacters] = useState(loadInitial)
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(SELECTED_KEY) || null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState('archive') // 'archive' | 'fairtl'
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
  const toastTimer = useRef(null)

  // 로컬스토리지 자동저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters))
    } catch {
      /* 저장 실패는 조용히 무시 */
    }
  }, [characters])

  useEffect(() => {
    if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId)
    else localStorage.removeItem(SELECTED_KEY)
  }, [selectedId])

  // 선택된 캐릭터가 사라지면 선택 해제
  useEffect(() => {
    if (selectedId && !characters.some((c) => c.id === selectedId)) {
      setSelectedId(characters[0]?.id ?? null)
    }
  }, [characters, selectedId])

  const selected = useMemo(
    () => characters.find((c) => c.id === selectedId) || null,
    [characters, selectedId],
  )

  function showToast(message) {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  function handleAdd() {
    const c = createCharacter({ name: '새 캐릭터' })
    setCharacters((prev) => [c, ...prev])
    setSelectedId(c.id)
  }

  function handleUpdate(patch) {
    setCharacters((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, ...patch, updatedAt: Date.now() } : c)),
    )
  }

  function handleDelete(id) {
    const target = characters.find((c) => c.id === id)
    if (target && !window.confirm(`"${target.name || '이름 없음'}" 캐릭터를 삭제할까요?`)) return
    setCharacters((prev) => prev.filter((c) => c.id !== id))
  }

  function handleExport() {
    if (characters.length === 0) {
      showToast('내보낼 캐릭터가 없습니다')
      return
    }
    const payload = {
      app: 'casket',
      version: 1,
      exportedAt: new Date().toISOString(),
      characters,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `casket-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`${characters.length}개 캐릭터를 내보냈습니다`)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        const imported = normalizeImport(data)
        if (!imported) {
          showToast('올바른 Casket JSON이 아닙니다')
          return
        }
        const merge = window.confirm(
          `${imported.length}개 캐릭터를 불러옵니다.\n\n[확인] 기존 목록에 추가\n[취소] 기존 목록을 대체`,
        )
        if (merge) {
          setCharacters((prev) => [...imported, ...prev])
        } else {
          setCharacters(imported)
        }
        setSelectedId(imported[0]?.id ?? null)
        showToast(`${imported.length}개 캐릭터를 불러왔습니다`)
      } catch {
        showToast('파일을 읽을 수 없습니다')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // 같은 파일 재선택 허용
  }

  if (view === 'fairtl') {
    return (
      <>
        <FairtlEditor
          characters={characters}
          initialCharacterId={selectedId}
          onExit={() => setView('archive')}
          showToast={showToast}
        />
        {toast && <div className={styles.toast}>{toast}</div>}
      </>
    )
  }

  return (
    <div className={styles.app}>
      <Sidebar
        characters={characters}
        selectedId={selectedId}
        query={query}
        onQuery={setQuery}
        onSelect={setSelectedId}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImportClick}
        onOpenFairtl={() => setView('fairtl')}
      />

      <main className={styles.main}>
        {selected ? (
          <div className={styles.editor}>
            <CharacterForm
              key={selected.id}
              character={selected}
              onChange={handleUpdate}
              onDelete={() => handleDelete(selected.id)}
              onToast={showToast}
            />
            <CharacterCard character={selected} />
          </div>
        ) : (
          <EmptyState onAdd={handleAdd} hasAny={characters.length > 0} />
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
        hidden
      />

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}

function EmptyState({ onAdd, hasAny }) {
  return (
    <div className={styles.empty}>
      <div className={`${styles.emptyMark} sparkle`}>✦</div>
      <h2 className={`${styles.emptyTitle} wordmark`}>Casket</h2>
      <p className={styles.emptyText}>
        {hasAny ? '왼쪽에서 캐릭터를 선택하세요.' : '첫 자캐를 기록해보세요.'}
      </p>
      <button className={styles.emptyBtn} onClick={onAdd}>
        + 새 캐릭터
      </button>
    </div>
  )
}
