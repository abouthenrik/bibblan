import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isbnFromLibris } from "@/lib/libris.server";
import { ownAiComplete } from "@/lib/ownai.server";

const InputSchema = z.object({
  /** Bilddata som data-URL (image/jpeg eller image/png) från kameran. */
  dataUrl: z.string().min(100).max(8_000_000),
});

export type CoverReading = {
  title: string;
  author: string;
  isbn: string;
  /** Varifrån ISBN kom: bilden, Libris-uppslag, eller inte hittat. */
  isbnSource: "cover" | "libris" | "none";
  category: string;
  deweyCode: string;
  /** Vilken AI-tjänst som läste av omslaget. */
  engine: "anthropic" | "gemini";
};

const ResultSchema = z.object({
  title: z.string(),
  author: z.string(),
  isbn: z.string(),
  category: z.string(),
  deweyCode: z.string(),
});

const PROMPT = `Du läser av ett fotograferat bokomslag. Svara med endast ett JSON-objekt, inga förklaringar:
{"title":"","author":"","isbn":"","category":"","deweyCode":""}
- title: bokens titel exakt som på omslaget.
- author: författarens namn.
- isbn: 10 eller 13 siffror om ISBN syns på bilden (ofta under streckkoden, börjar med 978), endast siffror utan bindestreck. Tom sträng om det inte syns.
- category: kort svensk kategori, t.ex. "Skönlitteratur", "Deckare", "Historia".
- deweyCode: rimlig Dewey-kod, t.ex. "839.73" eller "948.5". Tom sträng om du är osäker.
Lämna fält tomma om du inte kan läsa dem. Hitta inte på uppgifter.`;

export const readCover = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<CoverReading> => {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data.dataUrl);
    if (!match) throw new Error("Bilden kunde inte läsas. Fotografera omslaget igen.");
    const mediaType = match[1] as "image/jpeg" | "image/png" | "image/webp";
    const base64 = match[2]!;

    const result = await ownAiComplete({
      system: "Du är en bibliotekarie som läser av bokomslag. Svara endast med JSON.",
      prompt: PROMPT,
      image: { mediaType, base64 },
      maxTokens: 500,
    });

    const json = /\{[\s\S]*\}/.exec(result.text)?.[0];
    if (!json) throw new Error("Kunde inte tolka omslaget. Fyll i uppgifterna själv.");

    const parsed = ResultSchema.partial().safeParse(JSON.parse(json));
    if (!parsed.success) throw new Error("Kunde inte tolka omslaget. Fyll i uppgifterna själv.");

    const title = parsed.data.title?.trim() ?? "";
    const author = parsed.data.author?.trim() ?? "";
    let isbn = (parsed.data.isbn ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
    let isbnSource: "cover" | "libris" | "none" = isbn ? "cover" : "none";

    if (!isbn && title) {
      const found = await isbnFromLibris(title, author);
      if (found) {
        isbn = found;
        isbnSource = "libris";
      }
    }

    return {
      title,
      author,
      isbn,
      isbnSource,
      category: parsed.data.category?.trim() ?? "",
      deweyCode: parsed.data.deweyCode?.trim() ?? "",
      engine: result.engine,
    };
  });
