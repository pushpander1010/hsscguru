// app/practice/start/page.tsx
import { Suspense } from "react";
import StartClient from "./start-client";

export const dynamic = "force-dynamic"; // keeps export/prerender from choking

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <StartClient />
    </Suspense>
  );
}
