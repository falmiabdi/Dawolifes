"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect } from "react"

import {
  CreditCard, TrendingUp, Download, ShieldCheck, RefreshCw,
  Clock, CheckCircle2, XCircle, Filter,
} from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"

interface Payment {
  _id: string
  orderId: string
  title: string
  amount: number
  status: string
  method: string
  paymentType: string
  buyerPhone: string
  createdAt: string
  user?: { fullName: string; username: string } | null
}

interface PaymentStats {
  totalRevenue: number
  completedCount: number
  pendingCount: number
  failedCount: number
  totalCount: number
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0, completedCount: 0, pendingCount: 0, failedCount: 0, totalCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  async function fetchPayments() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ role: "admin", page: String(page), limit: "15" })
      if (filter) params.set("status", filter)

      const res = await fetch(`${getApiUrl()}/api/payments?${params}`)
      const data = await res.json()
      setPayments(data.payments || [])
      setStats(data.stats || { totalRevenue: 0, completedCount: 0, pendingCount: 0, failedCount: 0, totalCount: 0 })
      setTotalPages(data.totalPages || 1)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [page, filter])

  function exportCSV() {
    const headers = ["Agent", "Description", "Date", "Method", "Type", "Status", "Amount"]
    const rows = payments.map((tx) => [
      tx.user?.fullName || "Direct",
      tx.title,
      new Date(tx.createdAt).toLocaleDateString(),
      tx.method,
      tx.paymentType,
      tx.status,
      `ETB ${tx.amount}`,
    ])
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dawolife-payments-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Payments & Earnings</h1>
          <p className="text-sm text-slate-500">Monitor all TeleBirr transaction logs and commission payments.</p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Revenue"
          value={`ETB ${stats.totalRevenue.toLocaleString()}`}
          description="From completed payments"
          icon={TrendingUp}
          colorClass="text-green-500"
          bgClass="bg-green-50"
        />
        <StatsCard
          label="Completed Payments"
          value={stats.completedCount}
          description="Successfully processed"
          icon={CheckCircle2}
          colorClass="text-green-500"
          bgClass="bg-green-50"
        />
        <StatsCard
          label="Pending Payments"
          value={stats.pendingCount}
          description="Awaiting confirmation"
          icon={Clock}
          colorClass="text-yellow-500"
          bgClass="bg-yellow-50"
        />
        <StatsCard
          label="Total Transactions"
          value={stats.totalCount}
          description="All time"
          icon={CreditCard}
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {["", "Completed", "Pending", "Failed"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              filter === f
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      {/* Transaction Log Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">All Transactions</h3>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading transactions...
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CreditCard className="h-8 w-8 mb-2" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-slate-100">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3">Agent/User</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {payments.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3.5 font-bold text-slate-900">
                        {tx.user?.fullName || tx.user?.username || "Direct Payment"}
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 max-w-[200px] truncate">{tx.title}</td>
                      <td className="py-3.5 text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          {tx.paymentType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs">
                        <span
                          className={`rounded-full px-2.5 py-0.5 border ${
                            tx.status === "Completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : tx.status === "Pending"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-green-600">
                        +ETB {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

