# Velyric – weboldal

MI hangügynökök modern vállalkozásoknak. Next.js 16 + Tailwind v4 + next-intl (HU/EN/DE) + Supabase auth + react-three-fiber.

## Indítás

```bash
npm install
cp .env.local.example .env.local   # töltsd ki (lásd lent)
npm run dev                         # http://localhost:3000
```

## Supabase beállítása (egyszer kell)

1. **Projekt:** [supabase.com](https://supabase.com) → New project (régió: Frankfurt / `eu-central-1`).
2. **Kulcsok:** Project Settings → API → másold a `.env.local`-ba:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` `public` kulcs
   - Ugyanezt a kettőt add meg a **Vercelen** is: Project → Settings → Environment Variables, majd Redeploy.
3. **URL-ek:** Authentication → URL Configuration
   - Site URL: `https://velyric.com` (amíg nincs domain: a `…vercel.app` cím)
   - Redirect URLs (mind a hármat add hozzá):
     - `http://localhost:3000/**`
     - `https://*.vercel.app/**`
     - `https://velyric.com/**`
4. **E-mail + jelszó:** Authentication → Sign In / Providers → Email
   - „Confirm email” legyen **bekapcsolva** (megerősítés nélkül nem lehet belépni)
   - Minimum password length: **8**
5. **Linkek lejárata:** Authentication → Email (vagy Auth settings) → Email OTP Expiration: **3600** mp (1 óra).
6. **E-mail sablonok (ajánlott – így másik eszközön megnyitva is működik a link):** Authentication → Emails → Templates
   - *Confirm signup*: a link legyen `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
   - *Reset password*: a link legyen `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`
   - (A szövegeket érdemes magyarra írni.)
7. **Google-belépés:**
   - [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create credentials → OAuth client ID → *Web application*
   - Authorized redirect URI: `https://<projekt-azonosító>.supabase.co/auth/v1/callback` (a Supabase Google provider oldalán ki van írva)
   - A Client ID-t és a Client Secretet másold be: Supabase → Authentication → Providers → Google → Enable.
   - Az OAuth consent screenen add meg az app nevét (Velyric), a logót és a domaint.
8. **Rate limit / védelem:** Authentication → Rate Limits – az alapértékek jók. Ha sok a robot-regisztráció, kapcsold be az Attack Protection → CAPTCHA-t.

## Beállítás bejelentkezés után (`/beallitas`)

Bejelentkezés után a felhasználó egy 6 lépéses, MI-vezérelt beállításon megy végig:
1. **Vállalkozás** – pár mondat a cégről → a Claude profilt, javasolt feladatokat és köszönést készít
2. **Feladatok** – igen/nem kapcsolók, mikor vegye fel, nyelvek, átkapcsolási szám
3. **Hang** – 4 hang meghallgatható mintával, ki szól először, magázás/tegezés, köszönés és köszönő üzenet
4. **Tudás** – fájlfeltöltés (Supabase Storage) vagy „később küldöm”, nyitvatartás
5. **Számlázás** – cég/magánszemély, adószám élő ellenőrzéssel, cím
6. **Indítás** – Stripe fizetőoldal (kártya, Apple Pay, Google Pay) → **Kész** oldal példahívással

Beüzemelés:
- **Adatbázis:** Supabase → SQL Editor → futtasd a `supabase/migrations/20260928000000_onboarding.sql` fájlt.
- **Kulcsok:** lásd `.env.local.example` (Anthropic, ElevenLabs, Stripe, Supabase service role).
- **Stripe:** hozz létre egy terméket árral (a `price_…` azonosító a `STRIPE_PRICE_ID`), és egy webhookot a `/api/billing/webhook` címre.
- Ami nincs beállítva, az bemutató módban fut: MI helyett sablonok, természetes hang helyett a böngésző hangja, fizetés helyett „Folytatás fizetés nélkül”.

## Kezelő (`kezelo.velyric.com`)

A beállítás után a felhasználó a saját kezelőjébe kerül, ahol külön be kell jelentkeznie (kétlépcsős azonosítással, ha bekapcsolta).
- **Első belépés – Stúdió:** stílus (Modern / Klasszikus / Minimál), sötét/világos mód, 6 szín, a főoldal dobozai, adatfeldolgozási hozzájárulás, adatmegőrzés.
- **Bemutató túra:** elhomályosított háttér, kiemelt elem, nyíl + buborék; Tovább / Vissza / Átugrás.
- **Főoldal:** élő hívások, kulcsszámok, fennálló ügyek/teendők (az MI szedi ki a hívásokból), foglalások, legutóbbi hívások, heti grafikon, témák.
- **A vállalkozás jellege szerint:** időpontok (rendelő, szalon, szerviz) · asztalfoglalás (étterem) · ügyek megoldva/nincs megoldva (pl. tech cég).
- **Súgó:** gyakori elakadások lépésekkel, „Mutasd meg” kiemeléssel, és „Írj nekünk” e-mail.
- **Beállítások:** megjelenés, értesítések, 2FA, automatikus kijelentkezés, jelszócsere, biztonsági napló, adatmegőrzés, adatexport, fióktörlés, számlák (Stripe portál).

Beüzemelés:
1. Supabase → SQL Editor → futtasd a `supabase/migrations/20260929000000_dashboard.sql` fájlt (az onboarding migráció után).
2. Supabase → Authentication → **Multi-Factor** → TOTP bekapcsolása; URL Configuration → Redirect URLs: `https://kezelo.velyric.com/**`.
3. Supabase → Database → Cron: naponta `select public.purge_expired_call_data();` (adatmegőrzés).
4. Vercel → Domains: `kezelo.velyric.com` hozzáadása ugyanehhez a projekthez, és `NEXT_PUBLIC_DASHBOARD_URL=https://kezelo.velyric.com`.
5. Hangplatform → webhook: `POST https://velyric.com/api/voice/events`, fejlécek: `x-velyric-timestamp` (unix mp) és `x-velyric-signature` = hex(HMAC-SHA256(`<timestamp>.<nyers törzs>`, `VOICE_WEBHOOK_SECRET`)). Események: `call.started` és `call.ended` (átirattal; `account_id` = a Velyric-felhasználó azonosítója).

## Útvonalak

| Oldal | HU | EN | DE |
|---|---|---|---|
| Főoldal | `/` | `/en` | `/de` |
| Bejelentkezés | `/bejelentkezes` | `/en/login` | `/de/anmelden` |
| Regisztráció | `/regisztracio` | `/en/signup` | `/de/registrieren` |
| Megerősítés | `/auth/megerosites` | `/en/auth/confirmed` | `/de/auth/bestaetigt` |
| Új jelszó | `/auth/uj-jelszo` | `/en/auth/new-password` | `/de/auth/neues-passwort` |
| Beállítás | `/beallitas` | `/en/setup` | `/de/einrichtung` |

A Supabase-linkek a `/auth/confirm` visszahívásra érkeznek, az irányít tovább.

## Képek

A fotók az [Unsplash](https://unsplash.com)-ről származnak (Unsplash License – ingyenes, kereskedelmi célra is): Adam Winger, Kari Bjorn Photography, Vitaly Gariev, Zoshua Colah.
