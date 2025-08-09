// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="mt-10 border-t">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} HSSC Guru</div>
        <div className="flex items-center gap-3">
          <a className="hover:underline" href="/jobs">Jobs</a>
          <a className="hover:underline" href="/notes">Notes</a>
          <a className="hover:underline" href="/haryana-updates">Haryana Updates</a>
          <a className="hover:underline" href="/tests">Mocks</a>
        </div>
      </div>
    </footer>
  );
}
