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

## Útvonalak

| Oldal | HU | EN | DE |
|---|---|---|---|
| Főoldal | `/` | `/en` | `/de` |
| Bejelentkezés | `/bejelentkezes` | `/en/login` | `/de/anmelden` |
| Regisztráció | `/regisztracio` | `/en/signup` | `/de/registrieren` |
| Megerősítés | `/auth/megerosites` | `/en/auth/confirmed` | `/de/auth/bestaetigt` |
| Új jelszó | `/auth/uj-jelszo` | `/en/auth/new-password` | `/de/auth/neues-passwort` |

A Supabase-linkek a `/auth/confirm` visszahívásra érkeznek, az irányít tovább.

## Képek

A fotók az [Unsplash](https://unsplash.com)-ről származnak (Unsplash License – ingyenes, kereskedelmi célra is): Adam Winger, Kari Bjorn Photography, Vitaly Gariev, Zoshua Colah.
