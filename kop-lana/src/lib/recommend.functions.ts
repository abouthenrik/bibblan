import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ownAiComplete } from "@/lib/ownai.server";

const CandidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  category: z.string(),
  deweyCode: z.string(),
  notes: z.string(),
});

const InputSchema = z.object({
  wish: z.string().min(2).max(600),
  books: z.array(CandidateSchema).min(1).max(200),
});

export type Suggestion = { id: string; reason: string };

const SYSTEM = `Du är bibliotekarie. Du får en lista på böcker ur en läslåstares egen lista och ett önskemål.
Välj upp till 5 böcker ur listan som bäst matchar önskemålet. Använd endast id som finns i listan.
Skriv motiveringen på svenska, max 2 korta meningar. Om inget passar, returnera en tom lista.
Svara endast med ett JSON-objekt, inga förklaringar:
{"suggestions":[{"id":"","reason":""}]}`;

export const suggestBooks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ suggestions: Suggestion[] }> => {
    const list = data.books
      .map(
        (b) =>
          `id: ${b.id} | titel: ${b.title} | författare: ${b.author} | kategori: ${b.category} | dewey: ${b.deweyCode} | anteckning: ${b.notes}`,
      )
      .join("\n");

    const result = await ownAiComplete({
      system: SYSTEM,
      prompt: `Önskemål: ${data.wish}\n\nBöcker:\n${list}`,
      maxTokens: 1200,
    });

    const known = new Set(data.books.map((b) => b.id));
    const json = /\{[\s\S]*\}/.exec(result.text)?.[0];
    if (!json) return { suggestions: [] };
    try {
      const parsed = z
        .object({ suggestions: z.array(z.object({ id: z.string(), reason: z.string() })) })
        .parse(JSON.parse(json));
      return {
        suggestions: parsed.suggestions.filter((s) => known.has(s.id)).slice(0, 5),
      };
    } catch {
      return { suggestions: [] };
    }
  });
