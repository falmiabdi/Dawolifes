import { redirect } from 'next/navigation'
import { Users, User, Shield, Clock, Trash2, Calendar, ShieldCheck } from 'lucide-react'
import { getServerSession } from '@/lib/auth-session'
import { connectToDatabase } from '@/lib/db'
import { UserModel } from '@/lib/models/user'
import { StatusBadge } from '@/components/ui/status-badge'
import { UserDeleteButton } from './delete-button'

export default async function AdminUsersPage() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect('/login')
  }

  await connectToDatabase()
  const users = await UserModel.find().sort({ createdAt: -1 }).lean()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">User Catalog Management</h1>
        <p className="text-sm text-slate-500">Monitor all administrators, agents, and client accounts registered on DelaHarme.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <h2 className="font-bold text-slate-900 mb-4">Database Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">User</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Registered At</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u: any) => (
                <tr key={u._id.toString()}>
                  <td className="py-3.5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold text-xs">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-900">{u.username}</span>
                  </td>
                  <td className="py-3.5 text-xs text-slate-500">{u.email}</td>
                  <td className="py-3.5 text-xs">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${u.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-orange-50 text-orange-700'}`}>
                      {u.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-xs">
                    <StatusBadge status={u.status || 'Pending'} />
                  </td>
                  <td className="py-3.5 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 text-right">
                    {u.email !== 'felmitesfaye@gmail.com' ? (
                      <UserDeleteButton id={u._id.toString()} />
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Root Owner</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
