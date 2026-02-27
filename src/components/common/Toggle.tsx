import { Tooltip } from './Tooltip'

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  tooltip?: string
}

export function Toggle({ label, checked, onChange, tooltip }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            checked ? 'bg-primary-500' : 'bg-surface-700'
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
      <span className="text-sm text-slate-300">
        {tooltip ? <Tooltip text={tooltip}>{label}</Tooltip> : label}
      </span>
    </label>
  )
}
