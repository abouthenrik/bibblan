export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  cover: string | null;
  category: string;
  deweyCode: string;
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = "kop-lana.books.v1";

export const DEWEY_GROUPS: { code: string; label: string }[] = [
  { code: "0", label: "000 Allmänt, data, kunskap" },
  { code: "1", label: "100 Filosofi och psykologi" },
  { code: "2", label: "200 Religion" },
  { code: "3", label: "300 Samhällsvetenskap" },
  { code: "4", label: "400 Språk" },
  { code: "5", label: "500 Naturvetenskap" },
  { code: "6", label: "600 Teknik och medicin" },
  { code: "7", label: "700 Konst och fritid" },
  { code: "8", label: "800 Litteratur" },
  { code: "9", label: "900 Historia och geografi" },
];

export function deweyGroupLabel(code: string): string {
  const first = code.trim().charAt(0);
  return DEWEY_GROUPS.find((g) => g.code === first)?.label ?? "Utan Dewey";
}

export function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbn(raw: string): boolean {
  const isbn = normalizeIsbn(raw);
  return isbn.length === 10 || isbn.length === 13;
}

/** Söklänk till Ystads bibliotekskatalog (Arena/biblioteksso.se). */
export function ystadLibraryUrl(book: Pick<Book, "title" | "author" | "isbn">): string {
  // Arena-katalogen hittar inte titel + författare ihopsatta – sök ISBN,
  // annars enbart titeln (eller enbart författaren om titeln saknas).
  const query = isValidIsbn(book.isbn)
    ? normalizeIsbn(book.isbn)
    : book.title.trim() || book.author.trim();
  const params = new URLSearchParams({
    p_p_id: "searchResult_WAR_arenaportlet",
    p_p_lifecycle: "1",
    p_p_state: "normal",
    "p_r_p_arena_urn:arena_search_query": query,
    "p_r_p_arena_urn:arena_search_type": "solr",
    "_searchResult_WAR_arenaportlet_agency_name": "ASE100124",
  });
  return `https://www.biblioteksso.se/search?${params.toString()}`;
}

export function loadBooks(): Book[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Book[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  window.dispatchEvent(new Event("kop-lana:books"));
}

export function upsertBook(book: Book) {
  const books = loadBooks();
  const index = books.findIndex((b) => b.id === book.id);
  if (index >= 0) books[index] = book;
  else books.unshift(book);
  saveBooks(books);
}

export function removeBook(id: string) {
  saveBooks(loadBooks().filter((b) => b.id !== id));
}

export function getBook(id: string): Book | undefined {
  return loadBooks().find((b) => b.id === id);
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
