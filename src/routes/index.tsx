import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Camera, ChevronRight, ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChannelLinks } from "@/components/ChannelLinks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBooks } from "@/hooks/useBooks";
import { DEWEY_GROUPS, normalizeIsbn, ystadLibraryUrl } from "@/lib/books";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Köp/Låna – in läslista" },
      {
        name: "description",
        content:
          "Fotografera bokomslag, samla titel, författare, ISBN, kategori och Dewey i en sökbar läslista med länk till Ystads bibliotek.",
      },
      { property: "og:title", content: "Köp/Låna – in läslista" },
      {
        property: "og:description",
        content: "Din egen läslista: fotografera omslaget, sök och hitta boken på biblioteket.",
      },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { books } = useBooks();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("alla");
  const [dewey, setDewey] = useState("alla");
  const [sort, setSort] = useState("nyast");

  const categories = useMemo(
    () => Array.from(new Set(books.map((b) => b.category).filter(Boolean))).sort(),
    [books],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qIsbn = normalizeIsbn(query);
    const filtered = books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (qIsbn.length > 2 && normalizeIsbn(book.isbn).includes(qIsbn));
      const matchesCategory = category === "alla" || book.category === category;
      const matchesDewey = dewey === "alla" || book.deweyCode.trim().startsWith(dewey);
      return matchesQuery && matchesCategory && matchesDewey;
    });

    return filtered.sort((a, b) => {
      if (sort === "titel") return a.title.localeCompare(b.title, "sv");
      if (sort === "forfattare") return a.author.localeCompare(b.author, "sv");
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [books, query, category, dewey, sort]);

  return (
    <AppShell>
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-5xl font-extrabold tracking-tight">Köp/Låna</h1>
        <p className="mt-1 text-muted-foreground">In läslista</p>
      </header>

      <div className="space-y-3 px-5">
        <div className="relative">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök titel, författare, ISBN"
            className="h-12 rounded-full bg-card pl-10"
            aria-label="Sök i läslistan"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 w-auto rounded-full bg-secondary" aria-label="Kategori">
              <SelectValue>{category === "alla" ? "Kategori" : category}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">Alla kategorier</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dewey} onValueChange={setDewey}>
            <SelectTrigger className="h-10 w-auto rounded-full bg-secondary" aria-label="Dewey">
              <SelectValue>{dewey === "alla" ? "Dewey" : `${dewey}00-tal`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alla">All Dewey</SelectItem>
              {DEWEY_GROUPS.map((g) => (
                <SelectItem key={g.code} value={g.code}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 w-auto rounded-full bg-secondary" aria-label="Sortering">
              <SelectValue>
                {sort === "titel" ? "Titel A–Ö" : sort === "forfattare" ? "Författare A–Ö" : "Senast tillagd"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nyast">Senast tillagd</SelectItem>
              <SelectItem value="titel">Titel A–Ö</SelectItem>
              <SelectItem value="forfattare">Författare A–Ö</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="mt-12 px-5 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-xl">Läslistan är tom</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fotografera ett bokomslag och fyll i titel, författare och ISBN.
          </p>
          <Button asChild className="mt-5">
            <Link to="/lagg-till">
              <Camera className="size-4" />
              Lägg till din första bok
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {visible.map((book) => (
            <li key={book.id} className="flex flex-col px-5 py-4">
              <Link
                to="/bok/$id"
                params={{ id: book.id }}
                className="flex items-center gap-4 transition-colors hover:bg-secondary/60"
              >
                <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="size-5 text-muted-foreground" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">{book.title}</h2>
                  <p className="truncate text-sm text-muted-foreground">{book.author}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {book.category ? <Badge variant="secondary">{book.category}</Badge> : null}
                    {book.deweyCode ? <Badge variant="secondary">{book.deweyCode}</Badge> : null}
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button asChild size="sm" variant="outline">
                  <a
                    href={ystadLibraryUrl(book)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Sök ${book.title} på Ystads bibliotek`}
                  >
                    <ExternalLink className="size-4" />
                    Sök på Ystads bibliotek
                  </a>
                </Button>
                <ChannelLinks book={book} size="sm" label="Kanaler och förlag" />
              </div>
            </li>
          ))}
          {visible.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-muted-foreground">
              Ingen bok matchar sökningen.
            </li>
          ) : null}
        </ul>
      )}
    </AppShell>
  );
}
