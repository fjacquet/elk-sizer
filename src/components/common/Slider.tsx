import { useId } from 'react'
import { Tooltip } from './Tooltip'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  tooltip?: string
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step = 1, unit = '', tooltip, onChange }: SliderProps) {
  const id = useId()
  return (
    <div className="input-group">
      <div className="flex justify-between">
        <label htmlFor={id} className="label">
          {tooltip ? <Tooltip text={tooltip}>{label}</Tooltip> : label}
        </label>
        <span className="text-sm text-primary-400 font-mono">
          {value.toLocaleString()}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
    </div>
  )
}
