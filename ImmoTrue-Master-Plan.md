# 🏠 ImmoTrue — Der komplette Master-Plan
> Mobile App + Web App + Admin | 70 Schritte | 14 Wochen bis Launch
> Alles was wir besprochen haben in einem Plan

---

## 📋 ÜBERSICHT

### Was wir bauen

**1. Mobile App** (React Native + Expo)
- iOS App Store + Google Play Store
- URL-Analyse aus 8 DACH-Portalen
- KI-Vollbericht via Claude Haiku
- Portfolio mit gespeicherten Analysen
- Preisänderungs-Alarm
- Push Notifications

**2. Web App** (Astro.js)
- Landing Page mit SEO
- Web-Version der Analyse
- Blog für organischen Traffic
- Newsletter Signup

**3. Admin Dashboard** (Astro.js)
- User Management
- Analytics
- Content Management
- Feature Flags

**4. Shared Backend** (Supabase)
- Auth für alle Apps
- Edge Functions für Apify + Claude
- Datenbank mit Portfolio
- Cron Jobs für Preisänderungen

---

## 🎯 ALLE FEATURES

### 🆓 FREE (3 Analysen/Monat)
- URL-Eingabe aller 8 Portale
- Preis-Ampel (Günstig/Fair/Teuer/Überteuert)
- Basis-Kennzahlen
- KI-Kurzzusammenfassung (3 Sätze)
- Lage-Score
- Ergebnis 24h verfügbar

### 👑 PREMIUM (€4,99/Monat · €34,99/Jahr)

**Analyse:**
- Unbegrenzte Analysen
- KI-Vollbericht auf Deutsch
- Verhandlungsstrategie
- Empfohlener Angebotspreis
- 10-Jahres Prognose
- Kaufnebenkosten aller 16 Bundesländer
- Risiko-Analyse
- Detaillierte Lage-Analyse mit Karte

**Portfolio (Killer-Feature):**
- Unbegrenzt Analysen speichern
- Kategorien: Favoriten / Interessant / Besichtigt / Verworfen
- Notizen zu jedem Objekt
- Historie aller Analysen
- Ergebnisse ohne neue API-Kosten öffnen

**Preisänderungs-Alarm:**
- Automatische tägliche Prüfung
- Push wenn Preis sinkt
- Historie aller Preisänderungen
- "Diese Wohnung ist jetzt €30k günstiger"

**Vergleich & Alarme:**
- 2 Objekte nebeneinander vergleichen
- Wunschalarm für neue Inserate
- Plattformvergleich

**Extras:**
- Finanzierungsrechner (interaktiv)
- Besichtigungs-Checkliste
- PDF-Export für Bank
- E-Mail-Reports

---

## 📅 GESAMTPLAN

| Woche | Phase | Schritte | Ergebnis |
|---|---|---|---|
| 1 | Backend | 1–8 | Supabase, Datenbank, Types |
| 2 | Backend | 9–14 | Edge Functions, KI |
| 3 | Web | 15–22 | Landing Page + Design |
| 4 | Web | 23–28 | Analyse-Screen Web |
| 5 | Web | 29–32 | Blog + SEO |
| 6 | Mobile | 33–38 | Expo Setup + Navigation |
| 7 | Mobile | 39–44 | URL-Analyse Flow |
| 8 | Mobile | 45–50 | Ergebnis-Screen + Features |
| 9 | Mobile | 51–55 | Portfolio + Preisalarm |
| 10 | Mobile | 56–60 | Premium + Paywall |
| 11 | Admin | 61–64 | Admin Dashboard |
| 12 | Legal | 65–66 | Rechtliches + Icons |
| 13 | Launch | 67–69 | App Store + Web Deploy |
| 14 | Post-Launch | 70 | Marketing + Monitoring |

---

# 🚀 DIE 70 SCHRITTE

---

## PHASE 1 — BACKEND FOUNDATION (Schritte 1–14)

### Schritt 1 von 70: Monorepo Setup
```
Du bist mein persönlicher Senior Developer und Mentor.
Wir bauen zusammen "ImmoTrue" — KI-Immobilienanalyse Platform.
Mobile App + Web App + Admin Dashboard.

Ich bin Webentwickler (HTML, CSS, JS, Astro.js, Supabase)
aber kenne React Native noch nicht.

Deine Aufgabe als Mentor:
- Erkläre JEDEN Schritt bevor du ihn ausführst
- Nur EINEN Schritt pro Nachricht
- Warte auf meine Bestätigung
- Vergleiche mit HTML/CSS/JS wenn möglich

Schritt 1 von 70:
Erstelle Root-Ordner "immotrue/" mit Struktur:

immotrue/
  mobile/           (React Native + Expo)
  web/              (Astro.js Web App)
  admin/            (Astro.js Admin Dashboard)
  backend/          (Supabase Config)
  shared/           (Geteilte TypeScript Types)
  docs/
  README.md

Erkläre:
- Was ist ein Monorepo?
- Warum 4 separate Projekte?
- Was können wir teilen?

Sage am Ende "Bereit für Schritt 2?"
```

---

### Schritt 2 von 70: Supabase Projekt
```
Schritt 2 von 70: Supabase Backend einrichten.

Erkläre Schritt für Schritt:
1. Supabase Projekt auf supabase.com erstellen
   Name: "immotrue"
   Region: Europe (Frankfurt)
2. Supabase CLI installieren
3. Projekt verlinken: supabase link
4. Ordner backend/supabase/ initialisieren:
   supabase init

Prüfe:
- Node.js 18+ installiert
- Supabase CLI Version

Erkläre:
- Was ist Supabase?
- Unterschied zu Firebase?
- Was sind Edge Functions?

Sage am Ende "Bereit für Schritt 3?"
```

---

### Schritt 3 von 70: Datenbank-Schema (Kern-Tabellen)
```
Schritt 3 von 70: Kern-Tabellen erstellen.

Erstelle Migration in backend/supabase/migrations/
via SQL:

TABELLE profiles:
- id UUID PRIMARY KEY REFERENCES auth.users(id)
- email TEXT
- is_premium BOOLEAN DEFAULT false
- premium_until TIMESTAMP
- user_type TEXT (buyer/investor/both)
- analyses_this_month INTEGER DEFAULT 0
- last_month_reset TIMESTAMP DEFAULT now()
- push_token TEXT
- created_at TIMESTAMP DEFAULT now()

TABELLE market_prices:
(Statische Destatis-Daten für Preisvergleich)
- city TEXT
- zip_prefix TEXT (erste 3 Ziffern der PLZ)
- state TEXT
- avg_price_per_sqm INTEGER
- rental_avg_per_sqm INTEGER
- updated_at TIMESTAMP

TABELLE sync_logs:
- id UUID PRIMARY KEY
- job_type TEXT
- status TEXT
- rows_processed INTEGER
- duration_ms INTEGER
- error_message TEXT
- created_at TIMESTAMP DEFAULT now()

Aktiviere Row-Level Security.

Erkläre:
- Was ist RLS?
- Warum brauchen wir market_prices?

Sage am Ende "Bereit für Schritt 4?"
```

---

### Schritt 4 von 70: Analysen-Tabelle (Portfolio)
```
Schritt 4 von 70: Analysen-Tabelle — der Kern.

Diese Tabelle speichert alle Analysen des Users.
Wichtig: Nur eigene Analyse + öffentliche Fakten.
NIEMALS: Fotos, Inseratstexte, Portal-Content.

CREATE TABLE analyses:
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID REFERENCES profiles(id)

-- Portal Info
- original_url TEXT NOT NULL
- portal TEXT

-- Öffentliche Fakten (kein Copyright)
- price INTEGER
- price_per_sqm INTEGER
- size_sqm INTEGER
- rooms NUMERIC
- address TEXT
- district TEXT
- city TEXT
- state TEXT
- zip_code TEXT
- year_built INTEGER
- energy_class TEXT
- floor INTEGER
- days_on_market INTEGER
- is_private_seller BOOLEAN

-- Preis-Tracking
- original_price INTEGER
- current_price INTEGER
- price_change_percent NUMERIC
- last_price_check TIMESTAMP

-- Deine KI-Analyse (dein Content)
- price_verdict TEXT (cheap/fair/expensive/overpriced)
- price_deviation NUMERIC
- suggested_offer_price INTEGER
- ai_summary TEXT
- ai_full_report TEXT
- ai_recommendation TEXT
- ai_negotiation_tip TEXT
- ai_risks JSONB
- ai_pros JSONB
- ai_cons JSONB
- ai_forecast_10y TEXT
- ai_forecast_value_10y INTEGER

-- Kennzahlen
- gross_yield NUMERIC
- location_score NUMERIC
- location_details JSONB
- purchase_costs_total INTEGER
- purchase_costs_breakdown JSONB
- estimated_rent INTEGER
- negotiation_potential TEXT

-- Portfolio-Status
- status TEXT DEFAULT 'interesting'
  (interesting/favorite/viewed/rejected)
- user_notes TEXT
- viewed_date DATE
- viewing_rating INTEGER
- viewing_pros JSONB
- viewing_cons JSONB

-- Zeitstempel
- analyzed_at TIMESTAMP DEFAULT now()
- last_updated_at TIMESTAMP DEFAULT now()

Indizes für Performance:
- CREATE INDEX ON analyses(user_id)
- CREATE INDEX ON analyses(user_id, status)
- CREATE INDEX ON analyses(user_id, analyzed_at DESC)

RLS Policy:
User kann nur eigene Analysen sehen/bearbeiten.

Erkläre:
- Warum speichern wir current_price separat?
- Was ist JSONB?
- Warum Indizes?

Sage am Ende "Bereit für Schritt 5?"
```

---

### Schritt 5 von 70: Weitere Tabellen
```
Schritt 5 von 70: Alarme + Vergleiche Tabellen.

TABELLE alerts (Wunschalarm):
- id UUID PRIMARY KEY
- user_id UUID REFERENCES profiles(id)
- name TEXT
- city TEXT
- radius_km INTEGER
- max_price INTEGER
- min_rooms NUMERIC
- property_type TEXT
- portals TEXT[]
- notification_frequency TEXT (immediate/daily)
- active BOOLEAN DEFAULT true
- created_at TIMESTAMP

TABELLE alerted_listings:
(damit gleiche Inserate nicht mehrfach gemeldet werden)
- id UUID PRIMARY KEY
- alert_id UUID REFERENCES alerts(id)
- listing_url TEXT
- alerted_at TIMESTAMP DEFAULT now()

TABELLE price_changes:
(Historie aller Preisänderungen)
- id UUID PRIMARY KEY
- analysis_id UUID REFERENCES analyses(id)
- old_price INTEGER
- new_price INTEGER
- change_percent NUMERIC
- detected_at TIMESTAMP DEFAULT now()

TABELLE comparisons:
- id UUID PRIMARY KEY
- user_id UUID REFERENCES profiles(id)
- analysis_1_id UUID REFERENCES analyses(id)
- analysis_2_id UUID REFERENCES analyses(id)
- ai_recommendation TEXT
- created_at TIMESTAMP

TABELLE analytics_events:
- id UUID PRIMARY KEY
- user_id UUID
- event_type TEXT
- properties JSONB
- created_at TIMESTAMP DEFAULT now()

Alle mit RLS aktiviert.

Sage am Ende "Bereit für Schritt 6?"
```

---

### Schritt 6 von 70: Shared TypeScript Types
```
Schritt 6 von 70: Geteilte Types zwischen allen Apps.

Erstelle shared/types/index.ts:

interface Portal {
  id: string
  name: string
  domain: string
  flag: string
  isPrivateFriendly: boolean
}

interface PropertyData {
  title, price, pricePerSqm, size, rooms,
  address, district, city, state, zipCode,
  energyClass, yearBuilt, condition,
  floor, totalFloors,
  hasParking, hasBalcony, hasGarden,
  heatingType, daysOnMarket, isPrivateSeller,
  description, portal, originalUrl
}

interface MarketData {
  avgPricePerSqm, priceGrowthLastYear,
  priceGrowth5Years, forecast10Years,
  rentalAvgPerSqm
}

interface LocationData {
  score,
  poisSchools, poisTransit, poisShopping,
  poisHealth, poisParks, poisRestaurants,
  isMainStreet,
  coordinates: { lat, lng }
}

interface PurchaseCosts {
  transferTax, notary, registration,
  agentFee, total, totalPercent
}

interface AIAnalysis {
  summary, fullReport, recommendation,
  recommendationReason, negotiationTip,
  suggestedOfferPrice, riskLevel,
  risks, hiddenCosts, forecast10y,
  forecastValue10y, investmentVerdict,
  pros, cons
}

interface SavedAnalysis {
  id, user_id, original_url, portal,
  ...PropertyData basics
  ...AIAnalysis
  status, user_notes,
  original_price, current_price,
  price_change_percent,
  analyzed_at, last_updated_at
}

interface Alert {
  id, user_id, name, city, radius_km,
  max_price, min_rooms, property_type,
  portals, notification_frequency, active
}

Erkläre:
- Was sind TypeScript Interfaces?
- Warum teilen wir Types?

Sage am Ende "Bereit für Schritt 7?"
```

