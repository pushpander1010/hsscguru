// src/app/haryana-updates/page.tsx
export const revalidate = 1800; // ISR: refresh every 30 mins

import Link from "next/link";
import PageShell from "@/components/PageShell";

type FeedItem = {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
  image?: string | null;
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

// try to find a thumbnail url inside an RSS <item> snippet
function extractImage(itemXml: string): string | null {
  // <enclosure url="..." type="image/jpeg" />
  let m = itemXml.match(/<enclosure[^>]*\surl=["']([^"']+)["'][^>]*>/i);
  if (m && m[1]) return m[1];
  // <media:content url="..." .../>, <media:thumbnail url="..."/>
  m = itemXml.match(/<media:(?:content|thumbnail)[^>]*\surl=["']([^"']+)["'][^>]*>/i);
  if (m && m[1]) return m[1];
  // <img src="..."> inside <description> or <content:encoded>
  const blob =
    pick(itemXml, "description") ||
    pick(itemXml, "content:encoded") ||
    "";
  m = blob.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  if (m && m[1]) return m[1];
  return null;
}

async function fetchOgImage(link: string): Promise<string | null> {
  if (!link) return null;
  try {
    const res = await fetch(link, {
      // cache OG lookups for a day to reduce load
      next: { revalidate: 86400 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // og:image
    let m = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (m && m[1]) return m[1];
    m = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
    if (m && m[1]) return m[1];
    // twitter image
    m = html.match(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (m && m[1]) return m[1];
    return null;
  } catch {
    return null;
  }
}

async function fetchFeed(url: string, source: string): Promise<FeedItem[]> {
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const xml = await res.text();

  const nodes = items(xml);
  const mapped = await Promise.all(
    nodes.map(async (it) => {
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
      let image = extractImage(it);
      if (!image) {
        image = await fetchOgImage(link);
      }
      return { title, link, pubDate, source, image } as FeedItem;
    })
  );
  return mapped;
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
    <main className="mx-auto max-w-3xl p-6">
      <div className="card bg-gradient-to-br from-brand-500/10 to-purple-600/10 border-brand-500/20 mb-8">
        <h1 className="text-2xl font-semibold mb-2 text-brand-400">Haryana Updates</h1>
        <p className="muted mb-4">Latest headlines from trusted publishers. Refreshed every ~30 minutes.</p>
        <Link className="btn-ghost" href="/">
          ← Back to Dashboard
        </Link>
      </div>
      {all.length === 0 ? (
        <div className="card">
          <p className="muted">No stories right now. Try again soon.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {all.map((item, i) => (
            <article key={i} className="card bg-gradient-to-br from-purple-500/10 to-brand-500/10 border-purple-500/20">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image || "/globe.svg"}
                  alt="thumbnail"
                  className="h-16 w-24 rounded object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <a
                    href={item.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline line-clamp-2 text-brand-400"
                  >
                    {item.title || "(no title)"}
                  </a>
                  <div className="text-xs muted mt-1">
                    {item.source} {item.pubDate ? `• ${fmtDate(item.pubDate)}` : ""}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="text-xs muted pt-4">
        Sources: The Tribune (Haryana), Punjab Newsline (Haryana).
      </div>
    </main>
  );
}
