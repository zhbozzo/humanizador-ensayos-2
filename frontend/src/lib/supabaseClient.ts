import { createClient } from "@supabase/supabase-js";

// Estas constantes serán reemplazadas por Vite en build/dev si existen en el .env
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const __VITE_SUPABASE_URL__: string;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const __VITE_SUPABASE_ANON__: string;

// Admitir variables con prefijo VITE_ (Vite) y NEXT_PUBLIC_ (Supabase-Vercel integration)
const rawUrl = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL
  || (import.meta as any).env?.VITE_SUPABASE_URL
  || (typeof __VITE_SUPABASE_URL__ !== 'undefined' ? __VITE_SUPABASE_URL__ : undefined);
const rawAnon = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || (import.meta as any).env?.VITE_SUPABASE_ANON
  || (typeof __VITE_SUPABASE_ANON__ !== 'undefined' ? __VITE_SUPABASE_ANON__ : undefined);

const url = typeof rawUrl === 'string' ? rawUrl.trim() : rawUrl;
const anon = typeof rawAnon === 'string' ? rawAnon.trim() : rawAnon;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error("VITE_SUPABASE_URL/VITE_SUPABASE_ANON no definidos. Revisa frontend/.env y reinicia Vite.", {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON: anon ? "OK" : "FALTA",
  });
  throw new Error("Faltan variables de entorno de Supabase en el frontend (.env)");
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