---

### Schritt 7 von 70: Portal Detector (Shared Utility)
```
Schritt 7 von 70: Portal-Erkennung als geteiltes Utility.

Erstelle shared/utils/portalDetector.ts:

Portale-Datenbank:
{
  'immoscout': {
    domain: 'immobilienscout24.de',
    name: 'ImmoScout24',
    flag: '🇩🇪',
    countries: ['DE', 'AT'],
    isPrivateFriendly: true
  },
  'immowelt': {...},
  'immonet': {...},
  'kleinanzeigen': {...},
  'ohnemakler': {
    domain: 'ohne-makler.net',
    name: 'ohne-makler.net',
    isPrivateFriendly: true,
    savingsHint: 'Meist 3-5% günstiger als Makler'
  },
  'wohnungsboerse': {...},
  'willhaben': {...},
  'homegate': {...}
}

Funktionen:
- detectPortal(url): Portal | null
- isValidUrl(url): boolean
- getAllPortals(): Portal[]
- getPortalById(id): Portal

Verwendet in Mobile + Web + Admin.

Sage am Ende "Bereit für Schritt 8?"
```

---

### Schritt 8 von 70: Destatis Daten importieren
```
Schritt 8 von 70: Marktpreisdaten in Supabase importieren.

Ziel: market_prices Tabelle mit echten Daten füllen.

Schritt 1 — Daten besorgen:
- Destatis Statistik-Portal öffnen
- Datenserie: Baupreise und Immobilienpreisindex
- Download als CSV

Alternative Quellen:
- ImmoScout24 WohnBarometer (öffentlich)
- Empirica-Preisdatenbank (kostenpflichtig)
- Gutachterausschüsse der Länder

Schritt 2 — Import Script:
Erstelle backend/scripts/import-market-prices.ts

Liest CSV → Mappt zu unserem Schema →
Fügt in Supabase ein via Bulk Insert.

Mindestens für Top 50 Städte in DACH:
Berlin, Hamburg, München, Köln, Frankfurt,
Stuttgart, Düsseldorf, Leipzig, etc.

Schritt 3 — Verify:
Query in Supabase Studio:
SELECT * FROM market_prices LIMIT 20

Sage am Ende "Bereit für Schritt 9?"
```

---

### Schritt 9 von 70: Edge Function — fetch-property
```
Schritt 9 von 70: Apify Edge Function.

Erstelle backend/supabase/functions/fetch-property/:

INPUT: { url: string, portal: string }
OUTPUT: PropertyData

APIFY CONFIG:
- APIFY_TOKEN als Supabase Secret

Actors je Portal:
- ImmoScout: clearpath/immoscout24-api-pro
- Immowelt: sian.agency/immowelt-property-scraper
- Immonet: lexis-solutions/immonet-de-scraper
- Kleinanzeigen: epctex/kleinanzeigen-scraper
- Andere: Custom Cheerio Fallback

LOGIK:
1. Validiere URL + Portal
2. Wähle Actor
3. Rufe Apify Sync API auf (returns immediately)
4. Mappe Response zu PropertyData
5. Return

WICHTIG:
- Keine Datenspeicherung von Portal-Content
- Timeout: 15 Sekunden
- Error Handling für offline Inserate

Deployment:
supabase functions deploy fetch-property
supabase secrets set APIFY_TOKEN=xxx

Erkläre:
- Was ist Deno vs Node?
- Wie funktioniert die Apify API?

Sage am Ende "Bereit für Schritt 10?"
```

---

### Schritt 10 von 70: Edge Function — fetch-market
```
Schritt 10 von 70: Marktdaten Edge Function.

Erstelle backend/supabase/functions/fetch-market/:

INPUT: { city, zipCode, state }
OUTPUT: MarketData

LOGIK:
1. Query market_prices Tabelle
   Match auf city + zip_prefix
2. Fallback auf city allein wenn kein match
3. Ergänze mit Bundesbank Häuserpreisindex
4. Berechne Prognose:
   forecast10Years = compound(growth5Years, 10)
5. Return MarketData

Bundesbank API:
https://api.bundesbank.de/service/data/BBDP1
Öffentlich, keine Auth nötig.

Return-Beispiel:
{
  avgPricePerSqm: 9200,
  priceGrowthLastYear: 3.2,
  priceGrowth5Years: 18.5,
  forecast10Years: 40.3,
  rentalAvgPerSqm: 22
}

Sage am Ende "Bereit für Schritt 11?"
```

---

### Schritt 11 von 70: Edge Function — analyze-location
```
Schritt 11 von 70: Lage-Analyse Edge Function.

Erstelle backend/supabase/functions/analyze-location/:

INPUT: { address, city }
OUTPUT: LocationData

SCHRITT 1: Geocoding
Nominatim API (kostenlos):
https://nominatim.openstreetmap.org/search
→ Adresse → { lat, lng }

SCHRITT 2: Points of Interest
Overpass API (kostenlos):
Suche in 500m Radius:
- amenity=school (Schulen)
- railway=station, subway (ÖPNV)
- shop=supermarket (Einkaufen)
- amenity=doctors, pharmacy (Gesundheit)
- leisure=park (Parks)
- amenity=restaurant (Gastronomie)
- amenity=kindergarten (Kitas)

SCHRITT 3: Lärm-Check
Prüfe ob highway=primary/secondary in 50m Radius.

SCHRITT 4: Score berechnen (1-10)
Gewichtung:
- ÖPNV: 30%
- Einkaufen: 25%
- Schulen: 20%
- Gesundheit: 15%
- Parks: 10%

Erkläre:
- OverpassQL Syntax?
- Warum Nominatim rate-limited?

Sage am Ende "Bereit für Schritt 12?"
```

---

### Schritt 12 von 70: Edge Function — analyze-property (KI)
```
Schritt 12 von 70: Claude KI Edge Function.

Erstelle backend/supabase/functions/analyze-property/:

INPUT: {
  property: PropertyData,
  market: MarketData,
  location: LocationData,
  costs: PurchaseCosts,
  priceVerdict: string
}
OUTPUT: AIAnalysis

CLAUDE HAIKU 4.5 verwenden.

SYSTEM PROMPT:
"Du bist ein erfahrener Immobilienanalyst für DACH.
Analysiere sachlich und präzise auf Deutsch.
Nenne konkrete Zahlen. Erkläre für Laien.
Erkläre versteckte Kosten die Käufer übersehen.
Gib klare Empfehlung mit Begründung.
Antworte AUSSCHLIESSLICH in gültigem JSON.
Kein Text davor oder danach.
Kein Markdown, keine Erklärungen."

USER PROMPT strukturiert übergeben:
Alle Daten als JSON in Prompt.

OUTPUT SCHEMA (JSON):
{
  "summary": "3-4 Sätze",
  "fullReport": "~500 Wörter",
  "recommendation": "buy/wait/skip",
  "recommendationReason": "2 Sätze",
  "negotiationTip": "Konkreter Tipp",
  "suggestedOfferPrice": 480000,
  "riskLevel": "low/medium/high",
  "risks": ["Risiko 1", "Risiko 2"],
  "hiddenCosts": ["Kosten 1"],
  "forecast10y": "Prognose",
  "forecastValue10y": 650000,
  "investmentVerdict": "good/medium/bad",
  "pros": ["Vorteil 1"],
  "cons": ["Nachteil 1"]
}

ERROR HANDLING:
- JSON Parse Errors abfangen
- Retry bei Fehler (max 2x)
- Fallback bei komplettem Fail

Secrets:
supabase secrets set ANTHROPIC_API_KEY=xxx

Sage am Ende "Bereit für Schritt 13?"
```

---

### Schritt 13 von 70: Edge Function — full-analysis
```
Schritt 13 von 70: Vollständige Analyse orchestrieren.

Erstelle backend/supabase/functions/full-analysis/:

Diese Function orchestriert alle anderen Functions.

INPUT: { url, user_id }
OUTPUT: SavedAnalysis (in DB gespeichert)

LOGIK:

1. Rate Limit prüfen:
   - Free User: max 3/Monat
   - Wenn überschritten: 403 Error

2. Portal erkennen:
   detectPortal(url)

3. Parallele API-Calls:
   const [property, market] = await Promise.all([
     invoke('fetch-property', { url, portal }),
     // market kommt später (braucht city aus property)
   ])

4. Sekundäre Calls (sequenziell):
   const location = await invoke('analyze-location', {
     address: property.address, city: property.city
   })
   const market = await invoke('fetch-market', {
     city: property.city, zipCode: property.zipCode
   })

5. Berechnungen:
   - Price Verdict berechnen
   - Purchase Costs berechnen (je Bundesland)
   - Gross Yield berechnen
   - Estimated Rent aus market.rentalAvgPerSqm

6. KI-Analyse:
   const ai = await invoke('analyze-property', {
     property, market, location, costs, priceVerdict
   })

7. In DB speichern:
   INSERT INTO analyses (...)

8. Rate Limit erhöhen:
   UPDATE profiles SET analyses_this_month = +1

9. Return: SavedAnalysis

Erkläre:
- Was ist Promise.all?
- Warum orchestrieren wir?

Sage am Ende "Bereit für Schritt 14?"
```

---

### Schritt 14 von 70: Cron Jobs für Preisänderungen
```
Schritt 14 von 70: Preisänderungs-Alarm.

Erstelle backend/supabase/functions/check-price-changes/:

CRON: Täglich 6:00 Uhr Europe/Berlin

LOGIK:

1. Lade alle Analysen der letzten 90 Tage:
   SELECT * FROM analyses
   WHERE analyzed_at > now() - interval '90 days'
   AND status != 'rejected'

2. Für jede Analyse (in Batches von 20):
   - Rufe fetch-property auf mit original_url
   - Wenn Inserat offline: skip
   - Berechne Preisänderung

3. Wenn |change| >= 3%:
   
   a) Update analyses:
   UPDATE analyses SET
     current_price = new_price,
     price_change_percent = X,
     last_price_check = now()
   WHERE id = analysis_id
   
   b) INSERT price_changes:
   Historie-Eintrag
   
   c) Wenn Preis GESUNKEN:
   Push Notification an user_id:
   Titel: "📉 Preis reduziert!"
   Body: "München-Schwabing: €30.000 günstiger"
   Data: { analysis_id }

4. Log in sync_logs

WICHTIG:
- Rate Limit für Apify beachten
- Bei 500+ Analysen: Aufteilen in mehrere Runs
- Errors ignorieren, nächstes Objekt

Cron einrichten:
supabase functions deploy check-price-changes
Dann in Supabase Dashboard:
- Database → Cron Jobs
- Add job: check-price-changes → daily at 06:00

Sage am Ende "Bereit für Schritt 15?"
```

---

## PHASE 2 — WEB APP LANDING (Schritte 15–22)

### Schritt 15 von 70: Astro Setup + Design System
```
Schritt 15 von 70: Astro Web App.

Wechsle in web/.
npm create astro@latest . -- --template minimal --typescript strict

Installiere:
- @astrojs/tailwind
- @astrojs/react
- @astrojs/sitemap
- @supabase/supabase-js
- lucide-react
- framer-motion

Konfiguriere Tailwind mit ImmoTrue Farben:
colors: {
  background: '#0A0C0B',
  surface: '#141816',
  surface2: '#1C2020',
  gold: {
    DEFAULT: '#D4A847',
    light: '#E8BC5A',
    dark: '#A07830'
  },
  verdict: {
    cheap: '#2ECC8F',
    fair: '#D4A847',
    expensive: '#F5A623',
    overpriced: '#E8394A'
  },
  text: {
    primary: '#F2F0EC',
    secondary: '#A8ADAA',
    muted: '#6B7470'
  }
}

Fonts:
- Playfair Display (Headings)
- Inter (Body)
- IBM Plex Mono (Zahlen)

Erstelle Basis-Komponenten:
- Button.astro (Primary/Secondary/Ghost)
- Card.astro
- Badge.astro
- Input.astro

Ordnerstruktur:
web/src/
  components/
    ui/
    landing/
    analysis/
    layout/
  layouts/
  pages/
  content/
  lib/
  styles/

Sage am Ende "Bereit für Schritt 16?"
```

