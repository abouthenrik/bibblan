import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Barcode, Loader2, ScanLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { BookCoverInput } from "@/components/BookCoverInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidIsbn, newId, normalizeIsbn, upsertBook } from "@/lib/books";
import { readCover } from "@/lib/cover.functions";
import { fetchIsbn } from "@/lib/isbn.functions";

export const Route = createFileRoute("/lagg-till")({
  head: () => ({
    meta: [
      { title: "Lägg till bok – Köp/Låna" },
      {
        name: "description",
        content: "Fotografera bokomslaget och spara titel, författare, ISBN, kategori och Dewey.",
      },
      { property: "og:title", content: "Lägg till bok – Köp/Låna" },
      {
        property: "og:description",
        content: "Fotografera omslaget och lägg boken i din läslista.",
      },
    ],
  }),
  component: AddBookPage,
});

function AddBookPage() {
  const navigate = useNavigate();
  const [cover, setCover] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [deweyCode, setDeweyCode] = useState("");
  const [notes, setNotes] = useState("");
  const [scanning, setScanning] = useState(false);
  const [fetchingIsbn, setFetchingIsbn] = useState(false);
  const scanCover = useServerFn(readCover);
  const lookupIsbn = useServerFn(fetchIsbn);

  const handleFetchIsbn = async () => {
    if (!title.trim()) {
      toast.error("Skriv in titeln först, gärna också författaren.");
      return;
    }
    setFetchingIsbn(true);
    try {
      const result = await lookupIsbn({ data: { title: title.trim(), author: author.trim() } });
      if (result.isbn) {
        if (isbn.trim()) {
          toast.info(`Libris hittade ${result.isbn}. ISBN-fältet var redan ifyllt och lämnas orört.`);
        } else {
          setIsbn(result.isbn);
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

  const handleScan = async () => {
    if (!cover) return;
    setScanning(true);
    try {
      const result = await scanCover({ data: { dataUrl: cover } });
      setTitle((v) => v.trim() || result.title);
      setAuthor((v) => v.trim() || result.author);
      setIsbn((v) => v.trim() || result.isbn);
      setCategory((v) => v.trim() || result.category);
      setDeweyCode((v) => v.trim() || result.deweyCode);
      const engineNote = result.engine === "gemini" ? " (avläst med Gemini)" : "";
      if (result.title || result.author) {
        if (result.isbnSource === "libris") {
          toast.success(`Omslaget är avläst${engineNote} och ISBN hämtat från Libris. Kontrollera uppgifterna.`);
        } else if (result.isbnSource === "cover") {
          toast.success(`Omslaget är avläst${engineNote}. Kontrollera uppgifterna innan du sparar.`);
        } else {
          toast.success(`Omslaget är avläst${engineNote}, men inget ISBN hittades. Fyll i det för hand.`);
        }
      } else {
        toast.error("Inget kunde läsas av omslaget. Fyll i uppgifterna själv.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Omslaget kunde inte läsas av.");
    } finally {
      setScanning(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Titeln behövs för att spara boken.");
      return;
    }
    if (isbn.trim() && !isValidIsbn(isbn)) {
      toast.error("ISBN ska vara 10 eller 13 siffror.");
      return;
    }
    upsertBook({
      id: newId(),
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim() ? normalizeIsbn(isbn) : "",
      cover,
      category: category.trim(),
      deweyCode: deweyCode.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });
    toast.success("Boken är sparad i läslistan.");
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button asChild variant="ghost" size="icon" aria-label="Tillbaka">
          <Link to="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-2xl">Lägg till bok</h1>
      </header>

      <div className="space-y-6 px-5 pt-2">
        <BookCoverInput value={cover} onChange={setCover} />

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          disabled={!cover || scanning}
          onClick={handleScan}
        >
          {scanning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ScanLine className="size-4" />
          )}
          {scanning ? "Läser av omslaget…" : "Läs av omslaget"}
        </Button>

        <p className="rounded-lg border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">
          Avläsningen använder din egen AI-nyckel. Tomma fält fylls i automatiskt – det du redan
          skrivit lämnas orört. Kontrollera alltid uppgifterna innan du sparar.
        </p>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author">Författare</Label>
            <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="isbn">ISBN</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={fetchingIsbn || !title.trim()}
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
            <Input
              id="isbn"
              inputMode="numeric"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="9789100000000"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Skönlitteratur"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dewey">Dewey-kod</Label>
            <Input
              id="dewey"
              value={deweyCode}
              onChange={(e) => setDeweyCode(e.target.value)}
              placeholder="839.73"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Anteckning</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleSave}>
          Spara i läslistan
        </Button>
      </div>
    </AppShell>
  );
}
