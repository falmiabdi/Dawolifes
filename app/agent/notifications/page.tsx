import { Bell, Clock, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

const mockNotifications = [
  {
    id: 'n1',
    title: 'Registration Submitted Successfully',
    description: 'Your agent onboarding application is currently pending admin review. We will notify you as soon as your account is approved.',
    type: 'info',
    time: 'Just now',
  },
  {
    id: 'n2',
    title: 'Welcome to DelaHarme!',
    description: 'Thank you for registering on our platform. Explore your dashboard and read our onboarding guides to get started.',
    type: 'success',
    time: '2 hours ago',
  }
]

export default function AgentNotificationsPage() {
  const iconConfig = {
    info: { icon: Info, color: 'text-blue-500 bg-blue-50 border-blue-100' },
    success: { icon: CheckCircle2, color: 'text-green-500 bg-green-50 border-green-100' },
    warning: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 border-amber-100' },
    error: { icon: AlertCircle, color: 'text-red-500 bg-red-50 border-red-100' },
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">System updates, listing approvals, and announcements.</p>
      </div>

      <div className="space-y-4">
        {mockNotifications.map((notif) => {
          const cfg = iconConfig[notif.type as keyof typeof iconConfig] || iconConfig.info
          const Icon = cfg.icon
          return (
            <div key={notif.id} className={`flex gap-4 p-5 rounded-3xl border ${cfg.color} bg-white shadow-sm transition hover:shadow-md`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">{notif.title}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