---

### Schritt 16 von 70: Landing Page — Header + Hero
```
Schritt 16 von 70: Landing Page Header + Hero.

Erstelle src/pages/index.astro und src/layouts/Landing.astro:

HEADER (sticky, transparent → solid bei Scroll):
- Logo "ImmoTrue" (Playfair Gold)
- Nav: Analysieren · Preise · Blog · Login
- CTA: "Kostenlos starten" (Gold Gradient)

HERO SECTION (100vh):
- Full-screen background: #0A0C0B
- Animierte Gold-Partikel (CSS animation)
- Zentriert:

H1 (Playfair 72px):
"Wahrheit über
 jedes Inserat."

Subtitle (Inter 20px):
"KI-gestützte Immobilienanalyse für DACH.
 Alle 8 Portale. Ein Klick zur Wahrheit."

URL-Input (groß, prominent):
- Platzhalter: "ImmoScout, Immowelt, ohne-makler.net URL..."
- Live Portal-Erkennung als Badge
- Focus: Gold-Glow

Primary CTA: "Kostenlos analysieren" (Gold Gradient)

Trust Row unten:
"⭐⭐⭐⭐⭐ 4,8 · 10.000+ Analysen · Alle 8 DACH-Portale"

ANIMATIONEN:
- Gold-Partikel schweben aufwärts
- H1 Fade-in + Slide-Up
- URL-Input hat subtile Gold-Border-Animation
- Bei URL-Erkennung: Badge slide-up

Sage am Ende "Bereit für Schritt 17?"
```

---

### Schritt 17 von 70: Landing — Features Grid
```
Schritt 17 von 70: Features Section.

Section unter Hero:

Titel (Playfair, zentriert):
"Alles was du für deine Kaufentscheidung brauchst"

3x3 Grid mit 9 Feature Cards:

1. 🎯 KI-Preisbewertung
   "Ampel-System zeigt sofort: fair oder überteuert"

2. 📊 Vollständiger KI-Bericht
   "Detaillierte Analyse mit Verhandlungsstrategie"

3. 💰 Finanzierungsrechner
   "Monatliche Rate, Break-Even, alles in Echtzeit"

4. 📍 Lage-Analyse
   "12 Faktoren: ÖPNV, Schulen, Einkaufen, Ärzte"

5. ⚠️ Risiko-Erkennung
   "Versteckte Kosten und Risiken aufdecken"

6. 🔮 10-Jahres Prognose
   "Wertentwicklung basierend auf echten Marktdaten"

7. 📂 Portfolio & Historie
   "Alle Analysen speichern und wiederkommen"

8. 🔔 Preisänderungs-Alarm
   "Push wenn dein Objekt günstiger wird"

9. 📄 PDF-Export
   "Professioneller Report für Bank und Notar"

Card Design:
- border-radius: 20px
- background: surface
- padding: 24px
- Icon oben (24px, Gold)
- Titel Playfair 18px
- Beschreibung Inter 14px muted
- Hover: subtle Gold border + lift

ANIMATION:
Cards erscheinen bei Scroll mit stagger (100ms Delay).

Sage am Ende "Bereit für Schritt 18?"
```

---

### Schritt 18 von 70: Landing — Portale + How It Works
```
Schritt 18 von 70: Portale Section + How It Works.

SECTION 1 — Unterstützte Portale:

Titel: "Alle wichtigen Portale — ein Tool"

Grid mit 8 Portal-Logos in Reihe:
ImmoScout · Immowelt · Immonet · Kleinanzeigen
ohne-makler.net · Wohnungsbörse · Willhaben · Homegate

Kleine Notiz: "Kein Portal dabei? Sag uns Bescheid."

SECTION 2 — How It Works (3 Steps):

Titel: "So funktioniert es"

3-Spalten:

Step 1: URL EINFÜGEN
Screenshot Mockup: URL-Eingabefeld
Text: "Kopiere die URL aus dem Portal"

Step 2: KI ANALYSIERT
Screenshot Mockup: Loading Screen
Text: "In 10 Sekunden vollständige Analyse"

Step 3: ERGEBNIS ERHALTEN
Screenshot Mockup: Preis-Ampel
Text: "Sofort Klarheit über Preis, Lage, Risiken"

CTA darunter:
"Probier es jetzt aus — kostenlos, ohne Registrierung"
Button zu #analyze

SECTION 3 — Beispiel-Analyse:

Screenshot einer vollständigen Analyse.
Blur-Overlay auf Premium-Features.
Badge "Premium" auf gesperrten Sektionen.

Sage am Ende "Bereit für Schritt 19?"
```

---

### Schritt 19 von 70: Landing — Pricing + FAQ
```
Schritt 19 von 70: Pricing Section + FAQ.

PRICING SECTION:

Titel (Playfair): "Einfache, faire Preise"
Untertitel: "Kostenlos starten. Keine Kreditkarte nötig."

2 Pricing Cards (Side by Side):

FREE Card:
- Preis: €0
- Beschreibung: "Für Erstkäufer"
- Features:
  ✓ 3 Analysen pro Monat
  ✓ Preis-Ampel + Basis-Kennzahlen
  ✓ Lage-Score
  ✓ Alle 8 Portale
  ✓ Ergebnis 24h verfügbar
- Button: "Kostenlos starten" (Ghost)

PREMIUM Card (mit Gold-Border, elevated):
- Badge oben: "BELIEBT" in Gold
- Preis: "€4,99 / Monat"
- Alternative: "oder €34,99/Jahr (2 Monate GRATIS)"
- Features:
  ★ Alle Free Features
  ★ Unbegrenzte Analysen
  ★ KI-Vollbericht mit Verhandlungstipp
  ★ Portfolio & Historie (unbegrenzt)
  ★ Preisänderungs-Alarm
  ★ Finanzierungsrechner
  ★ 10-Jahres Prognose
  ★ Risiko-Analyse
  ★ PDF-Export
  ★ Objekte vergleichen
  ★ Wunschalarm
- Green Badge: "7 Tage kostenlos testen"
- Button: "Premium starten" (Gold Gradient)

Trust Row unten:
"DSGVO-konform · SSL-verschlüsselt · Sicheres Payment"

FAQ SECTION (Accordion):

Fragen:
1. Wie funktioniert die KI-Analyse?
2. Ist meine Daten sicher?
3. Kann ich jederzeit kündigen?
4. Speichert ihr die Inserate?
   → "Nein — nur unsere eigene Analyse und deine Notizen.
      Portal-Inhalte werden nicht gespeichert."
5. Was passiert nach 3 Analysen?
6. Unterstützt ihr Österreich/Schweiz?
7. Web und Mobile — gleicher Account?
8. Wie funktioniert der Preisalarm?

Sage am Ende "Bereit für Schritt 20?"
```

---

### Schritt 20 von 70: Web Analyse-Flow — URL zu Loading
```
Schritt 20 von 70: Web-Analyse Screen starten.

Erstelle src/pages/analyze.astro:

Layout:
- App-Header (nach Login)
- Hauptbereich

STATE 1: Kein URL eingegeben
Zentriert:
- Hero-Text: "Was möchtest du analysieren?"
- Große URL-Eingabe
- Portal-Erkennung Live
- "Analysieren" Button

STATE 2: Loading
Fullscreen (im Container):
- Gold Progress Ring (SVG animiert)
- Fortschrittsschritte:
  ✓ Inserat wird geladen (Apify)
  ✓ Marktdaten werden analysiert
  ⏳ Lage wird bewertet
  ○ Kaufnebenkosten berechnen
  ○ KI erstellt Bericht
- Geschätzte Zeit: "~10 Sekunden"
- Rotierender Quote unten:
  "Gewusst? 80% der Käufer zahlen zu viel."

Erstelle React-Komponente:
src/components/analysis/AnalyzeFlow.tsx

client:load Direktive für Interaktivität.
Nutzt useMutation von React Query.
Zeigt State entsprechend.

Bei Erfolg: Navigate zu Result Screen.
Bei Fehler: Klare Meldung + Retry.

Sage am Ende "Bereit für Schritt 21?"
```

---

### Schritt 21 von 70: Web Result — Hero + Metrics
```
Schritt 21 von 70: Web Ergebnis-Screen Teil 1.

Erstelle src/pages/analyze/[id].astro:
Dynamische Route für gespeicherte Analysen.

Erstelle src/components/analysis/ResultHero.tsx:

Layout Desktop (2 Spalten):

LINKS (60%):
- Objekt-Info Card:
  - Adresse in Playfair 32px
  - Meta: "78m² · 3 Zimmer · Baujahr 1975"
  - Portal Badge: "ImmoScout24"
  - "Seit 94 Tagen inseriert" Badge

RECHTS (40%):
- Preis-Ampel Badge (groß, 200px):
  GÜNSTIG grün / FAIR gold / TEUER amber / ÜBERTEUERT rot
- Massiver Preis: "€549.000" (Playfair 64px)
- Abweichung: "18% über Marktwert" (rot)
- Suggested Offer (Premium):
  "Empfohlenes Angebot: €480.000"

ANIMATIONEN (framer-motion):
- Preis-Ampel: Scale-in mit Spring
- Preis: Count-up von 0 in 1.5s
- Deviation: Fade + slide

MetricsGrid Komponente:
3x2 Grid mit 6 Cards:
1. Kaufpreis/m² + Marktvergleich
2. Mietrendite + Bewertung
3. Lage-Score + Ring-Progress
4. Verhandlungspotenzial
5. Kaufnebenkosten total
6. Mietschätzung

Jede Card:
- Icon + Wert (groß) + Vergleich
- border-radius: 20px
- Hover: Lift + Gold-Border

Sage am Ende "Bereit für Schritt 22?"
```

---

### Schritt 22 von 70: Web Result — KI-Report + Rechner
```
Schritt 22 von 70: KI-Report + Finanzierungsrechner (Web).

AIReport Komponente:

FÜR FREE:
- 3 Sätze Summary sichtbar
- Blur-Overlay auf Rest
- CTA Card: "Premium für Vollbericht"

FÜR PREMIUM:
- Accordion mit 5 Sektionen:
  📊 Preisbewertung
  📍 Lage (mit Karte)
  ⚠️ Risiken
  💡 Verhandlungsempfehlung
  🔮 10-Jahres Prognose

Special: Verhandlungs-Tipp Card
Gold-Border, prominent:
"💡 Verhandlungstipp:
Biete €480.000 statt €549.000.
Begründung: 94 Tage inseriert, 18% über Markt."
Copy-Button für den Text.

FinancingCalculator Komponente:

3 Slider (React Slider):
- Eigenkapital 10-50%
- Zinssatz 2-6%
- Laufzeit 10-35 Jahre

Live-Berechnung:
- Monatliche Rate (groß, Gold)
- Gesamtzinsen
- Gesamtkosten
- Break-Even Punkt

Szenario Buttons:
[Konservativ 4,5%] [Aktuell 3,5%] [Optimistisch 2,5%]

Chart: Kaufen vs. Mieten Vergleich über Zeit.

Alles nur Premium (Free sieht blur).

Sage am Ende "Bereit für Schritt 23?"
```

---

