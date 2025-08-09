// app/practice/start/page.tsx
export const dynamic = "force-dynamic"; // optional but helpful during export

type SP = { topic?: string; n?: string };

export default async function Page({
  searchParams,
}: {
  // In Next 15, searchParams is a Promise
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const topic = sp?.topic ?? "";
  const n = sp?.n ?? "";

  // ...render server JSX using topic/n (no useSearchParams)
  return <div>Topic: {topic} | n: {n}</div>;
}
