import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BookOpen, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBooks } from "@/hooks/useBooks";
import { suggestBooks, type Suggestion } from "@/lib/recommend.functions";

export const Route = createFileRoute("/forslag")({
  head: () => ({
    meta: [
      { title: "Vad vill du läsa? – Köp/Låna" },
      {
        name: "description",
        content:
          "Beskriv vad du är på humör för och få förslag på böcker ur din egen läslista i Köp/Låna.",
      },
      { property: "og:title", content: "Vad vill du läsa? – Köp/Låna" },
      {
        property: "og:description",
        content: "Beskriv din läslust och få förslag ur din egen läslista.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuggestPage,
});

function SuggestPage() {
  const { books } = useBooks();
  const run = useServerFn(suggestBooks);
  const [wish, setWish] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  const handleSubmit = async () => {
    if (wish.trim().length < 2) {
      toast.error("Skriv några ord om vad du vill läsa.");
      return;
    }
    if (books.length === 0) {
      toast.error("Läslistan är tom – lägg till en bok först.");
      return;
    }
    setLoading(true);
    setSuggestions(null);
    try {
      const result = await run({
        data: {
          wish: wish.trim(),
          books: books.slice(0, 200).map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            category: b.category,
            deweyCode: b.deweyCode,
            notes: b.notes,
          })),
        },
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Förslagen kunde inte hämtas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button asChild variant="ghost" size="icon" aria-label="Tillbaka">
          <Link to="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl">Vad vill du läsa?</h1>
      </header>

      <div className="space-y-4 px-5 pt-2">
        <p className="text-sm text-muted-foreground">
          Beskriv vad du är på humör för – till exempel ”något spännande som går fort att läsa” –
          och få förslag ur din egen läslista.
        </p>
        <Textarea
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          rows={4}
          placeholder="Något mysigt om naturen, gärna på svenska…"
          aria-label="Beskriv vad du vill läsa"
        />
        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Letar i läslistan…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Ge mig förslag
            </>
          )}
        </Button>

        {suggestions && suggestions.length === 0 ? (
          <p className="rounded-lg border border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
            Ingen bok i listan passade riktigt. Prova att beskriva det på ett annat sätt.
          </p>
        ) : null}

        {suggestions && suggestions.length > 0 ? (
          <ul className="space-y-3 pb-6">
            {suggestions.map((s) => {
              const book = books.find((b) => b.id === s.id);
              if (!book) return null;
              return (
                <li key={s.id}>
                  <Link
                    to="/bok/$id"
                    params={{ id: book.id }}
                    className="flex gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-secondary/60"
                  >
                    <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                      {book.cover ? (
                        <img src={book.cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <BookOpen className="size-5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{book.title}</h2>
                      <p className="truncate text-sm text-muted-foreground">{book.author}</p>
                      <p className="mt-1 text-sm">{s.reason}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