### Schritt 23 von 70: Web Result — Portfolio Actions
```
Schritt 23 von 70: Portfolio Actions.

Bei jedem Ergebnis-Screen:

TOP RIGHT:
- ⭐ "Als Favorit speichern" Button
- 📑 "Als PDF exportieren" (Premium)
- 🔗 "Original-Inserat öffnen"

BOTTOM SECTION:
"Diese Analyse speichern"

Wenn User klickt:
Modal öffnet sich:

┌────────────────────────────────────┐
│  Zu Portfolio hinzufügen           │
│                                    │
│  Kategorie wählen:                 │
│  ○ ⭐ Favorit                      │
│  ○ 👀 Interessant                  │
│  ○ ✅ Besichtigt                   │
│  ○ ❌ Verworfen                    │
│                                    │
│  Notiz (optional):                 │
│  ┌────────────────────────────┐    │
│  │                            │    │
│  └────────────────────────────┘    │
│                                    │
│  Preisänderungs-Alarm:             │
│  ☑ Benachrichtige mich             │
│                                    │
│  [Abbrechen] [Speichern]           │
└────────────────────────────────────┘

Nach Speichern:
- Toast: "In Portfolio gespeichert ⭐"
- Analyse-ID wird gespeichert
- Redirect nicht nötig, User bleibt

GATE: Portfolio ist Premium.
Free-User: Modal zeigt Paywall Trigger.

Sage am Ende "Bereit für Schritt 24?"
```

---

### Schritt 24 von 70: Portfolio Screen (Web)
```
Schritt 24 von 70: Portfolio Screen Web.

Erstelle src/pages/portfolio.astro:

Layout:

TOP:
- Titel: "Meine Analysen"
- Zähler: "12 Objekte"

FILTER BAR:
- Kategorie-Buttons:
  Alle (12) · ⭐ Favoriten (4) · 👀 Interessant (5)
  ✅ Besichtigt (2) · ❌ Verworfen (1)
- Sort Dropdown: Neueste / Preis / Preisänderung
- Suche: nach Adresse

GRID mit Analyse-Cards:

Jede Card:
- Preis-Verdict Badge (klein)
- Adresse (Playfair)
- Preis (groß, IBM Mono)
- Meta: Größe · Zimmer · Bauj.
- Status Badge (⭐/👀/✅/❌)
- Preisänderung wenn vorhanden:
  "📉 -€30.000 seit erster Analyse"
- Letzte Analyse: "vor 5 Tagen"
- Aktionen: [Ansehen] [Aktualisieren] [Löschen]

WICHTIG:
- Beim Klick auf "Ansehen":
  Aus DB laden (KEIN API-Call zu Apify/Claude)
- Beim Klick auf "Aktualisieren":
  Neue API-Calls durchführen
  Alte Analyse aktualisieren

Erstelle Custom Hook usePortfolio:
- getAll(): Alle Analysen
- getByStatus(status): Filter
- update(id, data): Update
- delete(id): Löschen
- refresh(id): Neue Analyse

Sage am Ende "Bereit für Schritt 25?"
```

---

### Schritt 25 von 70: Alerts Screen (Web)
```
Schritt 25 von 70: Wunschalarm Screen (Web).

Erstelle src/pages/alerts.astro:

WENN FREE:
- Locked State
- Illustration
- "Wunschalarm ist Premium"
- Benefit: "Sei der Erste bei neuen Objekten"
- CTA Premium

WENN PREMIUM:
- Header: "Meine Alarme"
- Liste aktiver Alarme

Jeder Alarm Card:
- Name/Titel
- Kriterien-Zusammenfassung:
  "München, 3-Zi bis €500k, ImmoScout + Immowelt"
- Toggle On/Off
- Anzahl gefundener Objekte diesen Monat
- Aktionen: Bearbeiten · Löschen

"Neuer Alarm" Button (groß, Gold).

Neuer Alarm — Modal:
Formular:
- Name (Optional)
- Stadt/PLZ (Autocomplete)
- Radius: 5/10/20/50 km
- Max Preis (Slider)
- Min Zimmer: 1/2/3/4/5+
- Typ: Wohnung/Haus/Beides
- Portale: Multi-Select (8 Portale)
- Benachrichtigung: Sofort/Täglich

Speichern → alerts Tabelle.

Historie unten:
"Letzte Treffer"
Liste mit Objekt-Cards
Jedes Objekt: "Analysieren" Button

Max 5 aktive Alarme.

Sage am Ende "Bereit für Schritt 26?"
```

---

### Schritt 26 von 70: Blog System
```
Schritt 26 von 70: Astro Content Collections für Blog.

Erstelle src/content/config.ts:

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string(),
    category: z.enum(['guide', 'market', 'legal', 'tips']),
    tags: z.array(z.string()),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional()
  })
})

Erstelle Pages:
- src/pages/blog/index.astro (Übersicht)
- src/pages/blog/[slug].astro (Einzelartikel)
- src/pages/blog/category/[category].astro

Blog Übersicht:
- Featured Article oben (groß)
- Kategorie-Filter
- Grid mit 9 Articles pro Seite
- Pagination

Einzelartikel:
- Full-width Hero mit Featured Image
- Titel Playfair 48px
- Meta: Autor · Datum · Reading Time
- Table of Contents (sticky)
- Artikel-Content (Markdown → HTML)
- Verwandte Artikel unten
- CTA: "Analysiere jetzt selbst" (Gold Button)

Erste 5 Artikel-Titel (Inhalt schreibst du):
1. "Kaufpreisfaktor nach Stadt — wo lohnt sich Kaufen?"
2. "Kaufnebenkosten aller 16 Bundesländer 2026"
3. "Mietrendite berechnen — die einfache Formel"
4. "10 Warnzeichen in Immobilien-Inseraten"
5. "Verhandlungsstrategien beim Immobilienkauf"

Sage am Ende "Bereit für Schritt 27?"
```

---

### Schritt 27 von 70: SEO Optimierung
```
Schritt 27 von 70: SEO für Web App.

Alle Seiten sollten haben:

Meta Tags dynamisch:
- <title>
- <meta description>
- Open Graph (og:*)
- Twitter Card
- Canonical URL

Structured Data (Schema.org):
- WebApplication für Landing
- Product für Pricing
- Article für Blog Posts
- BreadcrumbList

Erstelle:
src/layouts/Base.astro mit SEO-Slots
src/components/SEO.astro Komponente

sitemap.xml automatisch via @astrojs/sitemap.
robots.txt konfigurieren.

Performance-Optimierung:
- Bilder: Astro Image Component
- WebP Format
- Lazy Loading
- Font Display swap
- Prefetch critical resources

Ziel: Lighthouse 95+

OG Images automatisch:
Erstelle src/pages/og/[slug].png.ts
Nutze @vercel/og oder canvas.

Sage am Ende "Bereit für Schritt 28?"
```

---

### Schritt 28 von 70: Auth Web
```
Schritt 28 von 70: Web Auth mit Supabase.

Erstelle:
- src/pages/login.astro
- src/pages/register.astro
- src/pages/forgot-password.astro
- src/pages/dashboard.astro (nach Login)

useAuth Composable:
- currentUser State
- login(email, password)
- register(email, password, userType)
- logout()
- resetPassword(email)

Middleware für Auth:
src/middleware.ts
- Protected Routes: /portfolio, /alerts, /dashboard
- Redirect zu /login wenn nicht authentifiziert

Session Management:
- Persist in Cookies (HTTP-only)
- Auto-Refresh Token

Login Screen:
- ImmoTrue Logo
- Form: Email + Passwort
- Social Login (Google, Apple - optional später)
- "Passwort vergessen?" Link
- "Noch keinen Account?" Link zu Register

Register Screen:
- Form: Email, Passwort, Passwort bestätigen
- Segment: User Type
- AGB Checkbox
- "Registrieren" Button
- Nach Register: Welcome Email via Resend

Sage am Ende "Bereit für Schritt 29?"
```

---

## PHASE 3 — MOBILE APP (Schritte 29–55)

### Schritt 29 von 70: Expo Projekt
```
Schritt 29 von 70: React Native + Expo Setup.

Wechsle in mobile/.

npx create-expo-app@latest . --template blank-typescript

Installiere Core Packages:
- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context
- react-native-gesture-handler
- react-native-reanimated

APIs & Storage:
- @tanstack/react-query
- @supabase/supabase-js
- zustand
- @react-native-async-storage/async-storage

UI & Styling:
- nativewind
- react-native-svg
- lucide-react-native
- @expo-google-fonts/playfair-display
- @expo-google-fonts/inter
- @expo-google-fonts/ibm-plex-mono

Features:
- expo-camera
- expo-notifications
- expo-print (PDF)
- expo-sharing
- expo-linear-gradient
- @react-native-community/slider
- react-native-maps
- react-native-purchases (RevenueCat)

Ordnerstruktur:
mobile/src/
  components/
    ui/
    analysis/
    portfolio/
    home/
    common/
  screens/
    auth/
    main/
    analysis/
    portfolio/
    settings/
    paywall/
  navigation/
  hooks/
  lib/
  store/
  utils/
  constants/
  assets/

Import shared/ als Alias:
tsconfig.json paths.

Sage am Ende "Bereit für Schritt 30?"
```

---

### Schritt 30 von 70: NativeWind + Design
```
Schritt 30 von 70: Design System Mobile.

NativeWind v4 einrichten.
tailwind.config.js mit gleichen Farben wie Web.

Erstelle mobile/src/constants/theme.ts:
Exportiere Farben, Spacing, Typography als JS-Konstanten.

Fonts laden mit useFonts:
- Playfair Display: Regular, Bold
- Inter: Regular, Medium, SemiBold, Bold
- IBM Plex Mono: Regular, Medium

SplashScreen von expo-splash-screen.
Warte bis Fonts geladen sind.

Erstelle Basis-Komponenten:
- Button.tsx (Primary/Secondary/Ghost)
- Card.tsx
- Badge.tsx
- Input.tsx
- Modal.tsx
- LoadingSpinner.tsx

Alle nutzen NativeWind + eigenes Design System.

Sage am Ende "Bereit für Schritt 31?"
```

---

### Schritt 31 von 70: Navigation komplett
```
Schritt 31 von 70: Vollständige Navigation.

BOTTOM TAB NAVIGATOR (4 Tabs):
1. Home (Analyse-Tab) — Icon: Search
2. Portfolio — Icon: Bookmark
3. Alarme — Icon: Bell
4. Profil — Icon: User

STACK NAVIGATORS je Tab:

Home Stack:
- HomeScreen
- LoadingScreen
- ResultScreen
- FullReportScreen (Premium)

Portfolio Stack:
- PortfolioScreen
- SavedAnalysisScreen (aus DB)
- ComparisonScreen

Alerts Stack:
- AlertsScreen
- CreateAlertScreen
- EditAlertScreen

Profile Stack:
- ProfileScreen
- SettingsScreen
- SubscriptionScreen
- LegalScreen

AUTH STACK:
- WelcomeScreen
- LoginScreen
- RegisterScreen

MODAL STACK (kann von überall geöffnet werden):
- PaywallScreen
- SavePropertyModal
- ShareModal

Custom Tab Bar:
- Dark Design
- Gold Highlight aktiver Tab
- Sanfte Icon-Animation beim Wechsel

Erstelle useNavigation Wrapper Hook
für Type Safety.

Sage am Ende "Bereit für Schritt 32?"
```

---

### Schritt 32 von 70: Auth Screens Mobile
```
Schritt 32 von 70: Auth komplett Mobile.

WelcomeScreen:
- Gold-Partikel Animation Background
- Logo mit Puls-Animation
- Tagline: "Wahrheit über jedes Inserat."
- 3 rotierende Benefit-Cards
- CTA Buttons:
  "Kostenlos starten"
  "Bereits registriert? Anmelden"

LoginScreen:
- Email + Password Input
- Show/Hide Password Toggle
- Login Button
- Forgot Password Link
- Social Login Buttons (optional)

RegisterScreen:
- Email + Password + Confirm
- User Type Segment: Käufer/Investor/Beides
- AGB Checkbox
- Register Button

useAuth Hook (src/hooks/useAuth.ts):
- currentUser
- session
- isPremium
- login, register, logout
- resetPassword

Auth Persistence:
- Supabase Session in AsyncStorage
- Auto-Login bei App-Start
- Token Refresh automatisch

Navigation Guard:
- Wenn nicht auth: Auth Stack
- Wenn auth: Main App

Sage am Ende "Bereit für Schritt 33?"
```

---

