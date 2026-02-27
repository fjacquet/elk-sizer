import { type ReactNode, useCallback } from 'react'

interface AccordionItemProps {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}

export function AccordionItem({ title, isOpen, onToggle, children }: AccordionItemProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToggle()
      }
    },
    [onToggle],
  )

  return (
    <div className="border border-surface-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-800 hover:bg-surface-700 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          &#9662;
        </span>
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-surface-900 text-sm text-slate-300 space-y-3">{children}</div>
      )}
    </div>
  )
}
