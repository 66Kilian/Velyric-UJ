// Supabase beállítások a .env.local-ból. Ha még hiányoznak, az oldal nem omlik
// össze: az auth-űrlapok barátságos „még nincs beállítva” üzenetet mutatnak.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