### Schritt 33 von 70: Home Screen
```
Schritt 33 von 70: Home Screen bauen.

HomeScreen Layout:

TOP BAR:
- ImmoTrue Logo (klein, links)
- Notification Bell (Badge wenn Alerts)
- User Avatar (rechts)

HERO SECTION:
- Playfair Heading:
  "Wahrheit über
   jedes Inserat."
- Subtitle:
  "Füge die URL ein"

URL INPUT:
- Große Input Card
- Placeholder: "ImmoScout, Immowelt, ohne-makler.net..."
- Paste-Icon rechts (füllt aus Clipboard)
- Portal-Badge erscheint bei Erkennung
- Fehlermeldung wenn Portal unbekannt

"Analysieren" Button:
- Gold Gradient
- Disabled wenn keine URL
- Bei Klick: LoadingScreen

LIMIT BANNER (Free User):
"2 von 3 Analysen diesen Monat"
Progress Bar
CTA: "Premium für unbegrenzt"

RECENT ANALYSES (letzte 3):
Horizontal ScrollView mit Cards.
Nur wenn Premium und Analysen vorhanden.
Klick öffnet gespeicherte Analyse.

PORTALE SUPPORT:
"Unterstützt" + 8 Portal-Icons in Reihe.

ANIMATIONEN:
- Portal-Badge slide-up bei URL-Erkennung
- Analysen-Cards stagger-in

Sage am Ende "Bereit für Schritt 34?"
```

---

### Schritt 34 von 70: Loading Screen Mobile
```
Schritt 34 von 70: Loading Screen mit Fortschritt.

LoadingScreen:

- Fullscreen dark background
- Animierte Gold-Partikel (react-native-reanimated)

Zentriert:

Circular Progress:
- SVG Ring mit Gold Gradient
- Innen: Building Icon (pulsiert)
- Größe 200x200

Steps List:
5 Schritte, erscheinen nacheinander:
1. "Inserat wird geladen..." (Apify)
2. "Marktdaten werden analysiert..." (Destatis)
3. "Lage wird bewertet..." (OpenStreetMap)
4. "Kaufnebenkosten berechnet..."
5. "KI erstellt Bericht..." (Claude)

Jeder Schritt:
- Icon links (⏳ → ✓)
- Text rechts
- Erledigt: grün
- Aktuell: Gold + Puls

Estimated Time unten:
"~10 Sekunden"

Bottom Quote (rotiert):
- "Gewusst? 80% der Käufer zahlen zu viel."
- "ImmoTrue zeigt dir warum."
- "Verhandeln lohnt sich."

BEI FEHLER:
- Icon + Titel: "Analyse fehlgeschlagen"
- Beschreibung des Fehlers
- "Erneut versuchen" Button
- "Zurück" Button

Sage am Ende "Bereit für Schritt 35?"
```

---

### Schritt 35 von 70: Result Screen Hero
```
Schritt 35 von 70: Ergebnis-Screen Hero.

ResultScreen mit ScrollView.

Hero Section (Card mit Gold Gradient):

VERDICT BADGE (groß, 140x140):
- Rundes Badge
- Farbe je Verdict:
  cheap → grün
  fair → gold
  expensive → amber
  overpriced → rot
- Text uppercase:
  "GÜNSTIG" / "FAIR" / "TEUER" / "ÜBERTEUERT"
- Playfair Bold

PRICE DISPLAY:
- Massiv: "€549.000" (IBM Plex Mono 48px bold)
- Count-Up Animation von 0 in 1.5s

DEVIATION:
- "18% über Marktwert" mit Pfeil
- Farbe rot

SUGGESTED OFFER (Premium):
- Gold Pill Badge:
  "Empfohlenes Angebot: €480.000"

OBJEKT META:
- Adresse Playfair
- Meta Row: "78m² · 3 Zimmer · Baujahr 1975"
- Portal Badge + "Seit 94 Tagen"

TOP RIGHT ACTIONS:
- ⭐ Speichern Button
- 🔗 Share
- 📄 PDF (Premium)

ANIMATIONEN:
- Verdict Badge: Spring Scale-in
- Price: Count-up
- Deviation: Fade + slide

Sage am Ende "Bereit für Schritt 36?"
```

---

### Schritt 36 von 70: Metrics Grid Mobile
```
Schritt 36 von 70: Kennzahlen-Grid.

Erstelle src/components/analysis/MetricsGrid.tsx:

2x3 Grid (2 Columns):

Card 1: KAUFPREIS/M²
- Icon: 📐
- Value: €10.897 (Playfair 24px)
- Comparison: "Ø €9.200/m²"
- Arrow rot (18% über)

Card 2: MIETRENDITE
- Icon: 💰
- Value: 2,8%
- Rating: "Schwach"
- Empfohlen: 4%+

Card 3: LAGE-SCORE
- Icon: 📍
- Value: 8,4/10
- Ring-Progress
- Rating: "Sehr gut"

Card 4: VERHANDLUNG
- Icon: 💬
- Value: HOCH
- Grund: "94 Tage inseriert"
- Farbe: Gold

Card 5: NEBENKOSTEN
- Icon: 💸
- Value: +€52.000
- "Aufschlüsselung anzeigen" → Modal

Card 6: MIETSCHÄTZUNG
- Icon: 🏘️
- Value: ~€1.850/Monat
- "Für Investoren"

Design:
- border-radius: 20px
- background: surface
- padding: 16px
- Hover: Gold-Border-Glow

STAGGER ANIMATION:
Cards erscheinen einzeln mit 100ms Delay.

Klick auf Card → Details Modal.

Sage am Ende "Bereit für Schritt 37?"
```

---

### Schritt 37 von 70: KI-Summary Komponente
```
Schritt 37 von 70: KI-Zusammenfassung.

Erstelle src/components/analysis/AISummary.tsx:

Card mit Icon "🤖 KI-Analyse".

FÜR FREE:
- 3 Sätze Zusammenfassung sichtbar
- Endet mit "..."
- Blur-Overlay unten
- CTA Card:
  "Vollständigen Bericht mit Premium lesen"
  Gold Button

FÜR PREMIUM:
- Volle Zusammenfassung (150 Wörter)
- Playfair Italic für Zitat-Feeling
- Gold-Rand links (Zitat-Bar)
- "Vollständigen Bericht anzeigen" Button
  → Navigiert zu FullReportScreen

Design:
- Padding großzügig
- Text 16px lesbar
- Line-Height 1.6

Sage am Ende "Bereit für Schritt 38?"
```

---

### Schritt 38 von 70: Full Report Screen (Premium)
```
Schritt 38 von 70: Vollständiger KI-Bericht Screen.

FullReportScreen:

Header:
- ← Zurück Button
- Titel: "KI-Analyse"
- ⭐ Save Button

Objekt-Info Header (klein):
Adresse + Preis + Verdict Badge

5 Sektionen als Accordion:

Section 1: 📊 Preisbewertung
- Marktvergleich in Text
- Chart: Preis vs. Vergleichsobjekte
- Deviation mit Erklärung

Section 2: 📍 Lage
- Score Breakdown mit 8 Kategorien
- Map Preview (react-native-maps)
- POI Liste
- "Auf großer Karte anzeigen"

Section 3: ⚠️ Risiken
- Risk Level Badge
- Cards für jedes Risiko:
  - Baujahr-Sanierung
  - Energieklasse
  - Lage-Risiken
  - Rechtliches

Section 4: 💡 Empfehlung
- Große Gold Card:
  "💡 Verhandlungstipp"
  Konkrete Empfehlung
  Angebotstext zum Copy
- Pros vs. Cons Two-Column
- Klare Kaufempfehlung

Section 5: 🔮 10-Jahres Prognose
- Line Chart (react-native-chart-kit)
- 3 Szenarien
- Wertentwicklung
- Vergleich mit Anlageformen

Alles aufklappbar.
Erste Section standardmäßig offen.

Sage am Ende "Bereit für Schritt 39?"
```

---

### Schritt 39 von 70: Finanzierungsrechner Mobile
```
Schritt 39 von 70: Finanzierungsrechner.

Erstelle src/components/analysis/FinancingCalculator.tsx:

3 Slider Cards:
- @react-native-community/slider
- Gold Thumb + Track

1. Eigenkapital
   Range: 10-50%
   Default: 20%
   Aktueller Wert groß angezeigt

2. Zinssatz
   Range: 2,0-6,0%
   Default: 3,5%

3. Laufzeit
   Range: 10-35 Jahre
   Default: 25

Output Card (groß, prominent):
- Label: "Monatliche Rate"
- Wert: €2.847 (Playfair 32px Gold)
- Sub-Werte:
  - Gesamtkosten: €846.000
  - Gesamtzinsen: €245.000

Break-Even Card:
- "Ab Jahr 12 günstiger als mieten"
- Kleine Visualisierung

3 Szenario-Buttons:
[Konservativ] [Aktuell] [Optimistisch]
Bei Klick: Alle Slider animieren zu neuen Werten (Spring).

Annuitätenformel:
Rate = P * (r * (1+r)^n) / ((1+r)^n - 1)

GATE FREE:
- Alles ausgegraut
- Overlay: "Premium freischalten"
- CTA Button

Sage am Ende "Bereit für Schritt 40?"
```

---

### Schritt 40 von 70: Location Detail Screen
```
Schritt 40 von 70: Detaillierte Lage-Analyse.

LocationDetailScreen:

Layout:

TOP (40%):
- react-native-maps
- Dark Style
- Property Pin (Gold, pulsing ring)
- POI Pins in Kategorie-Farben
- Zoom Controls
- Klick auf Pin: Popup mit Info

MIDDLE:
- Score-Übersicht
- Große Zahl "8,4/10"
- Ring Chart um die Zahl

BOTTOM: 8 Kategorien Liste:
🚇 ÖPNV: "U3 — 3 Min zu Fuß" ⭐⭐⭐⭐⭐
🛒 Einkaufen: "Rewe 200m, Lidl 400m" ⭐⭐⭐⭐⭐
🏫 Schulen: "Grundschule 350m" ⭐⭐⭐⭐
👨‍⚕️ Gesundheit: "3 Ärzte in 500m" ⭐⭐⭐
🌳 Parks: "Stadtpark 600m" ⭐⭐⭐
🍽️ Gastronomie: "12 Restaurants" ⭐⭐⭐⭐
🔊 Lärm: "Ruhige Seitenstraße" ⭐⭐⭐⭐⭐
🏗️ Entwicklung: "Neues Zentrum 2027" ⭐⭐⭐⭐

Klick auf Kategorie:
Details Modal mit Liste aller POIs.

GATE:
- Score immer sichtbar
- Karte und Details nur Premium

Sage am Ende "Bereit für Schritt 41?"
```

---

### Schritt 41 von 70: Risk Analysis Screen
```
Schritt 41 von 70: Risiko-Analyse.

RiskAnalysisScreen:

Header:
- Overall Risk Badge:
  🟢 NIEDRIG / 🟡 MITTEL / 🔴 HOCH
- Kurze Zusammenfassung

Risk Cards:

Card 1: 📅 Baujahr-Risiko
- Baujahr: 1975
- Kalkuliere: €35-50k Sanierung/10 Jahre
- Aufschlüsselung:
  - Heizung: €8k
  - Fenster: €12k
  - Dach: €15k

Card 2: ⚡ Energieeffizienz
- Klasse: F
- Heizkosten: ~€200/Monat
- Warnung: Modernisierungspflicht 2030
- Kosten Sanierung: ~€25k

Card 3: 🔨 Sanierungsbedarf
- Aus Beschreibung erkannt
- Estimated: €30-60k
- Was zu tun ist

Card 4: 🚗 Lage-Risiko
- Straßenlärm
- Umwelt
- Wiederverkaufswert

Card 5: ⚖️ Rechtliches
- Denkmalschutz Check
- Bebauungsplan
- Zukunftsprojekte

Jede Card:
- Expandable Details
- Icon oben
- Severity Bar

GATE FREE:
- Nur 1 Risiko sichtbar
- Rest ausgegraut mit Lock

Sage am Ende "Bereit für Schritt 42?"
```

---

### Schritt 42 von 70: Save/Portfolio System
```
Schritt 42 von 70: Portfolio-System implementieren.

useSaveAnalysis Hook:

FUNKTIONEN:
- save(status, notes): Speichert Analyse
- update(id, changes): Update Status/Notes
- delete(id): Löschen
- getAll(): Alle geladen
- getByStatus(status): Filter
- addNote(id, note): Notiz hinzufügen
- markAsViewed(id): Als besichtigt markieren

SavePropertyModal:

Wird geöffnet wenn User "Speichern" klickt.

Layout:
- Titel: "Zu Portfolio hinzufügen"
- Objekt-Info klein oben
- Kategorie wählen (Radio Buttons):
  ⭐ Favorit
  👀 Interessant
  ✅ Besichtigt
  ❌ Verworfen
- Notiz-Textfeld (Optional)
- Toggle: "Preisänderungs-Alarm"
- Buttons: [Abbrechen] [Speichern]

Nach Speichern:
- Toast: "In Portfolio gespeichert ⭐"
- Save-Button wechselt zu "Gespeichert"

WICHTIG:
- Portfolio ist Premium
- Free User sieht Save-Button aber öffnet Paywall

Sage am Ende "Bereit für Schritt 43?"
```

