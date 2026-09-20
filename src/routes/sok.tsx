import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink, Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ChannelLinks } from "@/components/ChannelLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deweyGroupLabel, newId, upsertBook, ystadLibraryUrl } from "@/lib/books";
import { searchLibris, type LibrisHit } from "@/lib/libris.functions";

export const Route = createFileRoute("/sok")({
  head: () => ({
    meta: [
      { title: "Sök all litteratur – Köp/Låna" },
      {
        name: "description",
        content:
          "Sök i Libris nationella bokkatalog, se Dewey-klassning och lägg boken direkt i din läslista.",
      },
      { property: "og:title", content: "Sök all litteratur – Köp/Låna" },
      {
        property: "og:description",
        content: "Sök i Libris, se Dewey och lägg boken i din läslista.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const run = useServerFn(searchLibris);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<LibrisHit[] | null>(null);

  const handleSearch = async () => {
    if (query.trim().length < 2) {
      toast.error("Skriv minst två tecken.");
      return;
    }
    setLoading(true);
    setHits(null);
    try {
      const result = await run({ data: { query: query.trim() } });
      setHits(result.hits);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sökningen misslyckades.");
    } finally {
      setLoading(false);
    }
  };

  const addToList = (hit: LibrisHit) => {
    upsertBook({
      id: newId(),
      title: hit.title,
      author: hit.author,
      isbn: hit.isbn,
      cover: null,
      category: "",
      deweyCode: hit.deweyCode,
      notes: hit.publisher ? `${hit.publisher} ${hit.year}`.trim() : "",
      createdAt: new Date().toISOString(),
    });
    toast.success("Boken är tillagd i läslistan.");
  };

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button asChild variant="ghost" size="icon" aria-label="Tillbaka">
          <Link to="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold tracking-tight">Sök all litteratur</h1>
      </header>

      <div className="space-y-4 px-5 pt-2">
        <p className="text-sm text-muted-foreground">
          Söker i Libris – Sveriges nationella katalog över böcker. Dewey hämtas när den finns.
        </p>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Titel, författare eller ISBN"
            aria-label="Sök i Libris"
          />
          <Button onClick={handleSearch} disabled={loading} aria-label="Sök">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </div>

        {hits && hits.length === 0 ? (
          <p className="border-y border-border py-6 text-sm text-muted-foreground">
            Inga träffar. Prova en annan stavning eller bara författarens namn.
          </p>
        ) : null}

        {hits && hits.length > 0 ? (
          <ul className="divide-y divide-border border-y border-border pb-6">
            {hits.map((hit) => (
              <li key={hit.id} className="space-y-3 py-4">
                <div>
                  <h2 className="text-lg font-semibold">{hit.title || "Utan titel"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[hit.author, hit.year].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                    {hit.deweyCode
                      ? `Dewey ${hit.deweyCode} – ${deweyGroupLabel(hit.deweyCode)}`
                      : "Dewey saknas"}
                    {hit.isbn ? ` · ISBN ${hit.isbn}` : ""}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Button onClick={() => addToList(hit)}>
                    <Plus className="size-4" />
                    Lägg i läslistan
                  </Button>
                  <ChannelLinks book={hit} size="default" label="Kanaler och förlag" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="default">
                      <a href={ystadLibraryUrl(hit)} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Ystad
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="default">
                      <a href={hit.librisUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Libris
                      </a>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
