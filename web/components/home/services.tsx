import { Briefcase, Check } from "lucide-react"
import { services } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

export function Services() {
  const { t } = useI18n()

  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316]">
          <Briefcase className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">{t("our_service")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("services_subtitle")}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.titleKey}
            className="rounded-2xl border border-border bg-card p-6 text-left transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F97316]/10 text-[#F97316]">
                <Check className="h-3 w-3" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{t(service.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(service.descriptionKey)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
