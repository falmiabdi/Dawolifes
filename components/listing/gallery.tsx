"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function Gallery({ images, title, badge }: { images: string[]; title: string; badge: string }) {
  const [active, setActive] = useState(0)

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={images[active] || "/placeholder.svg"}
          alt={`${title} photo ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 700px"
          className="object-cover"
        />
        <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      </div>

      <div className="mt-3 flex gap-3">
        {images.map((img, i) => (
          <button
            key={img}
            onClick={() => setActive(i)}
            className={cn(
              "relative aspect-square w-20 overflow-hidden rounded-xl border-2 transition-colors",
              active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
            )}
            aria-label={`View photo ${i + 1}`}
          >
            <Image src={img || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
