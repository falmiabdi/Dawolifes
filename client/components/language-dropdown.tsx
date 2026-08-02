"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { LANGUAGES, useI18n, type Language } from "@/lib/i18n"

interface LanguageDropdownProps {
  dark?: boolean
  className?: string
}

export function LanguageDropdown({ dark, className }: LanguageDropdownProps) {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          dark ? "bg-black/30 text-white" : "border border-slate-200 bg-white text-slate-700"
        }`}
        aria-label="Change language"
      >
        {current.label}
        <ChevronDown className={`h-3.5 w-3.5 ${open ? "rotate-180" : ""} transition-transform`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code as Language)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-orange-50 ${
                l.code === lang ? "font-semibold text-orange-600" : "text-slate-700"
              }`}
            >
              <span>{l.label}</span>
              {l.code === lang && <span className="text-xs text-orange-500">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
