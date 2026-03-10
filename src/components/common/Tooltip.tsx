import { useId } from 'react'

interface TooltipProps {
  text: string
  children: React.ReactNode
}

export function Tooltip({ text, children }: TooltipProps) {
  const id = useId()
  return (
    <span className="relative group inline-flex items-center gap-1 min-w-0">
      <span className="truncate">{children}</span>
      <button
        type="button"
        aria-describedby={id}
        aria-label="More information"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-surface-600 text-slate-400 text-[10px] cursor-help shrink-0 select-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-surface-800"
      >
        ⓘ
      </button>
      <span
        id={id}
        role="tooltip"
        className="absolute left-0 bottom-full mb-1.5 z-50 hidden group-hover:block group-focus-within:block w-60 bg-surface-800 border border-surface-600 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed pointer-events-none shadow-xl whitespace-normal"
      >
        {text}
      </span>
    </span>
  )
}
