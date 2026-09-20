/**
 * AI-anrop mot Henriks egna nycklar: Anthropic Claude först,
 * Google Gemini som reserv om Anthropic saknas eller misslyckas.
 * Server-only – nycklarna läses aldrig i webbläsaren.
 */

const ANTHROPIC_MODEL = "claude-sonnet-4-5";
const GEMINI_MODEL = "gemini-2.5-flash";

export type OwnAiImage = { mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string };
export type OwnAiEngine = "anthropic" | "gemini";
export type OwnAiResult = { text: string; engine: OwnAiEngine };

export type OwnAiError = Error & { status?: number };

function anthropicError(status: number, body: string): OwnAiError {
  const err: OwnAiError = new Error(`Anthropic svarade ${status}`);
  err.status = status;
  if (status === 401) err.message = "AI-nyckeln godtogs inte. Kontrollera nyckeln i projektets hemligheter.";
  else if (status === 429) err.message = "För många förfrågningar mot ditt AI-konto just nu. Försök igen snart.";
  else if (status === 400 && /credit/i.test(body)) err.message = "Ditt AI-konto saknar krediter. Fyll på hos Anthropic.";
  return err;
}

async function callAnthropic(
  key: string,
  opts: { system: string; prompt: string; image?: OwnAiImage; maxTokens: number },
): Promise<string> {
  const content: Record<string, unknown>[] = [];
  if (opts.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: opts.image.mediaType, data: opts.image.base64 },
    });
  }
  content.push({ type: "text", text: opts.prompt });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw anthropicError(res.status, await res.text().catch(() => ""));

  const payload = (await res.json()) as { content?: { type?: string; text?: string }[] };
  const text = (payload.content ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
  if (!text.trim()) throw new Error("Tomt svar från Anthropic.");
  return text;
}

async function callGemini(
  key: string,
  opts: { system: string; prompt: string; image?: OwnAiImage },
): Promise<string> {
  const parts: Record<string, unknown>[] = [];
  if (opts.image) {
    parts.push({ inline_data: { mime_type: opts.image.mediaType, data: opts.image.base64 } });
  }
  parts.push({ text: opts.prompt });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini svarade ${res.status}. ${body.slice(0, 200)}`);
  }
  const payload = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
  if (!text.trim()) throw new Error("Tomt svar från Gemini.");
  return text;
}

/**
 * Kör prompten via Anthropic om nyckeln finns; vid fel (t.ex. slutna krediter
 * eller ogiltig nyckel) prövas Gemini automatiskt. Kastar svenskt fel om båda misslyckas.
 */
export async function ownAiComplete(opts: {
  system: string;
  prompt: string;
  image?: OwnAiImage;
  maxTokens?: number;
}): Promise<OwnAiResult> {
  const anthropicKey = process.env["ANTHROPIC_API_KEY"];
  const geminiKey = process.env["GEMINI_API_KEY"];
  const maxTokens = opts.maxTokens ?? 800;

  if (!anthropicKey && !geminiKey) {
    throw new Error(
      "Ingen AI-nyckel är sparad ännu. Spara din Anthropic- eller Gemini-nyckel i projektets hemligheter.",
    );
  }

  let anthropicError_: OwnAiError | null = null;
  if (anthropicKey) {
    try {
      return { text: await callAnthropic(anthropicKey, { ...opts, maxTokens }), engine: "anthropic" };
    } catch (err) {
      anthropicError_ =
        err && typeof err === "object" && "status" in err
          ? (err as OwnAiError)
          : new Error("Omslaget kunde inte läsas av.");
    }
  }

  if (geminiKey) {
    try {
      return { text: await callGemini(geminiKey, opts), engine: "gemini" };
    } catch {
      // Båda misslyckades – visa Anthropic-felet om det fanns, annars generiskt.
      if (anthropicError_) throw anthropicError_;
      throw new Error("AI-tjänsten svarade inte. Kontrollera dina nycklar i projektets hemligheter.");
    }
  }

  throw anthropicError_ ?? new Error("AI-tjänsten svarade inte.");
}
