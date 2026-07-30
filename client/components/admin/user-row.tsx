import { Shield, User } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { UserDeleteButton } from '@/app/admin/users/delete-button'

interface UserRowProps {
  user: {
    _id: { toString(): string }
    username: string
    email: string
    role: string
    status?: string
    createdAt: string | Date
  }
  isProtected?: boolean
  variant?: 'card' | 'table'
}

export function UserRow({ user, isProtected = false, variant = 'card' }: UserRowProps) {
  const avatar = (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold text-xs">
      {user.username.charAt(0).toUpperCase()}
    </div>
  )

  const roleBadge = (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
        user.role === 'admin'
          ? 'bg-slate-900 text-white'
          : 'bg-orange-50 text-orange-700'
      }`}
    >
      {user.role === 'admin' ? (
        <Shield className="h-3 w-3" />
      ) : (
        <User className="h-3 w-3" />
      )}
      {user.role}
    </span>
  )

  if (variant === 'table') {
    return (
      <tr className="divide-y divide-slate-100 font-medium text-slate-700">
        <td className="py-3.5 flex items-center gap-3">
          {avatar}
          <span className="font-bold text-slate-900">{user.username}</span>
        </td>
        <td className="py-3.5 text-xs text-slate-500">{user.email}</td>
        <td className="py-3.5 text-xs">{roleBadge}</td>
        <td className="py-3.5 text-xs">
          <StatusBadge status={user.status || 'Pending'} />
        </td>
        <td className="py-3.5 text-xs text-slate-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </td>
        <td className="py-3.5 text-right">
          {isProtected ? (
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Root Owner</span>
          ) : (
            <UserDeleteButton id={user.id.toString()} />
          )}
        </td>
      </tr>
    )
  }

  return (
    <div className="py-4 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {avatar}
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate text-sm">{user.username}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        {roleBadge}
      </div>
      <div className="flex items-center justify-between pl-12">
        <div className="flex items-center gap-3">
          <StatusBadge status={user.status || 'Pending'} />
          <span className="text-[10px] text-slate-400">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
        {isProtected ? (
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Root Owner</span>
        ) : (
          <UserDeleteButton id={user.id.toString()} />
        )}
      </div>
    </div>
  )
}
