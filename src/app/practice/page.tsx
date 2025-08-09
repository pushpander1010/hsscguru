// app/practice/page.tsx
type SP = { topic?: string; n?: string };

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<SP>; // <-- important on Next 15
}) {
  const sp = await searchParams;      // <-- await it
  const topic = sp?.topic ?? "";
  const n = sp?.n ?? "";

  // ...server-rendered UI (no client hooks here)
  return <div>Practice: {topic} | n: {n}</div>;
}
