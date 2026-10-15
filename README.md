# Flodresan

En svensk webbapp för att träna 36 begrepp om Egypten och de första flodkulturerna.

## Använd appen

Öppna `index.html` i en modern webbläsare. Appen behöver ingen installation, server eller inloggning. Alla typsnitt och illustrationer är lokala eller inbyggda och appen anropar inga externa tjänster.

- **Begreppskort:** tänk ut förklaringen, visa svaret och självbedöm.
- **Quiz:** flervalsfrågor med förklaring, exempel och sidreferens.
- **Para ihop:** koppla begrepp till rätt förklaring. Sista omgången anpassas till antalet begrepp.
- **Alla begrepp:** sök bland begrepp, förklaringar och exempel.
- Filtrera på jordbruk och floder, makt och samhälle eller skrift och tro.
- Välj 5, 10 eller alla begrepp per pass och repetera svåra begrepp separat.

Två rätta svar i följd gör ett begrepp **tryggt**. Självbedömningar i kortläget räknas också och är ingen objektiv kunskapsbedömning. Felsvar nollställer följden och markerar begreppet för repetition tills ett nytt rätt svar registreras. I para ihop räknas en omgång med fel på ett begrepp som ett felsvar även om eleven till sist hittar paret. Svåra begrepp har större chans att komma tidigt i ett nytt pass; ett begrepp förekommer högst en gång per pass.

Framsteg sparas i webbläsarens `localStorage`, enbart på samma enhet och samma webbplatsadress. Ingen elevdata skickas till en server. Blockerat sparande meddelas på sidan och träningen fortsätter i minnet. Rensad webbläsardata tar bort framstegen. Sparande vid direkt öppning av lokala filer kan skilja mellan webbläsare; använd webbhosting för en stabil adress.

## Publicera med GitHub Pages

I repots **Settings → Pages**, välj **Deploy from a branch**, grenen **main** och mappen **/ (root)**. Spara. GitHub visar webbplatsens adress när publiceringen är klar. Alla resurssökvägar är relativa så appen fungerar under ett repo-prefix. Ingen byggprocess behövs.

## Utveckla

Ändra innehållet i `data.js`. Varje post har ett stabilt, unikt id, begrepp, förklaring, kategori, sidreferens och exempel. Ändra inte befintliga id:n om sparade framsteg ska fortsätta gälla.

- `index.html`: struktur och hjälpfönster
- `styles.css`: responsiv formgivning och fokusmarkeringar
- `data.js`: innehåll
- `app.js`: övningar, urval och framsteg
- `tests.cjs`: datakontroller och grundläggande integrationstester utan externa paket

Kör kontroller med Node.js:

```sh
node --check app.js
node --check data.js
node tests.cjs
```

För lokal HTTP-förhandsvisning kan du köra `python -m http.server 4173` i projektmappen och öppna `http://localhost:4173`.

## Innehåll och avgränsning

Elevförklaringarna är omformulerade utifrån det av användaren tillhandahållna läromaterialet **Flodkulturer (Egypten)**, främst sidorna 2–13. Sidreferenserna avser detta material. Begreppen omfattar även Mesopotamien och Babylonien. Original-PDF:en och dess bilder ingår inte. Landskapsillustrationen är ritad direkt i SVG för appen.

Detta är en första version med begreppsträning. Kartor, tidslinje, lärarkonton, synkronisering mellan enheter och automatisk bedömning av fritext ingår inte.
