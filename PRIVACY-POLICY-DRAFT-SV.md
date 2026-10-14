# Integritetspolicy för TaskFlow — svenskt utkast

> **Utkast – inte publiceringsklart och ingen bedömning av GDPR-efterlevnad.**
> Ägaren måste fylla i alla hakparenteser, kontrollera uppgifterna mot den
> faktiska driftsättningen och låta en jurist eller dataskyddsspecialist granska
> texten innan appen tar emot riktiga användares personuppgifter. Ta bort denna
> notis först när granskningen är klar.

**Senast granskad:** [ÅÅÅÅ-MM-DD]  
**Gäller från:** [ÅÅÅÅ-MM-DD]

## Personuppgiftsansvarig och kontakt

Personuppgiftsansvarig är **[juridiskt namn/företag och organisationsnummer]**,
**[postadress]**. Kontakta oss om integritet eller personuppgifter på
**[integritetskontaktens e-postadress]**. Dataskyddsombud:
**[namn och kontaktuppgifter, eller ange att ombud inte har utsetts efter att
detta har bedömts]**.

## Uppgifter som TaskFlow behandlar

TaskFlow är en projekt- och uppgiftshanteringstjänst. Beroende på hur den
används kan följande uppgifter behandlas:

- **Konto och autentisering:** e-postadress och autentiseringsuppgifter som
  skickas till Supabase Auth. Lösenord hanteras av Supabase Auth; TaskFlow visar
  eller använder inte lösenordet efter autentiseringsbegäran. Autentiserings-
  och sessionscookies gör att inloggningen kan fungera.
- **Projekt och uppgifter:** projekt- och uppgiftsnamn, beskrivningar, status,
  prioritet, förfallodatum, projektkopplingar, ägarens konto-ID samt tidsstämplar.
  Användare kan själva skriva text i namn och beskrivningar, så de ska inte ange
  känsliga personuppgifter eller uppgifter om andra personer som inte behövs.
- **Drifts- och säkerhetsuppgifter:** Supabase och Vercel kan behandla tekniska
  uppgifter och loggar som följer av autentisering, databasförfrågningar,
  webbplatsanrop och drift. Vilka fält som faktiskt loggas, deras åtkomst,
  lagringstid och region måste kontrolleras i respektive tjänsts inställningar
  och avtal. TaskFlow-koden innehåller ingen avsiktlig analys- eller
  annonsspårning.

## Ändamål och rättslig grund

Uppgifter används för att skapa och skydda konton, autentisera användare, visa
och hantera deras projekt och uppgifter samt driva, felsöka och skydda tjänsten.

**Ägaren måste före publicering ange och dokumentera rättslig grund för varje
ändamål och säkerställa att informationen stämmer med tjänstens verkliga
användning:** [ange ändamål, rättslig grund och eventuell intresseavvägning].
Detta utkast fastställer inte någon rättslig grund.

## Tjänsteleverantörer och överföringar

Den nuvarande arkitekturen använder Supabase för autentisering och PostgreSQL
samt Vercel för webbappens avsedda drift. Exakt vilka leverantörer och
underbiträden som behandlar uppgifter beror på de projekt, regioner, funktioner
och avtalsvillkor som ägaren väljer.

**Fyll i före publicering:** leverantörernas juridiska namn och roller,
underbiträden, behandlings- och lagringsregioner, eventuella överföringar utanför
EU/EES, tillämpliga överföringsmekanismer och var användaren kan läsa mer:
[komplettera efter granskning av Supabase och Vercels aktuella DPA,
underbiträdeslistor, regionval och överföringsvillkor].

## Lagringstid

**Lagringstider är inte fastställda i applikationen.** Ägaren måste ange
perioder eller tydliga kriterier för konton, projekt och uppgifter, tekniska
loggar, säkerhetskopior och eventuella säkerhets- eller incidentuppgifter:
[ange period och gallringsrutin för varje kategori]. Radering ur aktiva
databaser innebär inte nödvändigtvis omedelbar radering ur leverantörers
säkerhetskopior eller loggar; deras faktiska tidsfrister måste kontrolleras och
kommuniceras.

## Dina rättigheter och hur du begär åtgärd

Du kan kontakta **[integritetskontaktens e-postadress]** för att begära tillgång,
rättelse, export eller radering av dina personuppgifter, eller ställa frågor om
behandling. Ange inte lösenord i begäran. Vi kan behöva verifiera din identitet
innan vi lämnar ut eller ändrar uppgifter. Ägaren måste fastställa en säker
process för att ta emot, bedöma, besvara och dokumentera sådana begäranden samt
för att hantera eventuella undantag och tidsfrister.

TaskFlow har för närvarande ingen självbetjäningsfunktion för att exportera
samtliga personuppgifter eller radera ett konto. Projekt- och uppgiftshantering
i appen är inte likvärdig med en fullständig export av kontouppgifter eller
leverantörsloggar. Ägaren behöver hantera dessa begäranden manuellt tills
granskade och testade arbetsflöden finns på plats.

## Säkerhet och incidenter

Applikationen använder Supabase Auth-sessioner i cookies och gör databasfrågor
med den inloggade användarens serverklient. Migrationen definierar
ägarbaserade RLS-policyer för projekt och deras uppgifter samt kaskadradering.
Källkod och lokala tester visar avsedd konfiguration men bevisar inte att
produktionstjänster, autentisering, databasåtkomst eller RLS fungerar korrekt.

Ägaren måste dokumentera faktisk åtkomst till drift och data, behörighets- och
nyckelhantering, säkerhetskopior, sårbarhets- och incidenthantering, ansvariga
kontaktpersoner och hur eventuell anmälnings- och informationsskyldighet
bedöms. Inga sådana operativa processer bekräftas av detta utkast.

## Konton, radering och säkerhetskopior

Det finns ingen funktion i appen för att radera ett Supabase Auth-konto.
Migrationen anger `ON DELETE CASCADE` från `auth.users` till användarens projekt
och vidare från projekt till uppgifter. Detta beskriver databasschemat, inte en
verifierad produktionsradering. Kontoavslut måste ske genom ett granskat,
behörigt server- eller administratörsflöde; en privilegierad nyckel får aldrig
läggas i klientkod eller skickas till användaren. Innan ett sådant flöde införs
måste ägaren testa kaskader i en isolerad miljö och fastställa effekten på
segregation, säkerhetskopior, loggar, incidentutredningar och eventuell
återställning. Radering i en aktiv databas tar inte automatiskt bort kopior som
omfattas av leverantörernas säkerhetskopieringscykler.

## Cookies

TaskFlow använder Supabase SSR-cookies för att upprätthålla autentiserade
sessioner och uppdatera dem. De används för kärnfunktioner och inte för
annonsering eller analys. Ägaren måste kontrollera faktisk cookie-konfiguration,
livslängd, säkerhetsflaggor, samtyckeskrav och informationstext mot den
driftsatta versionen och tillämpliga regler. Inga analys- eller
icke-nödvändiga spårningscookies har lagts till i detta arbete.

## Ändringar och klagomål

Policyversion och ändringsdatum ska uppdateras när behandling eller leverantörer
ändras. Kontaktväg till behörig tillsynsmyndighet ska anges efter att ägarens
jurisdiktion har fastställts: [ange relevant myndighet och länk].
