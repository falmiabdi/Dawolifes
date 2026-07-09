"use client"

import { useState } from 'react'
import {
  CreditCard, TrendingUp, Download, ShieldCheck
} from 'lucide-react'
import { StatsCard } from '@/components/admin/stats-card'

export default function AdminPaymentsPage() {
  const transactions = [
    { id: 'tx1', agent: 'Abebe Girma', desc: 'Listing Fee: Villa in Bole', amount: 250, date: '2026-07-07', status: 'Completed', method: 'Telebirr' },
    { id: 'tx2', agent: 'Almaz Kassa', desc: 'Premium Plan Upgrade', amount: 499, date: '2026-07-06', status: 'Completed', method: 'Chapa' },
    { id: 'tx3', agent: 'Bekele Shiferaw', desc: 'Listing Fee: Apartment', amount: 250, date: '2026-07-04', status: 'Completed', method: 'CBE Birr' },
    { id: 'tx4', agent: 'Derartu Tulu', desc: 'Premium Plan Upgrade', amount: 499, date: '2026-07-02', status: 'Completed', method: 'Telebirr' },
  ]

  const totalCollected = transactions.reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Payments & Earnings</h1>
        <p className="text-sm text-slate-500">Monitor all Telebirr, Chapa, and CBE Birr transaction logs and subscription packages.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Total Collected Revenue"
          value={`ETB ${totalCollected}`}
          description="From subscriptions & posting fees"
          icon={TrendingUp}
          colorClass="text-green-500"
          bgClass="bg-green-50"
        />
        <StatsCard
          label="Active Premium Subscriptions"
          value="2"
          description="Premium agent plan activations"
          icon={ShieldCheck}
          colorClass="text-blue-500"
          bgClass="bg-blue-50"
        />
        <StatsCard
          label="Total Transactions Logged"
          value={transactions.length}
          description="All networks combined"
          icon={CreditCard}
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
        />
      </div>

      {/* Transaction Log Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">All Transactions</h3>
          <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase">
                <th className="pb-3">Agent</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="py-3.5 font-bold text-slate-900">{tx.agent}</td>
                  <td className="py-3.5 text-xs text-slate-500">{tx.desc}</td>
                  <td className="py-3.5 text-xs text-slate-500">{tx.date}</td>
                  <td className="py-3.5 text-xs">{tx.method}</td>
                  <td className="py-3.5 text-xs">
                    <span className="rounded-full bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5">
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-bold text-green-600">
                    +ETB {tx.amount}
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