---

### Schritt 43 von 70: Portfolio Screen Mobile
```
Schritt 43 von 70: Portfolio Screen Mobile.

PortfolioScreen:

TOP:
- Titel: "Meine Analysen"
- Zähler: "12 Objekte gespeichert"

FILTER TAB BAR:
Alle · ⭐ Favoriten · 👀 Interessant
✅ Besichtigt · ❌ Verworfen

SEARCH BAR:
"Suche nach Adresse..."

SORT DROPDOWN:
Neueste · Preis · Preisänderung · Ampel

FLATLIST mit Analyse-Cards:

Jede Card:
- Preis-Verdict Badge klein
- Adresse (Playfair 18px)
- Preis groß (IBM Mono)
- Meta: Größe · Zimmer · Bauj.
- Status Emoji + Text
- Preisänderung wenn vorhanden:
  "📉 -€30.000 seit erster Analyse"
- Datum letzte Analyse
- Aktionen:
  → Ansehen (öffnet gespeicherte Analyse)
  → Aktualisieren (neue Analyse)

Swipe Actions:
- Swipe rechts: Status ändern
- Swipe links: Löschen (mit Bestätigung)

Pull-to-Refresh:
Aktualisiert alle Analysen im Hintergrund.

EMPTY STATE:
Illustration + "Deine erste Analyse startet hier"
"Analyse starten" Button

Sage am Ende "Bereit für Schritt 44?"
```

---

### Schritt 44 von 70: Gespeicherte Analyse öffnen
```
Schritt 44 von 70: SavedAnalysisScreen.

Wenn User auf Card in Portfolio klickt:

SavedAnalysisScreen:
- Lädt Analyse aus DB (KEIN API-Call!)
- Zeigt sofort (< 100ms)
- Verwendet gleiche Komponenten wie ResultScreen

TOP BAR spezifisch:
- ← Zurück
- Titel: "Gespeicherte Analyse"
- Aktionen:
  🔄 Aktualisieren
  ✏️ Notiz bearbeiten
  🗑️ Löschen

BANNER OBEN:
"Analysiert vor 5 Tagen"
"Preis hat sich seitdem um -€10.000 geändert"
Button: "Neu analysieren"

ALLES ANDERE identisch zum ResultScreen.

Wenn User "Aktualisieren" klickt:
- Loading State
- Neue full-analysis Edge Function aufrufen
- Analyse in DB updaten
- Toast: "Analyse aktualisiert"

Notes Section (nur bei gespeicherter Analyse):
"Deine Notizen"
Textarea mit User-Notiz
Save Button

Viewing Info (wenn status = 'viewed'):
- Besichtigungsdatum
- Rating 1-10
- Pros/Cons Listen

Sage am Ende "Bereit für Schritt 45?"
```

---

### Schritt 45 von 70: Vergleichs-Feature
```
Schritt 45 von 70: Objekte vergleichen (Premium).

ComparisonScreen (im Portfolio Stack):

STATE 1 — Auswahl:
"Wähle 2 Objekte zum Vergleich"
Liste aller Analysen mit Checkbox.
Max 2 auswählbar.
"Vergleich starten" Button.

STATE 2 — Vergleich anzeigen:

Side-by-Side Tabelle mit:
Kriterien × 2 Spalten (Objekt 1 & 2)

Zeilen:
- Adresse
- Preis
- Preis/m²
- Größe
- Zimmer
- Baujahr
- Energie
- Ampel-Farbe
- Rendite
- Lage-Score
- Nebenkosten
- Verhandlungspotenzial

Winner-Highlight:
Bessere Zahl in jeder Zeile Gold hervorgehoben.

Unten: KI-Empfehlung Card:
"🤖 Objekt 2 ist besser weil..."
Gold Border.

Save-Button: Vergleich speichern.

Sage am Ende "Bereit für Schritt 46?"
```

---

### Schritt 46 von 70: Alerts Screen Mobile
```
Schritt 46 von 70: Wunschalarm Mobile.

AlertsScreen (Alerts Tab):

FÜR FREE:
- Locked State Illustration
- "Wunschalarm ist Premium"
- Benefit: "Sei der Erste bei neuen Objekten"
- CTA "Premium aktivieren"

FÜR PREMIUM:
- Header: "Meine Alarme"
- Zähler: "3 von 5 Alarmen aktiv"

Aktive Alarme Liste:
Jede Card:
- Name/Titel
- Kriterien-Chips:
  "München · 3-Zi · <500k"
  "ImmoScout · Immowelt"
- Toggle On/Off
- Anzahl Treffer diesen Monat
- Aktionen: Bearbeiten · Löschen

FAB Button "+":
Neuer Alarm

Recent Matches Section:
"Gestern gefunden (2)"
Objekt-Cards mit "Analysieren" Button.

Sage am Ende "Bereit für Schritt 47?"
```

---

### Schritt 47 von 70: Create Alert Screen
```
Schritt 47 von 70: Neuen Alarm erstellen.

CreateAlertScreen (als Modal):

FORMULAR:

1. Name (Optional):
   Textfeld: "München Schwabing 3-Zi"

2. Location:
   - Stadt-Input mit Autocomplete
   - Radius-Slider (5/10/20/50 km)
   - Map-Preview des Suchbereichs

3. Preis:
   - Max Kaufpreis Slider
   - Range: €50k - €2M
   - Formatiert: "€500.000"

4. Zimmer:
   - Segmented Buttons: 1 · 2 · 3 · 4 · 5+
   - Mehrfachauswahl

5. Typ:
   - Wohnung / Haus / Beides (Toggle)

6. Portale:
   - Multi-Select alle 8 Portale
   - Checkboxen mit Portal-Logos
   - "Alle auswählen" Button

7. Benachrichtigung:
   - Sofort (Push)
   - Täglich (Batch)

Preview Card:
"Dieser Alarm sucht nach:
 3-4 Zi Wohnung in München (30km)
 bis €500.000
 auf ImmoScout + Immowelt"

Save Button.
Push Permission fragen (wenn erster Alarm).

Sage am Ende "Bereit für Schritt 48?"
```

---

### Schritt 48 von 70: Alert Edge Function
```
Schritt 48 von 70: Check Alerts Cron Job.

Erstelle backend/supabase/functions/check-alerts/:

CRON: Täglich 8:00 + 18:00 Uhr Europe/Berlin

LOGIK:

1. Lade alle aktiven Alarme:
   SELECT * FROM alerts WHERE active = true

2. Für jeden Alarm:
   - Baue Apify Search-Query aus Kriterien
   - Für jedes ausgewählte Portal:
     Suche auf Portal via Apify
   - Sammle alle Treffer

3. Filter gegen alerted_listings:
   - Wenn URL bereits in alerted_listings: skip
   - Sonst: neue Treffer

4. Für jeden neuen Treffer:
   a) INSERT in alerted_listings:
      { alert_id, listing_url, alerted_at }
   
   b) Push Notification senden:
      Titel: "🏠 Neue Wohnung gefunden!"
      Body: "3 Zi · 78m² · €489.000 München"
      Data: { alert_id, listing_url }
   
   c) Wenn User "daily" gewählt hat:
      Batch für E-Mail-Digest

5. E-Mail Digest (wenn daily):
   Am Ende alle Treffer als 1 E-Mail via Resend.

6. Log in sync_logs.

Push via Expo Push Service:
POST https://exp.host/--/api/v2/push/send

Sage am Ende "Bereit für Schritt 49?"
```

---

### Schritt 49 von 70: Push Notifications
```
Schritt 49 von 70: Push Notifications einrichten.

Nutze expo-notifications.

SETUP:

1. app.json konfigurieren:
   - iOS: apns permissions
   - Android: fcm setup

2. Permission fragen bei erstem Alert:
   Notifications.requestPermissionsAsync()

3. Expo Push Token holen:
   Notifications.getExpoPushTokenAsync()

4. Token in profiles.push_token speichern.

useNotifications Hook:
- requestPermission()
- registerToken()
- listenToNotifications()
- handleNotificationTap()

NOTIFICATION HANDLING:

Foreground:
- In-App Toast

Background:
- Native OS Notification

Bei Tap:
- Deep Link zu Screen

Notification Types:
1. Alert Match → Öffnet AnalyzeScreen mit URL
2. Price Drop → Öffnet SavedAnalysisScreen
3. Trial Ending → Öffnet Paywall

Sage am Ende "Bereit für Schritt 50?"
```

---

### Schritt 50 von 70: Profile Screen
```
Schritt 50 von 70: Profil + Settings.

ProfileScreen:

TOP:
- Avatar (User Initial in Gold Circle)
- E-Mail Adresse
- User Type Badge

ABO STATUS CARD (groß):

FÜR FREE:
- Neutral Grau
- "FREE Plan"
- "2 von 3 Analysen diesen Monat"
- Progress Bar
- "Premium aktivieren" Button (Gold)

FÜR PREMIUM:
- Gold-Glow
- "PREMIUM aktiv" Badge
- "Verlängert am 15. März 2026"
- "Abo verwalten" Link
- Trial-Status wenn zutreffend

STATS CARD:
- "Deine Analysen"
- Zahl gesamt
- Gespeicherte im Portfolio
- Aktive Alarme

EINSTELLUNGEN LISTE:
- 🔔 Benachrichtigungen
- 🌍 Bevorzugte Portale
- 📍 Standard-Suchregion
- 💰 Währung (€ / CHF)
- 🌐 Sprache (DE / EN)
- 🎨 Design (Dark)

RECHTLICHES:
- Datenschutzerklärung
- AGB
- Impressum
- Haftungsausschluss

KONTAKT:
- Support kontaktieren
- Bug melden
- Feature vorschlagen

BOTTOM:
- "Ausloggen" (rot, ghost)
- App-Version

Sage am Ende "Bereit für Schritt 51?"
```

---

### Schritt 51 von 70: RevenueCat Setup
```
Schritt 51 von 70: In-App Purchases.

Installiere react-native-purchases.

SETUP (Schritt für Schritt erklären):

1. RevenueCat Account erstellen
2. App in RevenueCat anlegen (iOS + Android)
3. In-App Purchases erstellen:
   
   App Store Connect:
   - immotrue_premium_monthly (€4,99)
   - immotrue_premium_yearly (€34,99)
   Beide Auto-Renewable Subscriptions.
   
   Google Play Console:
   - Gleiche IDs

4. RevenueCat mit beiden Stores verbinden.

5. Entitlement "premium" konfigurieren.

6. SDK in App.tsx initialisieren.

Erstelle src/lib/revenuecat.ts:

FUNKTIONEN:
- initialize(userId): SDK Setup
- getPackages(): Preise holen
- purchasePackage(pkg): Kauf durchführen
- checkPremiumStatus(): boolean
- restorePurchases(): Für iOS Pflicht
- syncWithSupabase(): profiles.is_premium updaten

usePremium Hook:
- isPremium(): boolean
- monthlyPrice(): string
- yearlyPrice(): string
- daysLeftInTrial(): number
- purchase(pkg): Promise
- restore(): Promise

Free Limits Logic:
- getRemainingAnalyses(): number
- canStartAnalysis(): boolean
- resetMonthlyIfNeeded()

Sage am Ende "Bereit für Schritt 52?"
```

---

