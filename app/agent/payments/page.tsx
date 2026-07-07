"use client"

import { useState } from 'react'
import { CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck, Landmark, CheckCircle2, DollarSign, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AgentPaymentsPage() {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('telebirr')
  const [subscribing, setSubscribing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setStatusMsg(`Successfully initiated withdrawal of ETB ${amount} via ${selectedMethod.toUpperCase()}!`)
    setAmount('')
    setTimeout(() => setStatusMsg(''), 4000)
  }

  const transactions = [
    { id: 'tx1', desc: 'Listing Fee: Modern Bole Apartment', amount: -250, date: '2026-07-06', status: 'Completed', method: 'Telebirr' },
    { id: 'tx2', desc: 'Premium Ad Upgrade: Luxury Villa', amount: -500, date: '2026-07-04', status: 'Completed', method: 'Chapa' },
    { id: 'tx3', desc: 'Agent Commission: Bole Apartment Sale', amount: 15000, date: '2026-06-28', status: 'Completed', method: 'CBE Birr' },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments & Billings</h1>
        <p className="text-sm text-slate-500">Track listing fees, premium feature upgrades, and withdraw agent commissions.</p>
      </div>

      {statusMsg && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Wallet Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Wallet Balance Card */}
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-32 w-32 rounded-full bg-orange-500/10" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Balance</span>
            <Wallet className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold">ETB 14,250</h2>
            <p className="text-xs text-slate-400 mt-1">Available for withdrawal</p>
          </div>
        </div>

        {/* System Fee Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Platform Fee</span>
            <ShieldCheck className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">2.5%</h2>
            <p className="text-xs text-slate-500 mt-1">Applied per completed transaction</p>
          </div>
        </div>

        {/* Subscription Plan Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Plan</span>
            <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold">Standard</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Free Tier</h2>
            <p className="text-xs text-slate-500 mt-1">Max 5 active property listings</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Withdraw Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Withdraw Funds</h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Payment Network</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'telebirr', name: 'Telebirr', icon: QrCode },
                  { id: 'chapa', name: 'Chapa', icon: CreditCard },
                  { id: 'cbe', name: 'CBE Birr', icon: Landmark },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMethod(item.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${selectedMethod === item.id ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300'}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Withdrawal Amount (ETB)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="rounded-xl"
              />
            </div>

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
              Withdraw to {selectedMethod.toUpperCase()}
            </Button>
          </form>
        </div>

        {/* Premium upgrades/billing Simulation */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 mb-2">Upgrade Account to Premium</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Boost your sales by unlocking unlimited listings, detailed lead analytics, featured badges, and instant matching notifications.</p>
            <div className="mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-950">Premium Agent Plan</p>
                <p className="text-[10px] text-orange-700">ETB 499 / month</p>
              </div>
              <button
                onClick={() => {
                  setSubscribing(true)
                  setTimeout(() => {
                    setSubscribing(false)
                    setStatusMsg('Premium plan upgrade successful!')
                  }, 1500)
                }}
                disabled={subscribing}
                className="rounded-xl bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 text-xs font-semibold"
              >
                {subscribing ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Telebirr &amp; Chapa</span>
            <span>Secured TLS 1.3</span>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Transaction History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">Transaction</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="text-slate-700">
                  <td className="py-3 text-slate-900">{tx.desc}</td>
                  <td className="py-3 text-slate-500 text-xs">{tx.date}</td>
                  <td className="py-3 text-xs">{tx.method}</td>
                  <td className="py-3 text-xs">
                    <span className="rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5">
                      {tx.status}
                    </span>
                  </td>
                  <td className={`py-3 text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? `+ETB ${tx.amount}` : `-ETB ${Math.abs(tx.amount)}`}
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
