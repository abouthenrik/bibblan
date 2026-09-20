import { isValidIsbn, normalizeIsbn, type Book } from "./books";

export type Channel = {
  name: string;
  group: "Handla" | "Lyssna & läs digitalt" | "Bibliotek" | "Förlag";
  url: (query: string) => string;
  /** "titleAuthor" = sök alltid med titel + författare istället för ISBN */
  queryMode?: "titleAuthor";
};

export const CHANNELS: Channel[] = [
  {
    name: "Adlibris",
    group: "Handla",
    url: (q) => `https://www.adlibris.com/se/sok?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Bokus",
    group: "Handla",
    url: (q) => `https://www.bokus.com/cgi-bin/product_search.cgi?search_word=${encodeURIComponent(q)}`,
  },
  {
    name: "Akademibokhandeln",
    group: "Handla",
    url: (q) => `https://www.akademibokhandeln.se/sok/?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Bokbörsen (begagnat)",
    group: "Handla",
    url: (q) => `https://www.bokborsen.se/?f=1&qt=${encodeURIComponent(q)}`,
  },
  {
    name: "Storytel",
    group: "Lyssna & läs digitalt",
    url: (q) => `https://www.storytel.com/se/search?q=${encodeURIComponent(q)}`,
    queryMode: "titleAuthor",
  },
  {
    name: "Nextory",
    group: "Lyssna & läs digitalt",
    url: (q) => `https://nextory.com/se/search?query=${encodeURIComponent(q)}`,
    queryMode: "titleAuthor",
  },
  {
    name: "BookBeat",
    group: "Lyssna & läs digitalt",
    url: (q) => `https://www.bookbeat.com/se/search?query=${encodeURIComponent(q)}`,
    queryMode: "titleAuthor",
  },
  {
    name: "Libris (alla svenska bibliotek)",
    group: "Bibliotek",
    url: (q) => `https://libris.kb.se/hitlist?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Bibliotek Skåne Sydost",
    group: "Bibliotek",
    url: (q) => `https://www.biblioteksso.se/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Norstedts",
    group: "Förlag",
    url: (q) => `https://www.norstedts.se/sok?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Bonnierförlagen",
    group: "Förlag",
    url: (q) => `https://www.bonnierforlagen.se/?s=${encodeURIComponent(q)}`,
  },
  {
    name: "Natur & Kultur",
    group: "Förlag",
    url: (q) => `https://www.nok.se/sok?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Bokförlaget Polaris",
    group: "Förlag",
    url: (q) => `https://www.bokforlagetpolaris.se/?s=${encodeURIComponent(q)}`,
  },
  {
    name: "Modernista",
    group: "Förlag",
    url: (q) => `https://www.modernista.se/?s=${encodeURIComponent(q)}`,
  },
];

export const CHANNEL_GROUPS: Channel["group"][] = [
  "Handla",
  "Lyssna & läs digitalt",
  "Bibliotek",
  "Förlag",
];

export type QueryMode = "auto" | "isbn" | "titleAuthor";

export function channelQuery(
  book: Pick<Book, "title" | "author" | "isbn">,
  channel?: Pick<Channel, "queryMode">,
  mode: QueryMode = "auto",
): string {
  const titleAuthor = [book.title, book.author].filter(Boolean).join(" ");
  if (mode === "titleAuthor") return titleAuthor;
  if (mode === "isbn" && isValidIsbn(book.isbn)) return normalizeIsbn(book.isbn);
  if (mode === "auto" && channel?.queryMode === "titleAuthor") return titleAuthor;
  if (isValidIsbn(book.isbn)) return normalizeIsbn(book.isbn);
  return titleAuthor;
}