### Schritt 52 von 70: Paywall Screen
```
Schritt 52 von 70: High-Converting Paywall.

PaywallScreen (Modal, von überall öffenbar):

Header dynamisch je nach Trigger:
- limit_reached: "Limit erreicht"
- ki_report: "KI-Vollbericht"
- portfolio: "Portfolio unbegrenzt"
- financing: "Finanzierungsrechner"
- pdf_export: "PDF für Bank"
- alerts: "Wunschalarm"
- price_alert: "Preisänderungs-Alarm"
- comparison: "Objekte vergleichen"

Design:

TOP:
- Close Button (dezent, rechts oben)

HERO:
- Icon animiert (Sparkle-Effekt)
- Große Headline Playfair
- Kurze Erklärung Inter

SOCIAL PROOF:
"⭐⭐⭐⭐⭐ 4,8"
"10.000+ Analysen"

BENEFITS LIST (mit Gold Checkmarks, stagger-in):
★ Unbegrenzte Analysen
★ KI-Vollbericht auf Deutsch
★ Portfolio & Historie (unbegrenzt)
★ Preisänderungs-Alarm 
★ Finanzierungsrechner
★ 10-Jahres Prognose
★ Risiko-Analyse
★ PDF-Export
★ Objekte vergleichen
★ Wunschalarm

PRICING CARD (elevated mit Gold-Border):
Jahresabo prominent:
"€34,99 / Jahr"
Klein: "= €2,92/Monat"
Green Badge: "2 Monate GRATIS"

Monatsabo klein:
"oder €4,99 / Monat"

TRUST:
"7 Tage kostenlos testen"

CTA BUTTON:
"Premium starten"
Gold Gradient, groß
Subtle Puls-Animation

BOTTOM LINKS:
- "Vielleicht später"
- "Käufe wiederherstellen"

GUARANTEE:
"Keine versteckten Kosten · Jederzeit kündbar"

Sage am Ende "Bereit für Schritt 53?"
```

---

### Schritt 53 von 70: Premium Gates & Limits
```
Schritt 53 von 70: Alle Gates implementieren.

usePremium Hook nutzen um alle Features zu gaten.

Free Limits:
- 3 Analysen pro Monat
- Analysen 24h zugänglich (dann wieder analysieren)
- Kein Portfolio
- Kein KI-Vollbericht
- Kein Finanzierungsrechner (nur Vorschau)
- Kein PDF-Export
- Kein Vergleich
- Kein Wunschalarm
- Kein Preisalarm
- Nur 1 Risiko sichtbar
- Karte statisch (keine Details)

Premium:
- Alles unbegrenzt

GATES in Screens:

HomeScreen "Analysieren":
Wenn !canStartAnalysis:
→ Paywall trigger="limit_reached"

ResultScreen KI-Bericht:
Wenn !isPremium:
→ Blur + CTA für Paywall trigger="ki_report"

ResultScreen "Speichern":
Wenn !isPremium:
→ Paywall trigger="portfolio"

FinancingCalculator:
Wenn !isPremium:
→ Alles ausgegraut + CTA

Alerts Tab:
Wenn !isPremium:
→ Locked State

Portfolio Tab:
Wenn !isPremium:
→ Locked State

Optimistic UI:
Nach Analyse-Start sofort Counter erhöhen.
Wenn Backend fehlschlägt, zurücksetzen.

Sage am Ende "Bereit für Schritt 54?"
```

---

### Schritt 54 von 70: Limit Banner
```
Schritt 54 von 70: Free Limit Banner.

Erstelle src/components/home/LimitBanner.tsx:

Auf HomeScreen zeigen wenn User Free.

Zustand 1: 0-1 Analysen verbraucht:
- Grüner Banner
- "3 Analysen diesen Monat verfügbar"
- Klein: "Premium für unbegrenzt"

Zustand 2: 2 Analysen verbraucht:
- Amber Banner
- "1 Analyse verbleibend"
- Prominent: "Premium holen" Button

Zustand 3: 3 verbraucht (Limit erreicht):
- Roter Banner
- "Limit erreicht — Reset in X Tagen"
- Groß: "Premium jetzt aktivieren" Button

Zustand 4: Premium:
- Banner ausblenden

Animation:
- Banner slide-in bei State-Change
- Progress Bar animiert

Sage am Ende "Bereit für Schritt 55?"
```

---

### Schritt 55 von 70: PDF Export
```
Schritt 55 von 70: PDF Export implementieren.

Nutze expo-print.

Erstelle src/utils/pdfGenerator.ts:

FUNKTION: generatePDF(analysis: SavedAnalysis)

HTML Template mit ImmoTrue Branding:

- Header: Logo + Datum
- Objekt-Info Box
- Preis-Verdict groß
- Zahlen Tabelle
- KI-Vollbericht
- Finanzierungsrechner Ergebnis
- Kaufnebenkosten Tabelle
- Lage-Score + Details
- Risiko-Analyse
- Verhandlungsempfehlung
- Prognose
- Disclaimer:
  "Diese Analyse dient nur zur Orientierung
   und ersetzt keine professionelle Beratung."

CSS eingebettet:
- Dark Theme mit Gold-Akzenten
- Playfair für Headings
- Inter für Body
- Print-optimiert

Nach PDF-Erstellung:
- expo-sharing öffnet Share-Sheet
- Optionen: Speichern, Mail, Drucken

GATE: Nur Premium.

Sage am Ende "Bereit für Schritt 56?"
```

---

## PHASE 4 — ADMIN DASHBOARD (Schritte 56–60)

### Schritt 56 von 70: Admin Setup
```
Schritt 56 von 70: Admin Dashboard aufsetzen.

Erstelle im Ordner admin/:
Astro.js Setup (wie web/).

profiles Tabelle erweitern:
ALTER TABLE profiles
ADD COLUMN is_admin BOOLEAN DEFAULT false;

Mich als Admin markieren:
UPDATE profiles
SET is_admin = true
WHERE email = 'deine@email.de';

Auth Middleware:
src/middleware.ts:
- Prüft Auth + is_admin
- Sonst Redirect zu /login

Layout src/layouts/Admin.astro:
- Sidebar Navigation:
  📊 Dashboard
  👥 Users
  📈 Analytics
  💬 Feedback
  📝 Blog
  ⚙️ Settings
- Top Bar: Logo + User + Logout

Sage am Ende "Bereit für Schritt 57?"
```

---

### Schritt 57 von 70: Admin Dashboard Home
```
Schritt 57 von 70: Admin Dashboard Übersicht.

src/pages/index.astro:

STATS CARDS (4 oben):
1. Total Users: 1.247
2. Premium Users: 89 (7,1% Conversion)
3. Analysen heute: 156
4. MRR: €4.235

CHARTS:
- Line Chart: Analysen pro Tag (30 Tage)
- Bar Chart: Premium Purchases pro Tag
- Pie Chart: Portal-Nutzung

RECENT ACTIVITY:
Live Feed der letzten Events:
- "Neuer User: max@..."
- "Premium gekauft: user_xxx"
- "Analyse: München-Schwabing"

TOP CITIES:
Liste der meist-analysierten Städte.

QUICK ACTIONS:
- Newsletter senden
- Blog Post erstellen
- Feature Flag ändern

Sage am Ende "Bereit für Schritt 58?"
```

---

### Schritt 58 von 70: Admin User Management
```
Schritt 58 von 70: User Management.

src/pages/users.astro:

Tabelle mit allen Usern:
- Suche
- Filter (Free/Premium/Inaktiv)
- Sortierung

Spalten:
- Email
- User Type
- Registriert am
- Letzter Login
- Analysen gesamt
- Premium Status
- MRR
- Aktionen

Klick auf User → Detail Page:
src/pages/users/[id].astro
- Profil-Info
- Aktivitäts-Log
- Alle Analysen (Liste)
- Alle Alerts
- Payment History
- Aktionen:
  - Premium manuell aktivieren
  - Refund
  - User löschen (DSGVO)
  - Als User einloggen (Impersonation)

Sage am Ende "Bereit für Schritt 59?"
```

---

### Schritt 59 von 70: Admin Analytics
```
Schritt 59 von 70: Analytics Dashboard.

src/pages/analytics.astro:

FUNNELS:
1. Sign-up Funnel:
   Landing → Register → First Analysis
2. Premium Funnel:
   Analysis → Paywall → Purchase
3. Retention:
   D1, D7, D30 Cohorts

METRICS:
- MRR
- ARR
- Churn Rate
- ARPU (Avg Revenue Per User)
- LTV (Lifetime Value)
- CAC (falls Ads laufen)

FILTER:
- Zeitraum
- User Segment
- Platform

Data Sources:
- Supabase queries
- RevenueCat API
- PostHog (falls integriert)

Charts:
- Line: Zeitreihen
- Funnels: Conversion Steps
- Cohort Grid: Retention
- Bar Charts: Vergleiche

Sage am Ende "Bereit für Schritt 60?"
```

---

### Schritt 60 von 70: Blog Content Management
```
Schritt 60 von 70: Blog CMS.

src/pages/blog.astro:

Blog-Übersicht:
- Alle Artikel Tabelle
- Filter: Draft/Published
- Views/Reading Time
- Aktionen

src/pages/blog/new.astro:
- Markdown Editor
- Meta-Felder alle
- Featured Image Upload
- Preview Mode (Split View)

Bei Save:
- In content/blog/[slug].md speichern
- Astro Content Collection updated

Bei Publish:
- draft: false setzen
- Optional: In neuen Git-Branch pushen
- Auto-Deploy via Vercel

Alle Sektionen im Web-App und Landing.

Sage am Ende "Bereit für Schritt 61?"
```

---

## PHASE 5 — POLISH & LAUNCH (Schritte 61–70)

### Schritt 61 von 70: Analytics + Monitoring
```
Schritt 61 von 70: PostHog + Sentry.

POSTHOG (Product Analytics):
Beide Apps (Mobile + Web).

Events tracken:
- app_opened / page_viewed
- url_submitted (portal)
- analysis_started
- analysis_completed (verdict, portal)
- analysis_error (error_type)
- paywall_shown (trigger)
- premium_purchased (product)
- alert_created
- comparison_created
- pdf_exported
- portfolio_save

Funnels konfigurieren:
- Sign-up Funnel
- Premium Funnel
- Retention

SENTRY (Error Monitoring):
Beide Apps.

Konfiguriere:
- Automatic Crash Reporting
- Performance Monitoring
- User Context (anonymous)
- Environment: dev/prod

Performance Alerts:
- Apify > 10s: Warning
- Claude > 15s: Warning
- Fehlerrate > 5%: Alert

Sage am Ende "Bereit für Schritt 62?"
```

---

### Schritt 62 von 70: Newsletter + Email
```
Schritt 62 von 70: Resend Emails.

RESEND SETUP:
1. Account erstellen
2. Domain verifizieren (SPF, DKIM)
3. API Key setzen

Transactional Emails:
- Welcome nach Register
- Premium Purchase Confirmation
- Alert Match (wenn User "daily" wählt)
- Password Reset
- Trial ending in 3 days

Newsletter:
- Signup Form auf Landing + Footer
- Newsletter_subscribers Tabelle
- Weekly Newsletter Template:
  - Neue Blog Posts
  - Marktupdate
  - Feature News

Email Templates:
- HTML + Plain Text
- Responsive
- ImmoTrue Branding (Gold + Dark)
- Klare CTAs

Erstelle backend/supabase/functions/send-email/

Sage am Ende "Bereit für Schritt 63?"
```

---

### Schritt 63 von 70: Legal Pages
```
Schritt 63 von 70: Rechtliche Seiten komplett.

WEB (Astro):
- /impressum
- /datenschutz
- /agb
- /haftung
- /cookies

MOBILE (React Native):
- src/screens/settings/LegalScreen.tsx
  Zeigt alle Legal Pages als Modal.

DATENSCHUTZ (DSGVO):
- Welche Daten sammeln wir
  (E-Mail, User Type, Analysen)
- Zwecke der Verarbeitung
- Rechtsgrundlage
- Auftragsverarbeiter:
  - Supabase (Backend)
  - Apify (Portal-Daten - temporär)
  - Anthropic (KI - ohne Speicherung)
  - RevenueCat (Payments)
  - PostHog (Analytics)
  - Resend (E-Mails)
  - Sentry (Errors)
- Speicherfristen
- Rechte der Betroffenen
- Cookies (minimal)

AGB:
- Geltungsbereich
- Vertragsschluss
- Leistungsbeschreibung
- Preise + Zahlung
- Widerrufsrecht (14 Tage)
- Kündigung
- Haftung
- Anwendbares Recht

IMPRESSUM:
- Firmenname
- Adresse
- Kontakt
- USt-ID
- Verantwortlicher

HAFTUNGSAUSSCHLUSS:
"ImmoTrue dient nur zur Orientierung.
Ersetzt keine professionelle Beratung.
Keine Garantie auf Aktualität oder Genauigkeit.
Kaufentscheidungen liegen beim Nutzer."

Sage am Ende "Bereit für Schritt 64?"
```

