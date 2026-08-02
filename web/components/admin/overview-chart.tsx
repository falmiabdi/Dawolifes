"use client"

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Jan', Agents: 4, Listings: 12, Revenue: 2000 },
  { name: 'Feb', Agents: 7, Listings: 18, Revenue: 3500 },
  { name: 'Mar', Agents: 12, Listings: 26, Revenue: 5000 },
  { name: 'Apr', Agents: 15, Listings: 32, Revenue: 7200 },
  { name: 'May', Agents: 24, Listings: 45, Revenue: 11000 },
  { name: 'Jun', Agents: 30, Listings: 60, Revenue: 15000 },
  { name: 'Jul', Agents: 42, Listings: 82, Revenue: 19500 },
]

export function OverviewChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-80 w-full items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl">
        Loading chart analytics...
      </div>
    )
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="Listings"
            stroke="#f97316"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorListings)"
          />
          <Area
            type="monotone"
            dataKey="Revenue"
            stroke="#0f172a"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
