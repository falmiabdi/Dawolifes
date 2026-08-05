import { Suspense } from "react"
import { WebHome } from "@/components/site/web-home"

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <WebHome />
    </Suspense>
  )
}
