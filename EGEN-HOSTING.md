# Köp/Låna – flytta till egen hosting med Vercel

Appens byggverktyg känner automatiskt av Vercel och skapar den struktur som
Vercel behöver. Det gör flytten enkel utan att namnservrarna för drömland.se
behöver ändras.

## Steg 0 – Vad du behöver

- Ett konto på [vercel.com](https://vercel.com) (gratis räcker).
- Nycklarna som appen läser på servern:
  - `ANTHROPIC_API_KEY` – din nyckel från console.anthropic.com → Settings → API keys.
  - `GEMINI_API_KEY` – valfritt, som reserv om Anthropic nyckeln tar slut (aistudio.google.com → API keys).

## Steg 1 – Lägg koden på GitHub

1. Skapa ett nytt tomt repo på GitHub, t.ex. `kop-lana`.
2. Packa upp `kop-lana-kod-2026-09-20-3.zip` och kör i mappen:

```bash
git init
git add .
git commit -m "Köp/Låna – första versionen för egen hosting"
git remote add origin https://github.com/<ditt-användarnamn>/kop-lana.git
git push -u origin main
```

## Steg 2 – Skapa appen i Vercel

1. Logga in på [vercel.com](https://vercel.com) med ditt GitHub-konto.
2. Välj **Add New → Project** och importera GitHub-repot.
3. Fyll i bygginställningarna:
   - **Framework Preset:** **Other**
   - **Build Command:** `npm run build`
   - **Output Directory:** lämna tom
   - **Install Command:** behåll standardinställningen

   Bygget skriver Vercels Build Output API v3 till `.vercel/output/`. Vercel
   läser den katalogen automatiskt, och den har företräde framför inställningen
   **Output Directory**.
4. Lägg till följande under **Environment Variables** och markera både
   **Production** och **Preview**:
   - `ANTHROPIC_API_KEY` = din Anthropic-nyckel
   - `GEMINI_API_KEY` = din Gemini-nyckel (valfritt)
5. Klicka **Deploy**. Efter ett par minuter får du en adress som
   `<projektnamn>.vercel.app` – testa hela appen där innan du ändrar DNS.

## Steg 3 – Koppla listan.drömland.se

1. I Vercel öppnar du projektet och går till **Settings → Domains → Add**.
   Lägg till `listan.drömland.se`.
2. Vercel visar exakt vilken DNS-post och vilket värde du ska använda. Använd
   alltid värdet som Vercel visar i stället för ett hårdkodat värde, eftersom
   Vercel har ändrat detta historiskt.
3. Hos one.com öppnar du DNS-inställningarna för `drömland.se`. Ändra den
   befintliga **CNAME-posten** med värdnamnet `listan`, som i dag pekar på
   Lovable, till värdet som Vercel visar.
4. HTTPS-certifikatet utfärdas automatiskt när DNS-posten har slagit igenom.

**Obs:** `drömland.se` är ett IDN-domännamn och heter `xn--drmland-b1a.se` i
punycode. one.com hanterar detta, men om ett verktyg kräver punycode är den
fullständiga adressen `listan.xn--drmland-b1a.se`.

## Steg 4 – Verifiera

- Öppna `https://listan.drömland.se` – sidan ska laddas med hänglås (HTTPS).
- Testa i telefonens webbläsare: fota ett omslag, kolla att titel/författare fylls i.
- Testa "Hämta ISBN", Ystad-knappen och Förslag.

## Steg 5 – Stäng av Lovable först när allt funkar

Appen här på Lovable är säkerhetsnätet. Testa därför kamera, omslagsavläsning,
ISBN, Ystad-länken och Förslag på `<projektnamn>.vercel.app` **innan** du ändrar
DNS. Byt CNAME-posten sist. Fram till DNS-bytet visar `listan.drömland.se`
fortfarande Lovable-versionen, och om du byter tillbaka CNAME-posten är du
tillbaka där du var. Ta bort Lovable-appen först när Vercel-versionen fungerar
på domänen och allt är testat.

## Bra att veta

- Böckerna sparas i webbläsaren (localStorage) på din enhet. Byter du hosting
  påverkas inte böckerna – men de finns bara i den webbläsare du lagt upp dem i.
  Vill du ha dem på flera enheter senare kopplas ditt eget Supabase-konto.
- Byggutdata hamnar i `.vercel/output/` (inte `dist/`) när Vercel känns av –
  bra att veta om du felsöker.
- Kostnad: Vercels gratisnivå räcker normalt för privat bruk. Du betalar
  bara det AI-avläsningen kostar på ditt eget Anthropic-konto (dela per bild,
  en bråkdel av en cent).
- Uppdateringar: ändra koden, `git push` – Vercel bygger och publicerar om automatiskt.

## Bilaga: Cloudflare Workers

Om du senare flyttar hela DNS-zonen för `drömland.se` till Cloudflare kan appen
även publiceras som en Cloudflare Worker. Bygg projektet och kör:

```bash
npm install
npm run build
npx wrangler login
npx wrangler deploy -c .output/server/wrangler.json --name kop-lana
```

Nycklarna måste också finnas på workern: lägg in `ANTHROPIC_API_KEY` (och
valfritt `GEMINI_API_KEY`) i Cloudflare under **Workers → kop-lana → Settings →
Variables and Secrets**. Utan dem fungerar inte omslagsavläsningen.

Den lösningen kräver att zonen ligger hos Cloudflare för att använda Workers
Custom Domains på detta sätt.
