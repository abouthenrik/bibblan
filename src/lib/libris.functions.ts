import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  query: z.string().min(2).max(200),
});

export type LibrisHit = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  year: string;
  publisher: string;
  deweyCode: string;
  librisUrl: string;
};

function first(value: unknown): string {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  return typeof value === "string" ? value : "";
}

function cleanTitle(raw: string): string {
  return raw.replace(/\s*\/\s*$/, "").trim();
}

function cleanAuthor(raw: string): string {
  const name = raw.split(",").slice(0, 2).join(",").trim();
  const parts = name.split(",").map((p) => p.trim());
  if (parts.length === 2 && !/^\d/.test(parts[1] ?? "")) return `${parts[1]} ${parts[0]}`;
  return parts[0] ?? "";
}

async function deweyLookup(query: string): Promise<string> {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${query}&limit=1&fields=ddc`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { docs?: { ddc?: string[] }[] };
    const codes = data.docs?.[0]?.ddc ?? [];
    return codes.find((c) => /^\d/.test(c)) ?? "";
  } catch {
    return "";
  }
}

async function deweyFor(hit: { isbn: string; title: string; author: string }): Promise<string> {
  if (hit.isbn) {
    const byIsbn = await deweyLookup(`isbn=${encodeURIComponent(hit.isbn)}`);
    if (byIsbn) return byIsbn;
  }
  if (hit.title) {
    const q = [hit.title, hit.author].filter(Boolean).join(" ");
    return deweyLookup(`q=${encodeURIComponent(q)}`);
  }
  return "";
}

export const searchLibris = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ hits: LibrisHit[] }> => {
    const url = `https://libris.kb.se/xsearch?query=${encodeURIComponent(
      data.query,
    )}&format=json&n=20&materialtype=book`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Libris svarade inte just nu (${res.status}). Försök igen om en stund.`);
    }

    const payload = (await res.json()) as {
      xsearch?: { list?: Record<string, unknown>[] };
    };

    const raw = (payload.xsearch?.list ?? []).filter((r) => {
      const type = first(r["type"]);
      return !type || type === "book";
    });

    const hits: LibrisHit[] = raw.slice(0, 10).map((r) => {
      const identifier = first(r["identifier"]);
      return {
        id: identifier || Math.random().toString(36).slice(2),
        title: cleanTitle(first(r["title"])),
        author: cleanAuthor(first(r["creator"])),
        isbn: first(r["isbn"]).replace(/[^0-9Xx]/g, "").toUpperCase(),
        year: first(r["date"]),
        publisher: first(r["publisher"]),
        deweyCode: "",
        librisUrl: identifier.startsWith("http") ? identifier : "https://libris.kb.se",
      };
    });

    const deweys = await Promise.all(hits.map((h) => deweyFor(h)));
    return { hits: hits.map((h, i) => ({ ...h, deweyCode: deweys[i] ?? "" })) };
  });
