# TaskFlow

TaskFlow är en projekt- och uppgiftshanterare byggd med Next.js App Router,
TypeScript, Tailwind CSS och Supabase. Projektet visar ett sammanhängande
arbetsflöde för att organisera projekt och uppgifter, med autentiseringssidor,
filtrering, sammanfattningar och en responsiv dashboard.

> **Status:** Funktionerna är implementerade i koden och verifierade med
> automatiska kontroller där det anges nedan. Supabase Auth,
> databasoperationer och Row Level Security (RLS) har inte verifierats mot en
> ansluten Supabase-miljö. Ingen fjärrmigrering har tillämpats och appen har
> inte publicerats.

## Skärmbilder

Inga skärmbilder finns i repot ännu. En lämplig plats för framtida, autentiska
bilder är `docs/screenshots/`. Lägg inte in skärmbildsreferenser här förrän
respektive bild faktiskt har skapats och granskats. Skärmbilder ska visa den
aktuella implementationen och inte antyda att en liveintegration har verifierats.

### Så kan skärmbilder tas när en testmiljö finns

Den skyddade dashboarden kräver en konfigurerad Supabase-instans och ett giltigt
användarsessionstillstånd. I den nuvarande lokala miljön saknas `.env.local`.
När `http://localhost:3000/` laddas om skickas den därför till
`/login?error=configuration`, där appen anger att
`NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` saknas.
Den nuvarande appen har ingen aktiv demovy eller mockad dashboardväg:
`lib/demo-tasks.ts` innehåller äldre test-/demo-fixturedata men används inte av
den skyddade dashboarden. Autentisering eller databaskontroller ska inte
kringgås för att skapa bilder.

För att senare ta representativa bilder utan att använda riktiga användardata:

1. Använd en separat lokal eller test-Supabase-instans och en syntetisk
   testanvändare. Konfigurera lokalt de tre variablerna som beskrivs ovan.
2. Läs igenom den befintliga migreringen och tillämpa den endast i den
   uttryckligen valda, isolerade testdatabasen. Lokalt kräver Supabase CLI
   Docker; migreringen tillämpas först när ett separat kommando som
   `npm.cmd run db:reset` körs. Inget av detta har gjorts här.
3. Starta appen med `npm.cmd run dev`, logga in med testkontot och skapa
   syntetiska projekt och uppgifter genom gränssnittet.
4. Ta en desktopbild av dashboarden, där översikt, projekt och uppgifter visas
   på samma sida. Använd navigeringens Dashboard-, Projects- och My tasks-länkar
   för att visa respektive sektion inför bilden.
5. Öppna webbläsarens responsiva enhetsvy, kontrollera att mobilnavigering och
   uppgiftskort fungerar, och ta en separat mobilbild.
6. Granska bilderna för e-postadresser, personuppgifter, tokens och annan
   känslig information innan du sparar dem i `docs/screenshots/`. Lägg därefter
   till README-bildreferenser till just de filer som faktiskt finns.

Det skapades inga skärmbilder i denna genomgång. Att skapa dem kräver först en
separat testmiljö med Supabase-konfiguration och en migrerad testdatabas; ingen
konfiguration eller migrering har gjorts.

## Funktioner i koden

- E-postregistrering, inloggning, utloggning och skyddad dashboard.
- Skapa, redigera och radera projekt och uppgifter.
- Uppgiftsnamn, beskrivning, status, prioritet, förfallodatum och
  projektkoppling.
- Sökning, filtrering efter projekt/status/prioritet och sortering av
  uppgiftslistan.
- Dashboard-sammanfattningar för totalt antal, färdiga och försenade uppgifter,
  samt projektens beräknade förlopp.
- Responsiv navigering och gränssnitt för desktop och mobil, formulär,
  bekräftelser, väntelägen, tomma lägen och felmeddelanden.
- Zod-validering i autentiserings- och projekt-/uppgiftsflöden.

Att funktionerna finns i koden innebär inte att de har verifierats mot en
ansluten Supabase-tjänst. Kalender, rapporter, inställningar och hjälp är
inaktiva navigationsplatser, inte färdiga funktioner.

## Teknikstack