---

### Schritt 64 von 70: App Icons + Assets
```
Schritt 64 von 70: App Icons + Splash Screens.

KONZEPT ImmoTrue Icon:
- Background: #0A0C0B (dunkel)
- Symbol: Goldenes Haus mit stilisiertem Häkchen ✓
  (steht für "wahr", "geprüft")
- Minimalistisch, memorable

MOBILE ASSETS:
- iOS Icon: 1024×1024px
- Android Adaptive:
  - Foreground: 108×108
  - Background: 108×108
- Splash Screen: 1242×2688px

Konfiguriere app.json:
{
  "expo": {
    "name": "ImmoTrue",
    "slug": "immotrue",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#0A0C0B"
    }
  }
}

WEB ASSETS:
- Favicon Set (multiple sizes)
- OG Image (1200×630)
- Apple Touch Icon (180×180)

Erstelle Midjourney Prompt für Icon:
"Minimalist mobile app icon, luxury real estate,
gold house silhouette with checkmark inside on
deep black background #0A0C0B, premium feel,
iconic, memorable, one clear symbol"

Nutze auch web-asset-generator Skill wenn verfügbar.

Sage am Ende "Bereit für Schritt 65?"
```

---

### Schritt 65 von 70: EAS Build Config
```
Schritt 65 von 70: EAS Build für Mobile.

Konfiguriere eas.json:

3 Profiles:

development:
- Für lokale Entwicklung mit Expo Go
- distribution: internal
- ios.simulator: true

preview:
- Für Beta-Tester
- distribution: internal
- TestFlight für iOS
- Internal Testing für Android

production:
- Für Store-Release
- distribution: store
- Auto-Increment build numbers

SETUP STEPS:

1. eas login
2. eas init (verknüpft Projekt)
3. iOS Credentials:
   eas credentials --platform ios
   → Certificates, Provisioning Profile
4. Android Keystore:
   eas credentials --platform android
   → Neuen Keystore generieren
   
WICHTIG: Keystore sicher speichern!
Ohne Keystore keine App-Updates möglich.

Erste Preview Builds:
eas build --platform ios --profile preview
eas build --platform android --profile preview

Erkläre:
- Code Signing?
- TestFlight?
- iOS Certificates vs Provisioning Profiles?
- Android Keystore Wichtigkeit?

Sage am Ende "Bereit für Schritt 66?"
```

---

### Schritt 66 von 70: App Store Submission
```
Schritt 66 von 70: iOS + Android einreichen.

APPLE APP STORE:

App Store Connect:
1. App erstellen
2. Bundle ID: com.deinunternehmen.immotrue
3. Kategorie: Finanzen
4. Age Rating: 4+

Metadaten:
- App Name: "ImmoTrue - Immobilien Analyse"
- Untertitel: "KI-Analyse für jedes Inserat"
- Description (4000 Zeichen)
- Keywords (100 Zeichen):
  Immobilien,Analyse,Wohnung,Kaufen,
  KI,Bewertung,ImmoScout,Rendite,Preis,DACH
- Support URL: immotrue.de/support
- Privacy Policy URL: immotrue.de/datenschutz
- Marketing URL: immotrue.de

Screenshots:
- 6,7" iPhone: 5 Stück
- 5,5" iPhone: 5 Stück
- Alle mit deutscher UI + Beispiel-Daten

Privacy Nutrition Labels:
- Datenerfassung: E-Mail (Auth)
- Zweck: App-Funktionalität
- Nicht getrackt
- Nicht mit Third-Party geteilt

In-App Purchases:
- Beide Products konfiguriert
- Screenshots für IAP

App Review Info:
- Demo Account
- Notes für Reviewer:
  "Portal-Daten werden nur temporär
   verarbeitet, nicht gespeichert."

Build:
eas build --platform ios --profile production
eas submit --platform ios

GOOGLE PLAY:

Play Console:
- Store Listing komplett
- Content Rating
- Data Safety
- Preise + Distribution
- Internal Testing → Production

Build:
eas build --platform android --profile production
eas submit --platform android

Sage am Ende "Bereit für Schritt 67?"
```

---

### Schritt 67 von 70: Web Deployment
```
Schritt 67 von 70: Web + Admin deployen.

VERCEL SETUP:

Für web/:
1. Vercel Account
2. GitHub Repo verbinden
3. Auto-Deploy bei Push
4. Environment Variables:
   - PUBLIC_SUPABASE_URL
   - PUBLIC_SUPABASE_ANON_KEY
   - APIFY_TOKEN (nur für Edge Function)
   - ANTHROPIC_API_KEY (nur für Edge Function)
   - RESEND_API_KEY
   - POSTHOG_KEY

Custom Domain:
- immotrue.de (bei INWX/GoDaddy)
- DNS in Vercel eintragen
- SSL automatisch

Für admin/:
Separate Deployment:
- admin.immotrue.de (Subdomain)
- IP-Whitelist optional
- Extra Auth-Layer

Preview Deployments:
Bei jedem PR: eigene URL.

Monitoring:
- Vercel Analytics
- Uptime Robot
- Sentry für Web

Performance-Ziele:
- Lighthouse 95+
- Time to Interactive < 3s
- Contentful Paint < 1s

Sage am Ende "Bereit für Schritt 68?"
```

---

### Schritt 68 von 70: Post-Launch Monitoring
```
Schritt 68 von 70: Launch-Monitoring Setup.

DASHBOARD im Admin einrichten:
"Launch Metrics" Seite

Live Numbers:
- Downloads (iOS + Android)
- Web Visitors
- Registrations
- Analyses per Hour
- Premium Purchases
- MRR
- Crash Rate

CRITICAL ALERTS:
- Sentry: Neue Crashes → Slack
- Uptime Robot: Downtime → E-Mail + SMS
- Supabase: Rate Limits → E-Mail
- Apify: Fehlerrate > 10% → E-Mail
- Claude API: Response Time > 15s → E-Mail

DAILY REPORT via E-Mail:
Jeden Morgen 8:00 Uhr:
- Users neu (24h)
- Analysen (24h)
- Umsatz (24h)
- Vergleich zum Vortag
- Top Feedback

FIRST WEEK CHECKS:
- Täglich Sentry prüfen
- Täglich User-Feedback lesen
- Täglich App Store Reviews
- Alle 2h in erster Woche: Live-Metriken

Sage am Ende "Bereit für Schritt 69?"
```

---

### Schritt 69 von 70: Marketing Launch
```
Schritt 69 von 70: Marketing-Plan Woche 1.

SOFT LAUNCH (Tag 1-3):

Personal Network:
- LinkedIn Post persönlich
- Facebook Freunde
- WhatsApp Status
- Freunde testen lassen
- Feedback sammeln

Product Hunt:
- Launch Dienstag oder Mittwoch
- Hunter finden (falls möglich)
- Assets vorbereiten:
  - Gif der App Demo
  - Screenshots
  - 3-4 zeilen Beschreibung
- Community aktivieren

Reddit (Tag 3-5):
- r/Finanzen (deutsch)
- r/de (allgemein)
- r/immobilien
- Echte Diskussion, kein Spam
- Beitrag: "Ich habe eine KI Immobilien-App gebaut"
- Honest, personal Story

CONTENT PUSH (Tag 5-14):

Blog:
- Erster Article: "Wie ich ImmoTrue gebaut habe"
  Story-Telling, personal
- 2. Article: "Kaufpreisfaktor in München 2026"
  SEO-optimiert

TikTok/Instagram (kritisch für Reichweite):
Videos die viral gehen können:
- "So spare ich €30k beim Wohnungskauf"
- "3 versteckte Kosten die niemand kennt"
- "KI zeigt dir wenn Preise fair sind"
- Live Analyse-Demo

Format: 30-60 Sekunden.
Hook in 3 Sekunden.
Klarer CTA am Ende.

YouTube (langfristig):
- Tutorial-Videos
- "Immobilien für Anfänger" Serie

Sage am Ende "Bereit für Schritt 70 (der letzte)?"
```

---

### Schritt 70 von 70: Post-Launch Optimierung
```
Schritt 70 von 70: Wachstum + Optimierung.

WOCHE 1 REVIEW:
- Was hat funktioniert?
- Was nicht?
- User-Feedback analysieren
- Crash-Rate?

BUGFIX PRIORISIERUNG:
- Critical (Crashes): Sofort
- High (Feature broken): 24-48h
- Medium (UX Issues): 1 Woche
- Low (Nice-to-have): Backlog

OTA UPDATES für kleine Fixes:
eas update --branch production --message "v1.0.1"

WOCHE 2-4 FOKUS:

1. Conversion optimieren:
   - PostHog Funnels analysieren
   - Wo brechen User ab?
   - Paywall A/B testen

2. Retention verbessern:
   - Push Notifications testen
   - Onboarding optimieren
   - Erste Analyse magisch machen

3. Content-Marketing:
   - Weekly Blog Posts
   - SEO Keywords tracken
   - Backlinks aufbauen

MONAT 2+:

Skalierung:
- Was funktioniert am besten?
  → Da mehr Budget rein
- Was nicht?
  → Stoppen

Paid Ads (optional):
- Meta Ads (Facebook/Instagram)
- Google Ads (Search)
- Budget: Start mit €500/Monat
- Erst wenn organisch < 100 User/Woche

FEATURE ROADMAP v1.1:

Nächste 3 Monate:
- Mietmarkt-Analyse (für Vermieter)
- Widget für iPhone Home Screen
- Apple Maps Integration
- iPad Optimierung
- Mehr Portale (Immonet, ImmoWelt vollständig)
- Team-Accounts (für Immobilien-Investoren-Gruppen)

CELEBRATION:

🎉 HERZLICHEN GLÜCKWUNSCH!

Du hast in 14 Wochen aufgebaut:
- Mobile App auf iOS + Android
- Web App mit Landing + Analyse
- Admin Dashboard
- SEO-optimiertes Blog
- Backend mit KI
- Push Notifications
- Portfolio-System
- Preisänderungs-Alarm
- Premium Business Model

Ready to earn. Ready to scale.

"Wahrheit über jedes Inserat."

Bereit die Welt der Immobilien-Analyse
zu verändern? Jetzt loslegen! 🚀
```

---

## 📝 SPICKZETTEL FÜR CLAUDE CODE

### Fehler beheben:
```
Fehler: [FEHLER TEXT]
Passiert bei: [WAS ICH GETAN HABE]
Erkläre warum und behebe Schritt für Schritt.
```

### Nicht verstanden:
```
Erkläre [KONZEPT] als wäre ich Webentwickler
der React Native nicht kennt.
Vergleiche mit HTML/CSS/JavaScript.
```

### Code reviewen:
```
Schau dir [DATEI] an.
Bugs? Performance? Bessere Alternativen?
```

### Feature hinzufügen:
```
Ich möchte [FEATURE] zu [DATEI] hinzufügen.
Erkläre deinen Plan, dann setze um.
```

---

## 🎯 KRITISCHE ERFOLGSFAKTOREN

1. **Portfolio ist der Retention-Motor**
   User bleibt Premium weil er seine Analysen behalten will.

2. **Preisänderungs-Alarm ist einzigartig**
   Kein Konkurrent bietet das. Push-Notification bei Preisreduktion = App wird täglich geöffnet.

3. **ohne-makler.net Support ist der USP**
   Kein anderes Tool vergleicht Makler vs. Privatverkauf-Preise.

4. **KI-Vollbericht muss großartig sein**
   Der Hauptgrund für Premium. Muss besser sein als jede menschliche Analyse.

5. **Alle 8 Portale müssen zuverlässig funktionieren**
   Ein kaputtes Portal = viele Beschwerden.

---

## 💰 EINNAHMEN-PROJEKTION

| Zeit | Premium-User | Netto/Monat |
|---|---|---|
| Monat 1 | 100 | ~€400 |
| Monat 3 | 500 | ~€2.070 |
| Monat 6 | 1.500 | ~€6.870 |
| Monat 12 | 5.000 | ~€20.800 |

---

*ImmoTrue — Kompletter Master-Plan v4.0*
*Mobile + Web + Admin | 70 Schritte | 14 Wochen*
*"Wahrheit über jedes Inserat."*
