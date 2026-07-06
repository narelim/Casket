import { useLayoutEffect, useRef } from 'react'

// 내용에 맞춰 세로로 자동으로 늘어나는 textarea (기본 높이는 CSS min-height)
export default function AutoTextarea({ value, className, onChange, ...props }) {
  const ref = useRef(null)

  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useLayoutEffect(resize, [value])

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={(e) => {
        onChange?.(e)
        resize()
      }}
      {...props}
    />
  )
}
