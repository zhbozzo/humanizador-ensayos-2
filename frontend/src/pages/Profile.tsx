import { useEffect, useState } from "react";
import { detectLocale } from "../lib/i18n";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "../lib/useSession";

type ProfileRow = {
  plan: string | null;
  words_balance: number | null;
  next_reset_at?: string | null;
  email?: string | null;
};

export default function Profile({ onGoPricing }: { onGoPricing: () => void }) {
  const { user, token, loading } = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [busy] = useState(false);
  const [error] = useState<string | null>(null);
  const locale = detectLocale();
  // const API = (import.meta as any).env.VITE_NODE_AUTH_URL || 'http://localhost:4000';

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_profiles")
      .select("plan,words_balance,next_reset_at,email")
      .single();
    if (!error) setProfile(data as ProfileRow);
  };

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  // const applyPlan = async (_plan: "free"|"basic"|"pro"|"ultra") => {
  //   onGoPricing();
  // };

  const topUpSamePlan = async () => onGoPricing();

  const logout = async () => {
    await supabase.auth.signOut();
    try { window.dispatchEvent(new Event('profile-summary-refresh')); } catch {}
    window.scrollTo({ top: 0 });
    window.location.hash = 'home';
  };

  if (loading) return <div className="text-center py-12 text-gray-600">Cargando…</div>;
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto py-6 animate-fade-up">
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Account */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5 flex items-start justify-between card-appear">
        <div className="space-y-2">
          <div className="text-sm text-gray-500">{locale==='es' ? 'Cuenta' : 'Account'}</div>
          <div className="text-lg font-semibold text-gray-900">{user.user_metadata?.name || user.email}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
        <button onClick={() => { logout(); window.location.hash=''; }} className="text-sm text-red-500 hover:text-red-600">Cerrar sesión</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Subscription */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-appear">
          <div className="text-sm text-gray-500 mb-2">{locale==='es' ? 'Suscripción' : 'Subscription'}</div>
          <div className="text-2xl font-bold text-gray-900 mb-4 capitalize">{profile?.plan || (locale==='es' ? 'Free' : 'Free')} {(!profile?.plan || profile?.plan==='free') && (locale==='es' ? 'Plan' : 'Plan')}</div>
          {/* Máximo por request */}
          <div className="mb-4 text-sm text-gray-700">
            <span className="text-gray-500">Máximo por request:</span>{' '}
            <span className="font-medium">
              {(() => {
                const p = (profile?.plan || 'free').toLowerCase();
                if (p === 'ultra') return '1,800 palabras';
                if (p === 'pro') return '1,200 palabras';
                if (p === 'basic') return '800 palabras';
                return '600 palabras';
              })()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const p = (profile?.plan || 'free').toLowerCase();
              if (p === 'free') {
                return (
                  <button onClick={onGoPricing} disabled={busy}
                    className="rounded-lg btn-brand py-2 font-medium disabled:opacity-60">
                    {locale==='es' ? 'Mejorar a Basic' : 'Upgrade to Basic'}
                  </button>
                );
              }
              if (p === 'basic') {
                return (
                  <button onClick={onGoPricing} disabled={busy}
                    className="rounded-lg btn-brand py-2 font-medium disabled:opacity-60">
                    {locale==='es' ? 'Mejorar a Pro' : 'Upgrade to Pro'}
                  </button>
                );
              }
              if (p === 'pro') {
                return (
                  <button onClick={onGoPricing} disabled={busy}
                    className="rounded-lg btn-brand py-2 font-medium disabled:opacity-60">
                    {locale==='es' ? 'Mejorar a Ultra' : 'Upgrade to Ultra'}
                  </button>
                );
              }
              // ultra: no hay mejora
              return (
                <button disabled className="rounded-lg bg-gray-200 text-gray-500 py-2 font-medium cursor-not-allowed">
                  Ultra (máximo)
                </button>
              );
            })()}
            <button
              onClick={() => onGoPricing()}
              disabled={busy}
              className="rounded-lg border border-gray-300 text-gray-700 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              {locale==='es' ? 'Gestionar' : 'Manage'}
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500">El cambio de plan recarga tu balance según la cuota del plan.</div>
        </div>

        {/* Balance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-appear">
          <div className="text-sm text-gray-500 mb-2">{locale==='es' ? 'Balance' : 'Balance'}</div>
          <div className="text-2xl font-bold text-gray-900 mb-4">{profile?.words_balance ?? 0} {locale==='es' ? 'palabras' : 'words'}</div>
          <div className="text-xs text-gray-500 mb-3">{locale==='es' ? 'Cada request consume tantas palabras como las que ingresas.' : 'Each request consumes roughly as many words as you input.'}</div>
          <button
            onClick={topUpSamePlan}
            disabled={busy}
            className="w-full rounded-lg bg-gray-100 text-gray-800 py-2 font-medium hover:bg-gray-200 disabled:opacity-60"
          >
            {locale==='es' ? 'Recargar palabras' : 'Get more words'}
          </button>
          {profile?.next_reset_at && (
            <div className="mt-3 text-xs text-gray-500">{locale==='es' ? 'Reinicio' : 'Reset'}: {new Date(profile.next_reset_at).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-5">
        <div className="text-sm text-gray-500 mb-2">{locale==='es' ? 'Historial de pagos' : 'Payment history'}</div>
        <div className="text-sm text-gray-400">{locale==='es' ? 'No hay movimientos registrados.' : 'No activity yet.'}</div>
      </div>

      {/* Paddle Customer Portal */}
      <div className="mt-5 text-center">
        <button
          onClick={async ()=>{
            try {
              const API = (import.meta as any).env.VITE_NODE_AUTH_URL || 'http://localhost:4000';
              const resp = await fetch(`${API}/api/paddle/portal`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              } as any);
              const json = await resp.json();
              if (!resp.ok) throw new Error(json?.error || 'Portal error');
              window.location.href = json.url;
            } catch (e:any) {
              alert(e?.message || 'No se pudo abrir el portal');
            }
          }}
          className="mt-2 text-sm underline text-brand-gradient"
        >
          {locale==='es' ? 'Gestionar suscripción' : 'Manage subscription'}
        </button>
      </div>
    </div>
  );
}
