import { Check } from "lucide-react"

const cards = [
  { label: "our Service", bg: "#F6A19A" },
  { label: "How to Buy", bg: "#7FBF6B" },
  { label: "How to Sell", bg: "#B6A63C" },
]

export function ServiceCards() {
  return (
    <section className="bg-white px-4 pt-3">
      <div className="flex gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex flex-1 items-center gap-2 rounded-xl px-2.5 py-2.5"
            style={{ backgroundColor: card.bg }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="text-[11px] font-bold leading-tight text-black">{card.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
