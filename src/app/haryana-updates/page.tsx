// src/app/haryana-updates/page.tsx
export const revalidate = 1800; // ISR: refresh every 30 mins

import Link from "next/link";
import PageShell from "@/components/PageShell";

type FeedItem = {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
};

const FEEDS = [
  {
    source: "The Tribune - Haryana",
    url: "https://publish.tribuneindia.com/state/haryana/feed/", // RSS
  },
  {
    source: "Punjab Newsline - Haryana",
    url: "https://www.punjabnewsline.com/rssfeed/rss-haryana.xml", // RSS
  },
];

// ultra-light XML helpers (RSS 2.0 style)
function pick(text: string, tag: string) {
  const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : null;
}

// extract <item>...</item> blocks
function items(xml: string) {
  const rx = /<item>([\s\S]*?)<\/item>/gi;
  const out: string[] = [];
  let m;
  while ((m = rx.exec(xml)) !== null) out.push(m[1]);
  return out;
}

async function fetchFeed(url: string, source: string): Promise<FeedItem[]> {
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const xml = await res.text();

  return items(xml).map((it) => {
    // prefer <title>, <link>, <pubDate>, fallback to DC/date tags
    const title = (pick(it, "title") || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const link =
      (pick(it, "link") ||
        pick(it, "guid") ||
        "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const pubDate =
      pick(it, "pubDate") ||
      pick(it, "updated") ||
      pick(it, "dc:date") ||
      undefined;

    return { title, link, pubDate, source };
  });
}

function fmtDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleString();
}

export default async function HaryanaUpdatesPage() {
  // fetch all feeds in parallel; ignore any that error
  const results = await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const items = await fetchFeed(f.url, f.source);
        return items.slice(0, 10); // top 10 per feed
      } catch {
        return [] as FeedItem[];
      }
    })
  );

  // flatten + sort by date desc (unknown dates go last)
  const all: FeedItem[] = results.flat();
  all.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  return (
    <PageShell
      title="Haryana Updates"
      subtitle="Latest headlines from trusted publishers. Refreshed every ~30 minutes."
      actions={
        <Link className="btn-ghost" href="/">
          ← Back to Dashboard
        </Link>
      }
    >
      {all.length === 0 ? (
        <div className="card">
          <p className="muted">No stories right now. Try again soon.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {all.map((item, i) => (
            <article key={i} className="card">
              <a
                href={item.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {item.title || "(no title)"}
              </a>
              <div className="text-xs muted mt-1">
                {item.source} {item.pubDate ? `• ${fmtDate(item.pubDate)}` : ""}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="text-xs muted pt-4">
        Sources: The Tribune (Haryana), Punjab Newsline (Haryana).
      </div>
    </PageShell>
  );
}