- **Next.js 16.4.1** med App Router och React 19.
- **TypeScript** med strikt typkontroll.
- **Tailwind CSS 4** för gränssnittsstilar.
- **Supabase Auth** med `@supabase/ssr` och Supabase PostgreSQL.
- **Zod** för indatavalidering.
- **Lucide** för ikoner.
- **Vitest**, React Testing Library och jsdom för automatiska tester.
- **Supabase CLI** och pgTAP-test för lokal databasutveckling.

## Arkitektur i korthet

- `app/` innehåller App Router-sidor, autentiseringscallback, skyddat
  route group, laddningsvy och server actions.
- `components/` innehåller navigering, formulär och dashboardens
  gränssnittskomponenter.
- `lib/auth/` innehåller validering, konfiguration och säkra
  autentiseringsmeddelanden.
- `lib/supabase/` innehåller typer och serverklient. Appens databasfrågor görs
  med den inloggade användarens session.
- `lib/workspace/` innehåller validering, dataläsning och dashboardberäkningar
  för projekt och uppgifter.
- `supabase/migrations/` innehåller den versionshanterade schemamigreringen.
- `supabase/tests/` innehåller pgTAP-tester för schema och RLS-policyer.
- `PRIVACY-POLICY-DRAFT-SV.md` är ett svenskt integritetspolicyutkast som
  behöver kompletteras och granskas före publicering.

## Förutsättningar

- Node.js 20.9 eller senare, vilket är versionskravet för Next.js 16. Använd en
  version som fortfarande stöds för ny utveckling och drift.
- npm.
- En Supabase-instans för att använda autentisering och databasfunktionerna.
- Docker Desktop krävs endast om du vill starta Supabase lokalt och köra lokala
  databastester. Docker behövs inte för lint, typkontroll, Vitest eller
  produktionsbygge.

## Kom igång lokalt

Installera beroenden från låsfilen:

```powershell
npm.cmd ci
```

Kopiera miljövariabelmallen:

```powershell
Copy-Item .env.example .env.local
```

Fyll i `.env.local` med värden från din egen Supabase-instans:

| Variabel | Syfte |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-projektets API-URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. Använd inte en secret- eller service-role-nyckel. |
| `NEXT_PUBLIC_SITE_URL` | Appens ursprung, exempelvis `http://localhost:3000` lokalt. |

`.env.example` innehåller endast platshållare. Lägg aldrig in `.env.local`,
lösenord, service-role-nycklar eller andra hemligheter i Git. Variabler med
prefixet `NEXT_PUBLIC_` är avsedda att vara publika och får inte innehålla
hemligheter.

Starta utvecklingsservern:

```powershell
npm.cmd run dev
```

Öppna sedan `http://localhost:3000`. I PowerShell används `npm.cmd` eftersom
systemets körningspolicy kan blockera `npm.ps1`.

För lokal Supabase-utveckling visar kommandot nedan den lokala API-adressen och
publishable key när tjänsterna startats:

```powershell
npm.cmd run db:start
```

Den befintliga migreringen
[`supabase/migrations/20261014210000_create_projects_and_tasks.sql`](./supabase/migrations/20261014210000_create_projects_and_tasks.sql)
definierar tabellerna `projects` och `tasks`, constraints, index, tidsstämplar,
kaskadradering och RLS-policyer. Läs och granska migreringen innan den används.
`npm.cmd run db:reset` återställer den lokala databasen och tillämpar befintliga
lokala migreringar. Kör det endast när du uttryckligen vill tillämpa migreringar
i en lokal utvecklingsdatabas; det har inte körts som del av
dokumentationsarbetet. Ingen fjärrmigrering har tillämpats eller pushats.

När en lokal databas har startats och migreringarna avsiktligt tillämpats kan
databasschemat och pgTAP-testerna köras med:

```powershell
npm.cmd run db:lint
npm.cmd run db:test
```

Dessa kommandon kräver att den lokala Supabase-miljön är igång. Att migreringen
och testerna finns i repot betyder inte att de har verifierats mot en
hostad databas.

## Utvecklings- och kvalitetskommandon

```powershell
npm.cmd run dev        # Starta utvecklingsservern
npm.cmd run lint       # Kör ESLint
npm.cmd run typecheck  # Kör TypeScript-kontroll utan att skapa byggfiler
npm.cmd test           # Kör Vitest en gång
npm.cmd run build      # Skapa produktionsbygget
npm.cmd start          # Starta det skapade produktionsbygget
npm.cmd audit          # Granska npm-beroenden efter kända sårbarheter
```

