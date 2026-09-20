/** ISBN-uppslag i Libris (Sveriges nationella katalog). Server-only. */

function firstString(value: unknown): string {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  return typeof value === "string" ? value : "";
}

function normalizeWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

async function attempt(query: string, withMaterialFilter: boolean): Promise<string> {
  const url =
    `https://libris.kb.se/xsearch?query=${encodeURIComponent(query)}&format=json&n=20` +
    (withMaterialFilter ? "&materialtype=book" : "");
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return "";
  const payload = (await res.json()) as { xsearch?: { list?: Record<string, unknown>[] } };
  const list = payload.xsearch?.list ?? [];
  const wanted = normalizeWords(query);

  const scored = list
    .filter((row) => {
      // Behåll vanliga bokposter – även e-böcker döljs inte längre.
      const type = firstString(row["type"]);
      return !type || type === "book" || type === "E-book";
    })
    .map((row) => {
      const isbn = firstString(row["isbn"]).replace(/[^0-9Xx]/g, "").toUpperCase();
      if (isbn.length !== 10 && isbn.length !== 13) return null;
      const rowTitle = normalizeWords(firstString(row["title"]));
      const overlap = wanted.filter((w) => rowTitle.includes(w)).length;
      return { isbn, overlap, length: isbn.length };
    })
    .filter((r): r is { isbn: string; overlap: number; length: number } => r !== null)
    .filter((r) => wanted.length === 0 || r.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.length - a.length);

  return scored[0]?.isbn ?? "";
}

/** Slår upp ISBN utifrån titel (och gärna författare). Försöker först med bokfilter, sedan utan. */
export async function isbnFromLibris(title: string, author: string): Promise<string> {
  const query = [title, author].filter(Boolean).join(" ");
  if (!query) return "";
  try {
    const withFilter = await attempt(query, true);
    if (withFilter) return withFilter;
    return await attempt(query, false);
  } catch {
    return "";
  }
}
