"use client"

import { useI18n } from "@/lib/i18n"
import { FileText } from "lucide-react"

export default function AgentPrivacyPolicyPage() {
  const { t } = useI18n()
  const content = t("privacy_policy_full")

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-orange-600 font-bold">
          <FileText className="h-5 w-5" />
          <h1 className="text-2xl text-slate-900">{t("privacy_policy")}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("agent_portal")}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {content}
        </div>
      </div>
    </div>
  )
}
