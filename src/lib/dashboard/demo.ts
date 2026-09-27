import type { OnboardingData } from "@/lib/onboarding/schema";
import type { Booking, BusinessKind, Call, Issue } from "./schema";

// BEMUTATÓ ADATOK – amíg nincs valódi hívás (vagy bemutató módban), így látszik, milyen lesz a kezelő.
// A felület mindig egyértelműen „Mintaadat” címkével jelzi.

type Loc = "hu" | "en" | "de";
type Pack = {
  calls: { summary: string; category: string; outcome: Call["outcome"]; name: string }[];
  live: { name: string; turns: [string, string, string] };
  issues: { title: string; detail: string; category: string; priority: Issue["priority"]; resolved?: boolean }[];
  services: string[];
};

const CONTENT: Record<BusinessKind, Record<Loc, Pack>> = {
  appointments: {
    hu: {
      calls: [
        { summary: "Új időpontot kért csütörtökre, lefoglalva 10:00-ra.", category: "Időpontfoglalás", outcome: "booked", name: "Kiss Anna" },
        { summary: "Áthelyezte a keddi időpontját péntekre.", category: "Átfoglalás", outcome: "booked", name: "Tóth Gábor" },
        { summary: "Az árakról érdeklődött, visszahívást kért.", category: "Árak", outcome: "callback", name: "Szabó Eszter" },
        { summary: "Nyitvatartást kérdezte, megkapta a választ.", category: "Nyitvatartás", outcome: "resolved", name: "Nagy Péter" },
      ],
      live: { name: "Horváth Réka", turns: ["Jó napot, a jövő hétre szeretnék időpontot.", "Szívesen. Kedden 9:00-kor vagy szerdán 14:30-kor van szabad hely.", "A szerda jó lesz."] },
      issues: [
        { title: "Visszahívás: árajánlat kérése", detail: "Szabó Eszter a kezelés pontos áráról kérdezett.", category: "Árak", priority: "normal" },
        { title: "Biztosítással kapcsolatos kérdés", detail: "A hívó tudni szeretné, fizeti-e a biztosítója.", category: "Egyéb", priority: "high" },
        { title: "Lemondott időpont – várólistát értesíteni", detail: "Péntek 11:00 felszabadult.", category: "Átfoglalás", priority: "low", resolved: true },
        { title: "Parkolási információ hiányzik", detail: "Két hívó is kérdezte, hol lehet parkolni.", category: "Tudásbázis", priority: "normal" },
      ],
      services: ["Konzultáció", "Kontroll", "Kezelés"],
    },
    en: {
      calls: [
        { summary: "Asked for a new appointment on Thursday, booked for 10:00.", category: "Booking", outcome: "booked", name: "Anna Kiss" },
        { summary: "Moved Tuesday's appointment to Friday.", category: "Rescheduling", outcome: "booked", name: "Gábor Tóth" },
        { summary: "Asked about prices, requested a callback.", category: "Prices", outcome: "callback", name: "Eszter Szabó" },
        { summary: "Asked for opening hours and got the answer.", category: "Opening hours", outcome: "resolved", name: "Péter Nagy" },
      ],
      live: { name: "Réka Horváth", turns: ["Hello, I'd like an appointment next week.", "Happy to help. Tuesday at 9:00 or Wednesday at 14:30 are free.", "Wednesday works."] },
      issues: [
        { title: "Callback: price quote", detail: "Eszter Szabó asked about the exact treatment price.", category: "Prices", priority: "normal" },
        { title: "Insurance question", detail: "The caller wants to know if insurance covers it.", category: "Other", priority: "high" },
        { title: "Cancelled slot – notify waiting list", detail: "Friday 11:00 is free again.", category: "Rescheduling", priority: "low", resolved: true },
        { title: "Parking information missing", detail: "Two callers asked where to park.", category: "Knowledge", priority: "normal" },
      ],
      services: ["Consultation", "Check-up", "Treatment"],
    },
    de: {
      calls: [
        { summary: "Neuen Termin für Donnerstag angefragt, für 10:00 gebucht.", category: "Terminbuchung", outcome: "booked", name: "Anna Kiss" },
        { summary: "Den Dienstagstermin auf Freitag verschoben.", category: "Umbuchung", outcome: "booked", name: "Gábor Tóth" },
        { summary: "Nach Preisen gefragt, Rückruf gewünscht.", category: "Preise", outcome: "callback", name: "Eszter Szabó" },
        { summary: "Nach Öffnungszeiten gefragt und Antwort erhalten.", category: "Öffnungszeiten", outcome: "resolved", name: "Péter Nagy" },
      ],
      live: { name: "Réka Horváth", turns: ["Guten Tag, ich hätte gern einen Termin nächste Woche.", "Gern. Dienstag 9:00 oder Mittwoch 14:30 ist frei.", "Mittwoch passt."] },
      issues: [
        { title: "Rückruf: Preisangebot", detail: "Eszter Szabó fragte nach dem genauen Behandlungspreis.", category: "Preise", priority: "normal" },
        { title: "Frage zur Versicherung", detail: "Der Anrufer möchte wissen, ob die Versicherung zahlt.", category: "Sonstiges", priority: "high" },
        { title: "Abgesagter Termin – Warteliste informieren", detail: "Freitag 11:00 ist wieder frei.", category: "Umbuchung", priority: "low", resolved: true },
        { title: "Parkinfo fehlt", detail: "Zwei Anrufer fragten nach Parkplätzen.", category: "Wissen", priority: "normal" },
      ],
      services: ["Beratung", "Kontrolle", "Behandlung"],
    },
  },
  reservations: {
    hu: {
      calls: [
        { summary: "Asztalt foglalt szombat 19:00-ra, 4 főre.", category: "Asztalfoglalás", outcome: "booked", name: "Varga Dóra" },
        { summary: "Gluténmentes ételekről kérdezett.", category: "Étlap", outcome: "resolved", name: "Molnár Ádám" },
        { summary: "20 fős céges vacsorát szeretne, átkapcsolva.", category: "Rendezvény", outcome: "transferred", name: "Balogh Kft." },
        { summary: "Lemondta a pénteki foglalását.", category: "Lemondás", outcome: "resolved", name: "Fekete Zsófia" },
      ],
      live: { name: "Lakatos Bence", turns: ["Jó estét, ma estére lenne hely hat főre?", "Hétkor tele vagyunk, de 19:30-kor van egy hatfős asztal a teraszon.", "Az tökéletes."] },
      issues: [
        { title: "Céges vacsora ajánlat – 20 fő", detail: "Menüajánlatot és árat kér e-mailben.", category: "Rendezvény", priority: "high" },
        { title: "Allergénlista hiányzik a tudásból", detail: "Többen kérdeztek dióallergiáról.", category: "Tudásbázis", priority: "normal" },
        { title: "Elveszett tárgy – napszemüveg", detail: "A vendég a teraszon felejtette tegnap este.", category: "Egyéb", priority: "low", resolved: true },
        { title: "Visszahívás: születésnapi torta", detail: "Tortát rendelne szombatra.", category: "Rendelés", priority: "normal" },
      ],
      services: ["Terasz", "Belső terem", "Bárpult"],
    },
    en: {
      calls: [
        { summary: "Booked a table for Saturday 19:00 for 4.", category: "Table booking", outcome: "booked", name: "Dóra Varga" },
        { summary: "Asked about gluten-free dishes.", category: "Menu", outcome: "resolved", name: "Ádám Molnár" },
        { summary: "Wants a company dinner for 20, transferred.", category: "Event", outcome: "transferred", name: "Balogh Ltd." },
        { summary: "Cancelled their Friday booking.", category: "Cancellation", outcome: "resolved", name: "Zsófia Fekete" },
      ],
      live: { name: "Bence Lakatos", turns: ["Good evening, any table for six tonight?", "We're full at seven, but there's a table for six on the terrace at 19:30.", "Perfect."] },
      issues: [
        { title: "Company dinner offer – 20 guests", detail: "Wants a menu offer and price by email.", category: "Event", priority: "high" },
        { title: "Allergen list missing from knowledge", detail: "Several guests asked about nut allergies.", category: "Knowledge", priority: "normal" },
        { title: "Lost item – sunglasses", detail: "Left on the terrace last night.", category: "Other", priority: "low", resolved: true },
        { title: "Callback: birthday cake", detail: "Would like to order a cake for Saturday.", category: "Order", priority: "normal" },
      ],
      services: ["Terrace", "Dining room", "Bar"],
    },
    de: {
      calls: [
        { summary: "Tisch für Samstag 19:00 für 4 Personen reserviert.", category: "Tischreservierung", outcome: "booked", name: "Dóra Varga" },
        { summary: "Nach glutenfreien Gerichten gefragt.", category: "Speisekarte", outcome: "resolved", name: "Ádám Molnár" },
        { summary: "Firmenessen für 20 Personen, weitergeleitet.", category: "Veranstaltung", outcome: "transferred", name: "Balogh GmbH" },
        { summary: "Die Reservierung für Freitag storniert.", category: "Stornierung", outcome: "resolved", name: "Zsófia Fekete" },
      ],
      live: { name: "Bence Lakatos", turns: ["Guten Abend, haben Sie heute Abend Platz für sechs?", "Um sieben sind wir voll, aber um 19:30 ist ein Tisch für sechs auf der Terrasse frei.", "Perfekt."] },
      issues: [
        { title: "Angebot Firmenessen – 20 Personen", detail: "Möchte Menüangebot und Preis per E-Mail.", category: "Veranstaltung", priority: "high" },
        { title: "Allergenliste fehlt im Wissen", detail: "Mehrere Gäste fragten nach Nussallergien.", category: "Wissen", priority: "normal" },
        { title: "Fundsache – Sonnenbrille", detail: "Gestern Abend auf der Terrasse vergessen.", category: "Sonstiges", priority: "low", resolved: true },
        { title: "Rückruf: Geburtstagstorte", detail: "Möchte eine Torte für Samstag bestellen.", category: "Bestellung", priority: "normal" },
      ],
      services: ["Terrasse", "Speisesaal", "Bar"],
    },
  },
  cases: {
    hu: {
      calls: [
        { summary: "Nem tud belépni a fiókjába, jelszó-visszaállítást kapott.", category: "Belépés", outcome: "resolved", name: "Kovács Márk" },
        { summary: "Lassú a rendszer reggelente, hibajegy nyitva.", category: "Teljesítmény", outcome: "unresolved", name: "Pixel Kft." },
        { summary: "Számlamásolatot kért, e-mailben elküldve.", category: "Számlázás", outcome: "resolved", name: "Németh Júlia" },
        { summary: "Integráció beállításához technikust kér.", category: "Integráció", outcome: "transferred", name: "Alfa Zrt." },
      ],
      live: { name: "Papp Levente", turns: ["Jó napot, nem működik a nyomtatónk a hálózaton.", "Értem. Megnézzük együtt: a nyomtató kijelzőjén látszik hibaüzenet?", "Igen, azt írja: nincs kapcsolat."] },
      issues: [
        { title: "Lassú betöltés reggel 8–9 között", detail: "Több ügyfél jelezte, hibajegy a fejlesztőknek.", category: "Teljesítmény", priority: "high" },
        { title: "API-integráció beállítása", detail: "Az Alfa Zrt. technikust kér, visszahívás kedden.", category: "Integráció", priority: "normal" },
        { title: "Jelszó-visszaállító levél késik", detail: "A levél 10 perc után érkezett meg.", category: "Belépés", priority: "normal", resolved: true },
        { title: "Előfizetés bővítése 5 felhasználóval", detail: "Árajánlatot kér.", category: "Értékesítés", priority: "low" },
      ],
      services: [],
    },
    en: {
      calls: [
        { summary: "Couldn't log in, received a password reset.", category: "Login", outcome: "resolved", name: "Márk Kovács" },
        { summary: "System slow in the mornings, ticket open.", category: "Performance", outcome: "unresolved", name: "Pixel Ltd." },
        { summary: "Requested an invoice copy, sent by email.", category: "Billing", outcome: "resolved", name: "Júlia Németh" },
        { summary: "Needs a technician for integration setup.", category: "Integration", outcome: "transferred", name: "Alfa Inc." },
      ],
      live: { name: "Levente Papp", turns: ["Hello, our printer isn't working on the network.", "Understood. Let's check together: is there an error on the printer's display?", "Yes, it says: no connection."] },
      issues: [
        { title: "Slow loading between 8 and 9 am", detail: "Several customers reported it, ticket sent to developers.", category: "Performance", priority: "high" },
        { title: "API integration setup", detail: "Alfa Inc. wants a technician, callback on Tuesday.", category: "Integration", priority: "normal" },
        { title: "Password reset email delayed", detail: "The email arrived after 10 minutes.", category: "Login", priority: "normal", resolved: true },
        { title: "Upgrade subscription by 5 users", detail: "Requests a quote.", category: "Sales", priority: "low" },
      ],
      services: [],
    },
    de: {
      calls: [
        { summary: "Konnte sich nicht anmelden, Passwort zurückgesetzt.", category: "Anmeldung", outcome: "resolved", name: "Márk Kovács" },
        { summary: "System morgens langsam, Ticket offen.", category: "Leistung", outcome: "unresolved", name: "Pixel GmbH" },
        { summary: "Rechnungskopie angefordert, per E-Mail gesendet.", category: "Abrechnung", outcome: "resolved", name: "Júlia Németh" },
        { summary: "Braucht Techniker für die Integration.", category: "Integration", outcome: "transferred", name: "Alfa AG" },
      ],
      live: { name: "Levente Papp", turns: ["Guten Tag, unser Drucker funktioniert im Netzwerk nicht.", "Verstehe. Prüfen wir gemeinsam: Zeigt das Display eine Fehlermeldung?", "Ja: keine Verbindung."] },
      issues: [
        { title: "Langsames Laden zwischen 8 und 9 Uhr", detail: "Mehrere Kunden meldeten es, Ticket an die Entwickler.", category: "Leistung", priority: "high" },
        { title: "API-Integration einrichten", detail: "Alfa AG möchte einen Techniker, Rückruf am Dienstag.", category: "Integration", priority: "normal" },
        { title: "Passwort-Mail verzögert", detail: "Die Mail kam nach 10 Minuten an.", category: "Anmeldung", priority: "normal", resolved: true },
        { title: "Abo um 5 Nutzer erweitern", detail: "Wünscht ein Angebot.", category: "Vertrieb", priority: "low" },
      ],
      services: [],
    },
  },
};

