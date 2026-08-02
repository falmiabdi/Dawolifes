"use client"

import { useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { LanguageDropdown } from "@/components/language-dropdown"
import { useI18n } from "@/lib/i18n"

const categoryOptions = [
  { value: "", label: "all" },
  { value: "House", label: "House" },
  { value: "Apartment", label: "Apartment" },
  { value: "Villa", label: "Villa" },
  { value: "Land", label: "Land" },
  { value: "Commercial", label: "Commercial" },
  { value: "Studio", label: "Studio" },
  { value: "Penthouse", label: "Penthouse" },
  { value: "Vehicle", label: "Vehicle" },
]

const CATEGORY_LABELS: Record<string, string> = {
  House: "House",
  Apartment: "Apartment",
  Villa: "Villa",
  Land: "Land",
  Commercial: "Commercial",
  Studio: "Studio",
  Penthouse: "Penthouse",
  Vehicle: "Vehicle",
}

interface MobileHeaderProps {
  onSearch?: (value: string) => void
  onCategory?: (value: string) => void
}

export function MobileHeader({ onSearch, onCategory }: MobileHeaderProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")

  const handleSearch = () => {
    if (onSearch) onSearch(query)
  }

  const handleCategory = (value: string) => {
    setCategory(value)
    if (onCategory) onCategory(value)
  }

  return (
    <header
      className="sticky top-0 z-40 w-full bg-[#F97316]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="px-4 pb-4 pt-2">
        <div className="flex justify-end">
          <LanguageDropdown dark />
        </div>

        <h1 className="mt-3 text-center text-lg font-bold leading-snug text-white sm:text-xl">
          {t("what_you_do")}
        </h1>

        <div className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <select
              value={category}
              onChange={(e) => handleCategory(e.target.value)}
              className="h-12 w-full appearance-none rounded-full bg-white pl-4 pr-9 text-sm font-medium text-slate-800 outline-none"
              aria-label="Select category"
            >
              <option value="">{t("select")}</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {CATEGORY_LABELS[option.value] || option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
          </div>

          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
              placeholder={t("search_placeholder")}
              className="h-12 w-full rounded-full bg-white pl-4 pr-12 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              aria-label="Search listings"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900 text-white"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
