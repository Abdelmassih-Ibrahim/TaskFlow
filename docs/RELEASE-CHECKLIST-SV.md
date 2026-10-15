# Checklista inför kontrollerad release (Vercel + Supabase)

Detta är en **förberedelse**. Ingenting i listan har utförts mot Vercel eller en
hostad Supabase-miljö, ingen fjärrmigrering har körts och appen är inte
publicerad. Bocka av varje steg själv och bekräfta inställningarna i
respektive leverantörskonto.

## A. Verifierat i repot (lokalt)

| Område | Status |
| --- | --- |
| `.env.example` | Endast platshållare för `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. Inga hemligheter. |
| `.env.local` | Ignoreras av Git (`git check-ignore` bekräftat). |
| Callback | `app/auth/callback/route.ts` byter `code` mot session och omdirigerar bara till fasta interna sökvägar (`/`, `/login?error=...`). Ingen användarstyrd omdirigering. |
| Registreringens `emailRedirectTo` | Byggs av `lib/auth/config.ts`: `VERCEL_URL` (https) vid `VERCEL_ENV=preview`, annars `NEXT_PUBLIC_SITE_URL`. Endast https, eller http för `localhost`/`127.0.0.1`, godtas. |
| Svarshuvuden | Sätts i `next.config.ts`; testat. Ingen CSP. |
| Server och RLS | Server actions kräver session och validerar med Zod. RLS och schema testade lokalt: `npm.cmd run db:test` (71 pgTAP-tester godkända). |
| Beroenden | `npm.cmd audit`: 0 kända sårbarheter vid senaste körning. |

## B. Luckor att åtgärda eller besluta före release

- [ ] **Node-version:** `package.json` har inget `engines`-fält och ingen
      `.nvmrc`. Välj en Node.js LTS som Next.js 16 stöder (minst 20.9) och
      ställ in samma version i Vercel (Project Settings → Build & Development
      Settings → Node.js Version). Detta är inte verifierat.
- [ ] **CI saknas:** ingen GitHub Actions-fil finns. Överväg lint, typkontroll,
      test och build innan produktion.
- [ ] **Content Security Policy** är inte införd.
- [ ] **Integritetspolicyn** (`PRIVACY-POLICY-DRAFT-SV.md`) är ett utkast.
- [ ] **Ingen kontoradering/export** finns; bestäm hantering av registrerades
      begäranden innan riktiga användare registreras.
- [ ] **Lösenordsåterställning** finns inte.

## C. Skapa eller välj Supabase-projekt

- [ ] Skapa (eller välj) ett **separat** Supabase-projekt för produktion.
      Använd inte ett projekt med annan data. Välj region utifrån
      dataskyddskrav och notera den.
- [ ] Notera projektets URL och **publishable key** (Project Settings → API).
      Service-role/secret-nyckeln ska **inte** användas av appen och aldrig
      läggas i Vercel-variabler för detta projekt eller i Git.
- [ ] Kontrollera i Supabase att Row Level Security är aktivt på `projects`
      och `tasks` efter migreringen (Table Editor / Auth → Policies).

## D. Granska och tillämpa migreringar (uttryckligt godkännande)

- [ ] Läs `supabase/migrations/20261014210000_create_projects_and_tasks.sql`.
- [ ] Kör `npm.cmd run db:test` lokalt (kräver Docker Desktop) och bekräfta att
      allt är grönt.
- [ ] Ta backup/notera läget i målprojektet.
- [ ] Besluta själv hur migreringen tillämpas på målprojektet (till exempel
      `supabase link` + `supabase db push` efter granskning av
      `supabase db push --dry-run`). **Ingen sådan åtgärd har utförts.**
- [ ] Verifiera efteråt att tabeller, constraints, index och policyer finns.

## E. Auth-inställningar i Supabase

- [ ] Auth → URL Configuration → **Site URL** = produktionsdomänen (https).
- [ ] **Redirect URLs:** tillåt exakt `https://<produktionsdomän>/auth/callback`
      och, för lokal utveckling, `http://localhost:3000/auth/callback`. För
      Vercel Preview: använd en snäv regel för just projektets
      preview-domäner, inte `*`.
- [ ] Auth → Providers → Email: aktivera **Confirm email** (lokalt är den
      avstängd i `supabase/config.toml`, vilket **inte** gäller hostat
      projekt) och granska lösenordspolicy.
- [ ] Konfigurera egen SMTP-leverantör om standardutskicket inte räcker
      (standardutskicket har låga gränser) och granska e-postmallar.
- [ ] Granska rate limits för Auth.

## F. Vercel

- [ ] Importera repot som Next.js-projekt (inget `vercel.json` finns; inga
      särskilda inställningar krävs för standardbygget: `npm run build`).
- [ ] Ställ in Node-version (se B).
- [ ] Lägg till variabler per miljö (Production / Preview / Development):
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
      `NEXT_PUBLIC_SITE_URL` (= produktionsdomänen i Production).
      Variabler med `NEXT_PUBLIC_` blir publika; lägg inga hemligheter i dem.
- [ ] Aktivera "Automatically expose System Environment Variables" så att
      `VERCEL_URL` och `VERCEL_ENV` finns (används för Preview-registrering).
- [ ] Använd **inte** produktionsdatabasen för Preview om du inte medvetet vill
      det; skapa annars ett separat Supabase-projekt för Preview.
- [ ] Granska Vercels och Supabases avtal, underleverantörer, regioner,
      säkerhetskopior och internationella överföringar (juridisk bekräftelse).

## G. Publicera först efter godkännande

- [ ] Kör `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`,
      `npm.cmd run build`, `npm.cmd audit`, `git diff --check`.
- [ ] Ägaren godkänner uttryckligen. Publicera sedan (Vercel Production
      Deployment). Inget av detta har gjorts.

## H. Testa efter publicering

- [ ] Registrera två separata testkonton A och B (e-postbekräftelse fungerar,
      länken landar på produktionsdomänen).
- [ ] Logga in/ut; `/` utan session omdirigerar till `/login`.
- [ ] Som A: skapa, redigera och ta bort projekt och uppgifter; kontrollera
      efter omladdning.
- [ ] Som B: bekräfta att A:s projekt och uppgifter inte syns och inte går att
      ändra.
- [ ] Kontrollera svarshuvuden (`curl -I https://<domän>/login`).
- [ ] Granska Vercel-/Supabase-loggar för oväntade fel; ta bort testkonton.
