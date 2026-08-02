import { SiteHeader } from "@/components/site-header"
import { PostVehicleWizard } from "@/components/post/post-vehicle-wizard"

export default function PostVehiclePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="px-4 sm:px-6">
          <PostVehicleWizard />
        </div>
      </main>
    </div>
  )
}
