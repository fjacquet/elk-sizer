interface CardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`panel ${className}`}>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}
