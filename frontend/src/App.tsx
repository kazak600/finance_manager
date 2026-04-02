function App() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-3 text-3xl font-semibold text-slate-900">
          Finance Manager MVP
        </h1>
        <p className="mb-6 text-slate-600">
          Frontend bootstrap complete: React + TypeScript + Tailwind CSS.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>UI shell is ready for calendar, stats, and balance screens.</li>
          <li>Tailwind is configured in `src/index.css` and `tailwind.config.js`.</li>
          <li>Cloudflare Worker API lives in the `backend` workspace.</li>
        </ul>
      </div>
    </main>
  )
}

export default App
