"use client"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F97316]/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">This page couldn't load</h1>
          <p className="mt-2 text-sm text-slate-500">Reload to try again or go back.</p>
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white active:opacity-90"
            >
              Reload
            </button>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back()
                } else {
                  window.location.href = "/"
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 active:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
