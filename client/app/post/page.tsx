import { SiteHeader } from "@/components/site-header"
import { PostWizard } from "@/components/post/post-wizard"

export default function PostPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="px-4 sm:px-6">
          <PostWizard />
        </div>
      </main>
    </div>
  )
}
