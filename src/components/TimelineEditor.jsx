import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import styles from './TimelineEditor.module.css'
import { createTimelineEvent } from '../lib/character.js'

function SortableEvent({ ev, onField, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ev.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
    >
      <span className={styles.node} aria-hidden />
      <div className={styles.body}>
        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.grip}
            title="드래그하여 순서 변경"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
          <input
            className={styles.period}
            value={ev.period}
            placeholder="시기 (예: 1907년, 유년기)"
            onChange={(e) => onField('period', e.target.value)}
          />
          <button type="button" className={styles.del} onClick={onRemove}>
            삭제
          </button>
        </div>
        <input
          className={styles.title}
          value={ev.title}
          placeholder="제목"
          onChange={(e) => onField('title', e.target.value)}
        />
        <textarea
          className={styles.content}
          value={ev.content}
          placeholder="내용"
          rows={2}
          onChange={(e) => onField('content', e.target.value)}
        />
      </div>
    </div>
  )
}

export default function TimelineEditor({ timeline, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = timeline.findIndex((t) => t.id === active.id)
    const newIndex = timeline.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(timeline, oldIndex, newIndex))
  }

  function addEvent() {
    onChange([...timeline, createTimelineEvent()])
  }

  function updateField(id, field, value) {
    onChange(timeline.map((t) => (t.id === id ? { ...t, [field]: value } : t)))
  }

  function removeEvent(id) {
    onChange(timeline.filter((t) => t.id !== id))
  }

  return (
    <div>
      <div className={styles.head}>
        <span className={styles.label}>타임라인</span>
        <button type="button" className={styles.addBtn} onClick={addEvent}>
          + 사건 추가
        </button>
      </div>

      {timeline.length === 0 ? (
        <p className={styles.empty}>사건이 없습니다 · 추가해보세요</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={timeline.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.list}>
              {timeline.map((ev) => (
                <SortableEvent
                  key={ev.id}
                  ev={ev}
                  onField={(field, value) => updateField(ev.id, field, value)}
                  onRemove={() => removeEvent(ev.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
