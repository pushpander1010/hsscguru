// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl border p-8 md:p-12 bg-gradient-to-br from-emerald-50 to-white">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          Crack HSSC CET with confidence.
        </h1>
        <p className="mt-3 text-lg max-w-2xl">
          Practice topic-wise questions, take full-length mocks, and keep up
          with Haryana updates-all in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/practice" className="inline-flex items-center justify-center rounded px-4 py-2 text-white" style={{ background: "rgb(var(--brand))" }}>
            Start Practice
          </a>
          <a href="/tests" className="inline-flex items-center justify-center rounded px-4 py-2 border">
            Browse Mock Tests
          </a>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid md:grid-cols-3 gap-4">
        <a className="border rounded p-4 hover:bg-gray-50" href="/dashboard">
          <div className="font-semibold">Your Dashboard</div>
          <p className="text-sm opacity-80 mt-1">
            See your attempts, scores, and continue where you left off.
          </p>
        </a>
        <a className="border rounded p-4 hover:bg-gray-50" href="/haryana-updates">
          <div className="font-semibold">Haryana Updates</div>
          <p className="text-sm opacity-80 mt-1">
            Latest state news & notices-updated regularly.
          </p>
        </a>
        <a className="border rounded p-4 hover:bg-gray-50" href="/notes">
          <div className="font-semibold">Notes</div>
          <p className="text-sm opacity-80 mt-1">
            Concise theory, formulas, and revision boosters.
          </p>
        </a>
      </section>

      {/* Why section */}
      <section className="rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Why HSSC Guru?</h2>
        <ul className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
          <li className="border rounded p-4">
            <b>Practice by Topic.</b>
            <div className="opacity-80 mt-1">
              Target weak areas with random sets from chosen topics.
            </div>
          </li>
          <li className="border rounded p-4">
            <b>Mock Tests.</b>
            <div className="opacity-80 mt-1">
              Full-length tests with explanations and review.
            </div>
          </li>
          <li className="border rounded p-4">
            <b>Fresh Updates.</b>
            <div className="opacity-80 mt-1">
              Haryana news & job updates so you don't miss deadlines.
            </div>
          </li>
        </ul>
        <div className="mt-4">
          <a href="/tests" className="inline-flex items-center justify-center rounded px-4 py-2 border">
            See all Mocks
          </a>
        </div>
      </section>
    </main>
  );
}