### Senast verifierade automatiska kontroller

Vid den senaste körningen i arbetskopian rapporterades:

- `npm.cmd run lint` — godkänd.
- `npm.cmd run typecheck` — godkänd.
- `npm.cmd test` — godkänd: 11 testfiler och 50 tester.
- `npm.cmd run build` — godkänd.
- `npm.cmd audit` — 0 kända sårbarheter rapporterade.
- `git diff --check` — godkänd.

Vitest skrev även ut en icke-blockerande varning om Vite-konfigurationens
config loader. De automatiska testerna omfattar enhets- och
komponentbeteenden med mocks där det behövs. De bevisar inte att live
autentisering, databasanslutning, RLS eller e-postbekräftelse fungerar.

pgTAP-tester finns för den lokala databasen, men de kördes inte i den här
verifieringen. Inga Playwright-baserade end-to-end-tester finns ännu.

## Supabase och databas

1. Skapa eller välj en Supabase-instans och konfigurera e-postleverantören i
   Supabase Auth.
2. Använd projektets URL och publishable key i `.env.local`; använd aldrig
   service-role key i appen eller klientkod.
3. Granska den befintliga SQL-migreringen och RLS-policyerna. Den avsedda
   åtkomstmodellen är att projekt ägs av den autentiserade användaren och att
   uppgifter endast är åtkomliga via ett projekt som användaren äger.
4. För lokal utveckling kan Supabase CLI starta en isolerad stack. Kommandot
   `db:reset` tillämpar lokala migreringar och raderar/återskapar den lokala
   databasen; använd det endast när det är avsikten.
5. En fjärrdatabas kräver separat granskning och uttryckligt godkännande av
   målprojekt och migrering. Ingen fjärrmigrering har tillämpats eller pushats
   här.

**Viktigt:** kodgranskning och mockade tester är inte bevis på säkerhet i en
ansluten miljö. Testa autentisering, dataåtkomst och isolering mellan separata
testanvändare mot den avsedda Supabase-instansen innan riktiga användare eller
produktionsdata används.

## Förberedelser för framtida publicering

Appen är inte publicerad och ingen Vercel-konfiguration har verifierats. Inför
en framtida driftsättning behöver ägaren:

1. Granska migrationen och fastställa en separat, säker process för att
   tillämpa den på rätt Supabase-projekt.
2. Importera repot som ett Next.js-projekt i Vercel och verifiera att vald
   Node.js-version stöds av Next.js 16.
3. Konfigurera `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` och `NEXT_PUBLIC_SITE_URL` i rätt
   Vercel-miljö. De två första värdena exponeras som publika klientvärden.
4. Aktivera åtkomst till Vercels systemvariabler för Preview-miljöer. Koden
   använder `VERCEL_URL` och `VERCEL_ENV` för callback-adressen vid
   Preview-registrering; dessa värden ska inte läggas till som hemligheter i
   `.env.example`.
5. I Supabase Auth URL Configuration ange appens Site URL och tillåt callbacken
   `/auth/callback` för produktionsdomänen. Lägg till lokal callback för
   utveckling och konfigurera vid behov en snävt avgränsad Preview-regel.
6. Efter driftsättning manuellt testa registrering, e-postbekräftelse,
   inloggning, utloggning, skyddade sidor, CRUD och åtkomstisolering med
   separata testkonton och icke-produktionsdata.

Exakta domäner och autentiseringsinställningar beror på den miljö som ägaren
väljer och har inte konfigurerats eller testats här. Ändra inte
Supabase-projektets inställningar eller tillämpa fjärrmigreringar utan separat
granskning.

## Säkerhet och integritet

- Autentiserade läsningar och ändringar använder Supabase-serverklienten och
  användarens session. Server actions validerar indata med Zod och härleder
  identiteten från autentiserad session.
- Migreringen definierar separata RLS-policyer för projekt och deras uppgifter,
  inklusive kontroller av ägarskap för operationerna.
- `.env.local` ignoreras av Git; `.env.example` innehåller endast
  platshållarvärden. Appen använder inte en service-role key i klientkod.
