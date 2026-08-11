import { ShoppingBag } from "lucide-react"
import { buySteps } from "@/lib/data"
import { useI18n } from "@/lib/i18n"

export function HowToBuy() {
  const { t } = useI18n()

  return (
    <section id="how-to-buy" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316]">
          <ShoppingBag className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">{t("how_to_buy")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("how_to_buy_subtitle")}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {buySteps.map((step, index) => (
          <div
            key={step.titleKey}
            className="relative rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F97316] text-xs font-bold text-white">
              {index + 1}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-foreground">{t(step.titleKey)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.descriptionKey)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
