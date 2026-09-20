import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isbnFromLibris } from "@/lib/libris.server";

const InputSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(300).default(""),
});

/** Slår upp ISBN utifrån titel och författare via Libris. */
export const fetchIsbn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ isbn: string }> => {
    const isbn = await isbnFromLibris(data.title.trim(), data.author.trim());
    return { isbn };
  });
