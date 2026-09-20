import { useEffect, useState } from "react";
import { loadBooks, type Book } from "@/lib/books";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setBooks(loadBooks());
    sync();
    setReady(true);
    window.addEventListener("kop-lana:books", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("kop-lana:books", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { books, ready };
}