- Supabase-sessioncookies används för kärnfunktionalitet. Analys eller
  icke-nödvändig spårning har inte lagts till.
- Projekt- och uppgiftsradering finns. Självbetjänad kontoradering och komplett
  dataexport är däremot inte implementerade.
- [Svenskt utkast till integritetspolicy](./PRIVACY-POLICY-DRAFT-SV.md) är
  ofullständigt och inte redo att publiceras. Det fastställer inte
  GDPR-efterlevnad.

**Status för verifiering:** Supabase Auth, databasoperationer och RLS har inte
verifierats i en riktig, ansluten miljö. Ingen fjärrmigrering har tillämpats.
Applikationen har inte publicerats. Innan riktiga personuppgifter tas emot måste
ägaren komplettera policyutkastet, fastställa laglig grund och lagringstider,
granska personuppgiftsbiträdesavtal, underbiträden, regioner och
överföringsarrangemang samt ta fram fungerande processer för registrerades
begäranden och incidenthantering. Detta är inte juridisk rådgivning.

## Tekniska beslut och verifierbara styrkor

- **Servergräns för känsliga operationer:** Supabase-klienten för dataåtkomst
  ligger på serversidan, och identitet hämtas genom Supabase Auth-sessionen
  i stället för från ett användar-ID i formuläret.
- **Flera åtkomstlager:** server actions kontrollerar session och relevanta
  ägarskap; databasmigreringen definierar RLS som en separat
  åtkomstkontroll. Detta beskriver koden, inte verifierad driftssäkerhet.
- **Dataintegritet i schema:** migrationen definierar främmande nycklar,
  constraints, index, tidsstämplar och kaskad från projekt till uppgifter.
- **Validering nära indata:** Zod-scheman används av autentiserings- och
  workspace-flöden, och komponenter ger fel- och väntetillstånd.
- **Testbar domänlogik:** dashboardens beräkningar för sammanfattningar,
  filtrering, sortering och projektförlopp har separata tester.
- **Begränsad beroendemängd:** projektet använder den befintliga stacken för
  formulär, validering, ikoner och tester i stället för att införa en ny
  applikationsarkitektur för denna presentation.

## Roadmap

### Implementerat i koden

- Responsiv projekt- och uppgiftshantering med autentiseringssidor.
- Filtrering, sortering, sammanfattningar, formulärvalidering och
  användarfeedback.
- Supabase-migrering och RLS-policyer med tillhörande lokala pgTAP-tester.
- Enhets- och komponenttester utan krav på riktiga kontouppgifter.

Implementerat betyder inte att live-tjänster eller produktionskonfiguration har
verifierats.

### Återstår före produktionsanvändning

- Konfigurera en Supabase-instans, granska och tillämpa migreringen genom en
  kontrollerad process, och verifiera Auth, CRUD och RLS med isolerade
  testkonton.
- Köra de lokala databastesterna i en tillgänglig Supabase-miljö.
- Konfigurera och manuellt verifiera Vercel, miljövariabler och
  autentiseringscallbackar.
- Komplettera och granska integritetspolicyn samt fastställa processer för
  dataexport, kontoradering, lagring och incidenter.
- Lägga till end-to-end-tester för viktiga användarflöden.

### Möjliga framtida förbättringar

- Självbetjäning för export och kontoradering efter säkerhets- och
  datalivscykelgranskning.
- Playwright-flöden för autentisering och CRUD mot en isolerad testmiljö.
- Färdigställa kalender-, rapport- och inställningsfunktioner om de behövs.
- CI-arbetsflöde som kör lint, typkontroll, tester och bygge.

## Kända begränsningar

- Live Supabase Auth, databasåtkomst och RLS är inte verifierade.
- pgTAP-testerna har inte körts i denna verifiering, och automatiska
  applikationstester använder mocks för Supabase-beroende beteenden.
- Kontoexport, kontoradering, lösenordsåterställning, OAuth och
  flerfaktorsautentisering finns inte.
- Kalender, rapporter, inställningar och hjälp är inte implementerade.
- Ingen Playwright-baserad end-to-end-svit, CI-konfiguration eller
  produktionsdriftsättning har verifierats.
- Integritetspolicyn är ett ofullständigt utkast och utgör inte ett påstående om
  GDPR-efterlevnad.