const PHONES = ["+36 30 412 7781", "+36 20 918 2240", "+36 70 331 5509", "+36 1 456 7812", "+36 30 227 1943"];

export type DemoData = { calls: Call[]; issues: Issue[]; bookings: Booking[] };

export function buildDemo(kind: BusinessKind, locale: string, onboarding: OnboardingData | null): DemoData {
  const loc = (["hu", "en", "de"].includes(locale) ? locale : "hu") as Loc;
  const pack = CONTENT[kind][loc];
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const min = 60_000;

  const live: Call = {
    id: "demo-live",
    status: "active",
    started_at: iso(47_000),
    ended_at: null,
    caller_number: PHONES[4],
    caller_name: pack.live.name,
    summary: null,
    category: null,
    sentiment: "neutral",
    outcome: null,
    transcript: pack.live.turns.map((text, i) => ({ who: i % 2 ? "agent" : "caller", text })),
  };

  // Egy hét hívásai (a grafikonhoz), a legfrissebb négy részletes
  const calls: Call[] = [live];
  for (let i = 0; i < 38; i++) {
    const tpl = pack.calls[i % pack.calls.length];
    const ago = (i < 4 ? 12 + i * 37 : 180 + i * 260) * min;
    const dur = (95 + ((i * 53) % 240)) * 1000;
    calls.push({
      id: `demo-call-${i}`,
      status: tpl.outcome === "transferred" ? "transferred" : "completed",
      started_at: iso(ago),
      ended_at: iso(ago - dur),
      caller_number: PHONES[i % 4],
      caller_name: tpl.name,
      summary: tpl.summary,
      category: tpl.category,
      sentiment: tpl.outcome === "unresolved" ? "negative" : i % 5 === 0 ? "neutral" : "positive",
      outcome: tpl.outcome,
      transcript: null,
    });
  }

  const issues: Issue[] = pack.issues.map((x, i) => ({
    id: `demo-issue-${i}`,
    call_id: `demo-call-${i}`,
    title: x.title,
    detail: x.detail,
    category: x.category,
    priority: x.priority,
    status: x.resolved ? "resolved" : "open",
    contact_name: pack.calls[i % pack.calls.length].name,
    contact_phone: PHONES[i % 4],
    created_at: iso((30 + i * 140) * min),
    resolved_at: x.resolved ? iso(20 * min) : null,
  }));
  // Néhány már megoldott, hogy a „kezelt problémák” szám életszerű legyen
  for (let i = 0; i < 9; i++) {
    const src = pack.issues[i % pack.issues.length];
    issues.push({ ...issues[i % 4], id: `demo-issue-old-${i}`, title: src.title, status: "resolved", created_at: iso((1500 + i * 700) * min), resolved_at: iso((1400 + i * 700) * min) });
  }

  const services = onboarding?.profile?.services?.length ? onboarding.profile.services : pack.services;
  const bookings: Booking[] =
    kind === "cases"
      ? []
      : Array.from({ length: 7 }, (_, i) => {
          const start = new Date();
          start.setHours(9 + ((i * 2) % 10), i % 2 ? 30 : 0, 0, 0);
          if (i > 3) start.setDate(start.getDate() + 1);
          return {
            id: `demo-booking-${i}`,
            call_id: `demo-call-${i}`,
            starts_at: kind === "reservations" ? new Date(start.setHours(18 + (i % 4), i % 2 ? 30 : 0)).toISOString() : start.toISOString(),
            service: services[i % services.length] ?? null,
            party_size: kind === "reservations" ? 2 + ((i * 3) % 6) : null,
            name: pack.calls[i % pack.calls.length].name,
            phone: PHONES[i % 4],
            notes: null,
            status: i === 5 ? "pending" : i === 6 ? "cancelled" : "confirmed",
          } satisfies Booking;
        });

  return { calls, issues, bookings };
}
