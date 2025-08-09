// app/practice/start/start-client.tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function StartClient() {
  const sp = useSearchParams();
  const topic = sp.get("topic") ?? "";
  const n = sp.get("n") ?? "";

  // ...your existing UI that depends on topic/n
  return <div>Topic: {topic} | n: {n}</div>;
}
