import { useSession } from "../lib/useSession";
import { useState } from "react";
import { detectLocale, t } from "../lib/i18n";
// import { initPaddle, openCheckout } from "../lib/paddle";
import { useProfileSummary } from "../lib/useProfileSummary";
import { supabase } from "../lib/supabaseClient";

export default function Pricing({ onSubscribeIntent, onLogin }: { onSubscribeIntent: () => void; onLogin: () => void }) {
  const { user } = useSession();
  const [billing, setBilling] = useState<'monthly'|'annual'>('annual');
  const { summary, reloadProfileSummary } = useProfileSummary();
  const locale = detectLocale();

  const planRank: Record<'free'|'basic'|'pro'|'ultra', number> = { free: 0, basic: 1, pro: 2, ultra: 3 };
  const nowMs = () => Date.now();
  const hasActiveCycle = () => {
    const end = summary?.plan_renews_at ? new Date(summary.plan_renews_at).getTime() : 0;
    return !!end && end > nowMs();
  };
  const canChangePeriod = (targetPeriod: 'monthly'|'annual') => {
    const currentPeriod = (summary?.billing_period || 'monthly') as 'monthly'|'annual';
    if (!summary?.plan || summary.plan === 'free') return true; // desde free se permite elegir periodo
    if (targetPeriod === currentPeriod) return true;
    // Bloquear cambio de periodo hasta terminar el ciclo
    return !hasActiveCycle();
  };
  const canUpgradeTo = (targetPlan: 'basic'|'pro'|'ultra') => {
    const current = (summary?.plan || 'free') as 'free'|'basic'|'pro'|'ultra';
    return planRank[targetPlan] >= planRank[current];
  };
  const blockReason = (targetPlan: 'basic'|'pro'|'ultra', targetPeriod: 'monthly'|'annual'): string | null => {
    const current = (summary?.plan || 'free') as 'free'|'basic'|'pro'|'ultra';
    const currentPeriod = (summary?.billing_period || 'monthly') as 'monthly'|'annual';
    if (planRank[targetPlan] < planRank[current]) return locale==='es' ? 'No puedes bajar de plan mientras esté activo.' : 'You cannot downgrade while the plan is active.';
    if (targetPeriod !== currentPeriod && !canChangePeriod(targetPeriod)) {
      const end = summary?.plan_renews_at ? new Date(summary.plan_renews_at) : null;
      const endTxt = end ? end.toLocaleDateString() : 'fin de ciclo';
      return locale==='es' ? `Solo puedes cambiar de periodo al renovar (${endTxt}).` : `You can only change period at renewal (${end ? end.toLocaleDateString() : 'end of cycle'}).`;
    }
    return null;
  };

  // Ya no inicializamos Paddle en modo pruebas

  // Modo pruebas: actualizar plan directamente en Supabase (sin Paddle)

  const subscribe = async (plan: 'basic'|'pro'|'ultra') => {
    if (!user?.email) { onLogin(); return; }
    const reason = blockReason(plan, billing);
    if (reason) { console.warn('[pricing] blocked:', reason); return; }
    try {
      // aplica reglas locales ya verificadas por blockReason
      const { error } = await supabase.rpc('change_subscription', {
        p_email: user.email,
        p_new_plan: plan,
        p_new_billing_period: billing,
        p_auto_renew: true,
        p_strategy: 'reset',
        p_reset_cycle: true
      });
      if (error) throw error;
      await reloadProfileSummary?.();
      window.dispatchEvent(new CustomEvent('profile-summary-refresh'));
      onSubscribeIntent?.();
    } catch (e) {
      console.warn('[pricing] subscribe failed', e);
      alert('No se pudo actualizar la suscripción.');
    }
  };

  const cta = (label: string, planKey?: 'basic'|'pro'|'ultra') => {
    const disabled = !!(user && planKey && blockReason(planKey, billing));
    const title = planKey ? (blockReason(planKey, billing) || undefined) : undefined;
    return (
      <button
        onClick={() => (user ? (planKey ? subscribe(planKey) : onSubscribeIntent()) : onLogin())}
        disabled={disabled}
        title={title}
        className={`w-full rounded-lg py-2.5 text-sm font-semibold ${disabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'btn-brand'}`}
      >
        {label}
      </button>
    );
  };

  const isCurrent = (plan: 'basic'|'pro'|'ultra') => (summary?.plan === plan && (summary?.billing_period || 'monthly') === billing);
  const daysLeft = () => {
    const end = summary?.plan_renews_at ? new Date(summary.plan_renews_at).getTime() : 0;
    const now = Date.now();
    if (!end || end < now) return 0;
    return Math.ceil((end - now) / (1000*60*60*24));
  };

  // Precios base mensuales
  const monthly = { basic: 9.99, pro: 29.99, ultra: 59.99 };
  const annual = { basic: 4.99, pro: 14.99, ultra: 29.99 }; // 50% de descuento

  return (
    <div className="max-w-5xl mx-auto animate-fade-up bg-[radial-gradient(1200px_600px_at_-10%_-10%,#00E5FF12,transparent),radial-gradient(900px_500px_at_110%_20%,#007BFF14,transparent)] p-1 rounded-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-gradient">{locale==='es' ? 'Planes flexibles para ti' : 'Flexible pricing plans for you'}</h1>
        <div className="inline-flex mt-4 p-1.5 rounded-full border border-gray-200 bg-white gap-2">
          <button
            onClick={()=>setBilling('monthly')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition ${billing==='monthly' ? 'bg-brand-gradient text-white' : 'bg-white text-gray-600 hover:text-gray-800'}`}
          >
            {locale==='es' ? 'Mensual' : 'Monthly'}
          </button>
          <button
            onClick={()=>setBilling('annual')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2 ${billing==='annual' ? 'bg-brand-gradient text-white' : 'bg-white text-gray-600 hover:text-gray-800'}`}
          >
            <span>{locale==='es' ? 'Anual' : 'Annual'}</span>
            <span className={`text-[10px] leading-none px-2 py-1 rounded ${billing==='annual' ? 'bg-white text-cyan-700' : 'bg-brand-gradient text-white'}`}>{locale==='es' ? 'AHORRA 50%' : 'SAVE 50%'}</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic (anual) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 flex flex-col min-h-[640px] card-appear">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-800 font-semibold">Basic</div>
            {isCurrent('basic') && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient text-white">CURRENT</span>
            )}
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-medium shadow-sm">
            <span className="text-base font-bold mr-1">5,000</span> {locale==='es' ? 'palabras por mes' : 'words per month'}
          </div>
          <div className="text-3xl font-bold mt-2">${billing==='annual'? annual.basic.toFixed(2) : monthly.basic.toFixed(2)} <span className="text-sm font-normal text-gray-500">{locale==='es' ? 'Por mes' : 'Per month'}</span></div>
          {billing==='annual' ? (
            <div className="text-xs text-gray-400"><span className="line-through mr-1">${monthly.basic.toFixed(2)}</span> {locale==='es' ? 'Facturado anualmente' : 'Billed annually'}</div>
          ) : (
            <div className="text-xs text-gray-400">{locale==='es' ? 'Facturado mensualmente' : 'Billed monthly'}</div>
          )}
          <div className="mt-3 mb-2">
            {isCurrent('basic') ? (
              <div className="text-xs text-gray-500 text-center">
                {summary?.auto_renew ? (locale==='es' ? `Renueva en ${daysLeft()} días` : `Renews in ${daysLeft()} days`) : (locale==='es' ? `Expira en ${daysLeft()} días` : `Expires in ${daysLeft()} days`)}
              </div>
            ) : (
              <div>
                {cta(user ? (locale==='es' ? 'Suscribirse' : 'Subscribe') : (locale==='es' ? 'Regístrate' : 'Sign up'), 'basic')}
                {user && blockReason('basic', billing) && (
                  <div className="mt-2 text-[11px] text-red-600 text-center">{blockReason('basic', billing)}</div>
                )}
              </div>
            )}
          </div>
          <ul className="mt-4 text-sm text-gray-600 space-y-2 flex-1">
            {locale==='es' ? (
              <>
                <li>✓ 800 palabras por solicitud</li>
                <li>✓ Modo Ultimate (+95% estilo humano)</li>
                <li>✓ Optimizado para pasar detectores de IA (incl. GPTZero y Turnitin)</li>
                <li>✓ Motor de Humanización Básico</li>
                <li>✓ Sin plagio</li>
                <li>✓ Reescritura sin errores</li>
                <li>✓ Resultados indetectables</li>
                <li>✓ Detección de IA ilimitada</li>
                <li>✓ 20+ idiomas soportados</li>
              </>
            ) : (
              <>
                <li>✓ 800 words per request</li>
                <li>✓ Ultimate mode (+95% human-like)</li>
                <li>✓ Optimized to pass AI detectors (incl. GPTZero & Turnitin)</li>
                <li>✓ Basic Humanization Engine</li>
                <li>✓ Plagiarism‑free</li>
                <li>✓ Error‑free rewriting</li>
                <li>✓ Undetectable results</li>
                <li>✓ Unlimited AI detection</li>
                <li>✓ 20+ languages supported</li>
              </>
            )}
          </ul>
        </div>
        {/* Pro (anual) */}
        <div className="animated-border p-[2px] rounded-2xl card-appear">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 flex flex-col min-h-[640px]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-800 font-semibold">Pro</div>
            <div className="flex items-center gap-2">
              {isCurrent('pro') && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient text-white">CURRENT</span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient text-white">MOST POPULAR</span>
            </div>
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-medium shadow-sm">
            <span className="text-base font-bold mr-1">15,000</span> {locale==='es' ? 'palabras por mes' : 'words per month'}
          </div>
          <div className="text-3xl font-bold mt-2">${billing==='annual'? annual.pro.toFixed(2) : monthly.pro.toFixed(2)} <span className="text-sm font-normal text-gray-500">{locale==='es' ? 'Por mes' : 'Per month'}</span></div>
          {billing==='annual' ? (
            <div className="text-xs text-gray-400"><span className="line-through mr-1">${monthly.pro.toFixed(2)}</span> {locale==='es' ? 'Facturado anualmente' : 'Billed annually'}</div>
          ) : (
            <div className="text-xs text-gray-400">{locale==='es' ? 'Facturado mensualmente' : 'Billed monthly'}</div>
          )}
          <div className="mt-3 mb-2">
            {isCurrent('pro') ? (
              <div className="text-xs text-gray-500 text-center">
                {summary?.auto_renew ? `Renews in ${daysLeft()} days` : `Expires in ${daysLeft()} days`}
              </div>
            ) : (
              <div>
                {cta(locale==='es' ? 'Suscribirse' : 'Subscribe', 'pro')}
                {user && blockReason('pro', billing) && (
                  <div className="mt-2 text-[11px] text-red-600 text-center">{blockReason('pro', billing)}</div>
                )}
              </div>
            )}
          </div>
          <ul className="mt-4 text-sm text-gray-600 space-y-2 flex-1">
            {locale==='es' ? (
              <>
                <li>✓ 1,200 palabras por solicitud</li>
                <li>✓ Modo Ultimate</li>
                <li>✓ Optimizado para pasar detectores de IA (incl. GPTZero y Turnitin)</li>
                <li>✓ Motor de Humanización Avanzado</li>
                <li>✓ Sin plagio</li>
                <li>✓ Reescritura sin errores</li>
                <li>✓ Resultados indetectables</li>
                <li>✓ Detección de IA ilimitada</li>
                <li>✓ 50+ idiomas soportados</li>
                <li>✓ Motor avanzado para Turnitin</li>
                <li>✓ Resultados naturales</li>
              </>
            ) : (
              <>
                <li>✓ 1,200 words per request</li>
                <li>✓ Ultimate mode</li>
                <li>✓ Optimized to pass AI detectors (incl. GPTZero & Turnitin)</li>
                <li>✓ Advanced Humanization Engine</li>
                <li>✓ Plagiarism‑free</li>
                <li>✓ Error‑free rewriting</li>
                <li>✓ Undetectable results</li>
                <li>✓ Unlimited AI detection</li>
                <li>✓ 50+ languages supported</li>
                <li>✓ Advanced Turnitin Bypass Engine</li>
                <li>✓ Human‑like results</li>
              </>
            )}
          </ul>
          </div>
        </div>
        {/* Ultra (anual) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 flex flex-col min-h-[640px] card-appear">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-800 font-semibold">Ultra</div>
            {isCurrent('ultra') && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gradient text-white">CURRENT</span>
            )}
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-medium shadow-sm">
            <span className="text-base font-bold mr-1">30,000</span> {locale==='es' ? 'palabras por mes' : 'words per month'}
          </div>
          <div className="text-3xl font-bold mt-2">${billing==='annual'? annual.ultra.toFixed(2) : monthly.ultra.toFixed(2)} <span className="text-sm font-normal text-gray-500">{locale==='es' ? 'Por mes' : 'Per month'}</span></div>
          {billing==='annual' ? (
            <div className="text-xs text-gray-400"><span className="line-through mr-1">${monthly.ultra.toFixed(2)}</span> {locale==='es' ? 'Facturado anualmente' : 'Billed annually'}</div>
          ) : (
            <div className="text-xs text-gray-400">{locale==='es' ? 'Facturado mensualmente' : 'Billed monthly'}</div>
          )}
          <div className="mt-3 mb-2">
            {isCurrent('ultra') ? (
              <div className="text-xs text-gray-500 text-center">
                {summary?.auto_renew ? `Renews in ${daysLeft()} days` : `Expires in ${daysLeft()} days`}
              </div>
            ) : (
              <div>
                {cta(locale==='es' ? 'Suscribirse' : 'Subscribe', 'ultra')}
                {user && blockReason('ultra', billing) && (
                  <div className="mt-2 text-[11px] text-red-600 text-center">{blockReason('ultra', billing)}</div>
                )}
              </div>
            )}
          </div>
          <ul className="mt-4 text-sm text-gray-600 space-y-2 flex-1">
            {locale==='es' ? (
              <>
                <li>✓ 1,800 palabras por solicitud</li>
                <li>✓ Modo Ultimate</li>
                <li>✓ Optimizado para pasar detectores de IA (incl. GPTZero y Turnitin)</li>
                <li>✓ Motor de Humanización Avanzado</li>
                <li>✓ Sin plagio</li>
                <li>✓ Reescritura sin errores</li>
                <li>✓ Resultados indetectables</li>
                <li>✓ Detección de IA ilimitada</li>
                <li>✓ 50+ idiomas soportados</li>
                <li>✓ Motor avanzado para Turnitin</li>
                <li>✓ Resultados naturales</li>
              </>
            ) : (
              <>
                <li>✓ 1,800 words per request</li>
                <li>✓ Ultimate mode</li>
                <li>✓ Optimized to pass AI detectors (incl. GPTZero & Turnitin)</li>
                <li>✓ Advanced Humanization Engine</li>
                <li>✓ Plagiarism‑free</li>
                <li>✓ Error‑free rewriting</li>
                <li>✓ Undetectable results</li>
                <li>✓ Unlimited AI detection</li>
                <li>✓ 50+ languages supported</li>
                <li>✓ Advanced Turnitin Bypass Engine</li>
                <li>✓ Human‑like results</li>
              </>
            )}
          </ul>
        </div>
      </div>
      {/* Footer legal / contacto */}
      <div className="mt-10 text-center text-xs text-gray-500">
        {locale==='es' ? 'Al hacer clic en “Suscribirse”, aceptas nuestros ' : 'By clicking “Subscribe”, you agree to our '}
        <a href="#terms" className="underline">{locale==='es' ? 'Términos del Servicio' : 'Terms of Service'}</a> {locale==='es' ? 'y ' : 'and '}
        <a href="#privacy" className="underline">{locale==='es' ? 'Política de Privacidad' : 'Privacy Policy'}</a>. · {locale==='es' ? '¿Necesitas más?' : 'Need more?'}{' '}
        <a href="mailto:contacto@humaniza.ai" className="text-brand-gradient underline">{locale==='es' ? 'Contáctanos' : 'Contact us'}</a>
      </div>
    </div>
  );
}


