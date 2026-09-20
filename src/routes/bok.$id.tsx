import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Barcode, BookOpen, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ChannelLinks } from "@/components/ChannelLinks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deweyGroupLabel,
  getBook,
  removeBook,
  upsertBook,
  ystadLibraryUrl,
  type Book,
} from "@/lib/books";
import { fetchIsbn } from "@/lib/isbn.functions";

export const Route = createFileRoute("/bok/$id")({
  head: () => ({
    meta: [
      { title: "Bok – Köp/Låna" },
      { name: "description", content: "Uppgifter om boken, anteckningar och länk till Ystads bibliotek." },
      { property: "og:title", content: "Bok – Köp/Låna" },
      { property: "og:description", content: "Se bokens uppgifter och sök den på Ystads bibliotek." },
    ],
  }),
  component: BookDetailPage,
});

function BookDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fetchingIsbn, setFetchingIsbn] = useState(false);
  const lookupIsbn = useServerFn(fetchIsbn);

  useEffect(() => {
    setBook(getBook(id) ?? null);
    setReady(true);
  }, [id]);

  if (!ready) return <AppShell>{null}</AppShell>;

  if (!book) {
    return (
      <AppShell>
        <div className="px-5 py-20 text-center">
          <h1 className="text-2xl">Boken finns inte</h1>
          <Button asChild className="mt-5">
            <Link to="/">Till läslistan</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const update = (patch: Partial<Book>) => setBook({ ...book, ...patch });

  const handleFetchIsbn = async () => {
    if (!book) return;
    if (!book.title.trim()) {
      toast.error("Skriv in titeln först, gärna också författaren.");
      return;
    }
    setFetchingIsbn(true);
    try {
      const result = await lookupIsbn({
        data: { title: book.title.trim(), author: book.author.trim() },
      });
      if (result.isbn) {
        if (book.isbn.trim()) {
          toast.info(`Libris hittade ${result.isbn}. ISBN-fältet var redan ifyllt och lämnas orört.`);
        } else {
          setBook({ ...book, isbn: result.isbn });
          toast.success(`ISBN hittades i Libris: ${result.isbn}`);
        }
      } else {
        toast.error("Inget ISBN hittades i Libris för den titeln. Fyll i det för hand.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ISBN kunde inte hämtas.");
    } finally {
      setFetchingIsbn(false);
    }
  };

  const save = () => {
    upsertBook(book);
    setEditing(false);
    toast.success("Ändringarna är sparade.");
  };

  const handleDelete = () => {
    removeBook(book.id);
    toast.success("Boken är borttagen.");
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <Button asChild variant="ghost" size="icon" aria-label="Tillbaka">
          <Link to="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => (editing ? save() : setEditing(true))}>
            {editing ? "Spara" : "Redigera"}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Ta bort bok" onClick={handleDelete}>
            <Trash2 className="size-5 text-destructive" />
          </Button>
        </div>
      </header>

      <div className="space-y-6 px-5 pb-6">
        <div className="mx-auto flex aspect-3/4 w-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {book.cover ? (
            <img src={book.cover} alt={`Omslag: ${book.title}`} className="h-full w-full object-cover" />
          ) : (
            <BookOpen className="size-8 text-muted-foreground" aria-hidden />
          )}
        </div>

        {editing ? (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel</Label>
              <Input id="title" value={book.title} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author">Författare</Label>
              <Input id="author" value={book.author} onChange={(e) => update({ author: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isbn">ISBN</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={fetchingIsbn || !book.title.trim()}
                  onClick={handleFetchIsbn}
                >
                  {fetchingIsbn ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Barcode className="size-4" />
                  )}
                  Hämta ISBN
                </Button>
              </div>
              <Input id="isbn" value={book.isbn} onChange={(e) => update({ isbn: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={book.category}
                onChange={(e) => update({ category: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dewey">Dewey-kod</Label>
              <Input
                id="dewey"
                value={book.deweyCode}
                onChange={(e) => update({ deweyCode: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Anteckning</Label>
              <Textarea
                id="notes"
                rows={4}
                value={book.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight">{book.title}</h1>
              <p className="mt-1 text-muted-foreground">{book.author}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {book.category ? <Badge variant="secondary">{book.category}</Badge> : null}
              {book.deweyCode ? (
                <Badge variant="secondary">
                  {book.deweyCode} – {deweyGroupLabel(book.deweyCode)}
                </Badge>
              ) : null}
            </div>
            {book.isbn ? (
              <p className="text-center text-sm text-muted-foreground">ISBN {book.isbn}</p>
            ) : null}
            {book.notes ? (
              <p className="rounded-lg border border-border bg-card p-4 text-sm whitespace-pre-line">
                {book.notes}
              </p>
            ) : null}
          </div>
        )}

        <div className="grid gap-2">
          <Button asChild size="lg" className="w-full">
            <a href={ystadLibraryUrl(book)} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Sök på Ystads bibliotek
            </a>
          </Button>
          <ChannelLinks book={book} />
        </div>
      </div>
    </AppShell>
  );
}
