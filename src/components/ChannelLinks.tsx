import { useState } from "react";
import { ExternalLink, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CHANNEL_GROUPS, CHANNELS, channelQuery, type QueryMode } from "@/lib/channels";
import { isValidIsbn, type Book } from "@/lib/books";
import { cn } from "@/lib/utils";

type Props = {
  book: Pick<Book, "title" | "author" | "isbn">;
  label?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
};

const MODES: { value: QueryMode; label: string }[] = [
  { value: "auto", label: "Automatiskt" },
  { value: "isbn", label: "ISBN" },
  { value: "titleAuthor", label: "Titel + författare" },
];

export function ChannelLinks({ book, label = "Hitta boken online", variant = "outline", size = "lg" }: Props) {
  const [mode, setMode] = useState<QueryMode>("auto");
  const hasIsbn = isValidIsbn(book.isbn);
  const previewQuery = channelQuery(book, undefined, mode);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="w-full">
          <Store className="size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hitta boken online</DialogTitle>
          <DialogDescription className="truncate">
            Söker på {previewQuery || "boken"} hos butiker, ljudtjänster, bibliotek och förlag.
          </DialogDescription>
        </DialogHeader>

        <div className="flex rounded-full border border-border p-1" role="group" aria-label="Välj sök sätt">
          {MODES.map((m) => {
            const disabled = m.value === "isbn" && !hasIsbn;
            return (
              <button
                key={m.value}
                type="button"
                disabled={disabled}
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
                  mode === m.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-40",
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {CHANNEL_GROUPS.map((group) => (
            <section key={group}>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {group}
              </h3>
              <ul className="divide-y divide-border border-y border-border">
                {CHANNELS.filter((c) => c.group === group).map((channel) => (
                  <li key={channel.name}>
                    <a
                      href={channel.url(channelQuery(book, channel, mode))}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary"
                    >
                      {channel.name}
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
