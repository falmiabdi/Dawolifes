import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  description?: string
  icon: LucideIcon
  colorClass?: string
  bgClass?: string
}

export function StatsCard({ label, value, description, icon: Icon, colorClass = 'text-orange-500', bgClass = 'bg-orange-50' }: StatsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgClass} ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {description && <p className="mt-1 text-xs text-slate-400 font-medium">{description}</p>}
      </div>
    </div>
  )
}
