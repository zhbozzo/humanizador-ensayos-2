import HumanizerInterface from './components/HumanizerInterface';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Humanize from './pages/Humanize';
import Pricing from './pages/Pricing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refunds from './pages/Refunds';
import Footer from './components/Footer';
import FAQ from './pages/FAQ';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { detectLocale, setLocale, t, type Locale } from './lib/i18n';
import { useSession } from './lib/useSession';
import { useProfileSummary } from './lib/useProfileSummary';
import { useGoogleOneTap } from './lib/useGoogleOneTap';
import History from './pages/History';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState<'home'|'login'|'profile'|'humanize'|'pricing'|'terms'|'privacy'|'refunds'|'faq'|'history'>('home');
  const [locale, setLocaleState] = useState<Locale>(detectLocale());
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login');
  const [recovering, setRecovering] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const { user, loading } = useSession();
  const { summary, reloadProfileSummary, loading: loadingSummary } = useProfileSummary() as any;
  const [displayBalance, setDisplayBalance] = useState<number | null>(null);
  useGoogleOneTap(()=>setPage('profile'));

  // Cargar pestaña inicial desde hash/localStorage y NO forzar navegación por sesión
  useEffect(() => {
    const raw = (window.location.hash || '').replace(/^#/, '');
    const hasRecovery = raw.toLowerCase().includes('type=recovery');
    // soportar fragmentos compuestos: login#access_token=..., login?access_token=...
    const front = raw.split('#')[0].split('?')[0].split('&')[0];
    const stored = localStorage.getItem('page') as any;
    const candidate = (front || stored) as 'home'|'login'|'profile'|'humanize'|'pricing'|'terms'|'privacy'|'refunds'|'faq'|'history'|undefined;
    if (hasRecovery) {
      setAuthMode('login');
      setRecovering(true);
      setPage('login');
      return;
    }
    if (candidate && ['home','login','profile','humanize','pricing','history','terms','privacy','refunds','faq'].includes(candidate)) {
      setPage(candidate);
    }
  }, []);

  // Escuchar cambios de idioma globales
  useEffect(() => {
    const onLocale = (e: any) => setLocaleState((e?.detail as Locale) || detectLocale());
    window.addEventListener('locale-changed', onLocale as any);
    return () => window.removeEventListener('locale-changed', onLocale as any);
  }, []);

  // Persistir página actual y reflejar en hash
  useEffect(() => {
    localStorage.setItem('page', page);
    // Evitar tocar el hash cuando estamos en rutas legales reales
    const legalPaths = ['/privacy','/terms','/refund','/refunds'];
    if (!recovering && !legalPaths.includes(location.pathname)) {
      window.location.hash = page === 'home' ? 'home' : page;
    }
  }, [page, recovering, location.pathname]);

  // Responder a cambios del hash (por ejemplo, después de logout)
  useEffect(() => {
    const onHashChange = () => {
      const raw = (window.location.hash || '').replace(/^#/, '');
      if (raw.toLowerCase().includes('type=recovery')) { setRecovering(true); setAuthMode('login'); setPage('login'); return; }
      const front = raw.split('#')[0].split('?')[0].split('&')[0];
      if (!front) { setPage('home'); return; }
      if (['home','login','profile','humanize','pricing','terms','privacy','refunds','faq'].includes(front)) setPage(front as any);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Abrir signup desde eventos internos (e.g., intentar humanizar sin sesión)
  useEffect(() => {
    const openSignup = () => { setAuthMode('signup'); setPage('login'); };
    window.addEventListener('open-signup', openSignup as any);
    return () => window.removeEventListener('open-signup', openSignup as any);
  }, []);

  // Escucha eventos para abrir pricing desde upsells locales
  useEffect(() => {
    const handler = () => setPage('pricing');
    const refresh = () => reloadProfileSummary && reloadProfileSummary();
    const onDelta = (e: any) => {
      const delta = typeof e?.detail === 'number' ? e.detail : 0;
      if (!Number.isFinite(delta)) return;
      setDisplayBalance(prev => Math.max(0, prev + delta));
    };
    window.addEventListener('open-pricing', handler as any);
    window.addEventListener('profile-summary-refresh', refresh as any);
    window.addEventListener('balance-delta', onDelta as any);
    return () => {
      window.removeEventListener('open-pricing', handler as any);
      window.removeEventListener('profile-summary-refresh', refresh as any);
      window.removeEventListener('balance-delta', onDelta as any);
    };
  }, []);

  // Animar balance al cambiar (cuando ya tenemos summary)
  useEffect(() => {
    if (typeof summary?.words_balance !== 'number') return;
    const target = summary.words_balance;
    const start = (displayBalance ?? target);
    if (start === target) { setDisplayBalance(target); return; }
    const duration = 700;
    const startTs = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(start + (target - start) * eased);
      setDisplayBalance(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [summary?.words_balance]);

  // Si se cierra sesión mientras estamos en profile, regresar a home
  useEffect(() => {
    if (!loading && !user && page === 'profile') setPage('home');
  }, [user, loading, page]);
  return (
    <div className="min-h-screen app-bg">
      {/* Nav */}
      <header className="border-b border-neutral-800 bg-neutral-900 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 relative">
          <div className="flex items-center gap-2">
            <img src="/logohuman.png" alt="logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-md object-contain" onError={(e:any)=>{try{e.currentTarget.src='/Logohuman.png';}catch{}}} />
            <button className="font-extrabold text-brand-gradient text-lg sm:text-xl" onClick={()=>{ navigate('/'); setPage('home'); setMobileOpen(false); }}>humaniza.ai</button>
          </div>
          <nav className="hidden md:flex items-center gap-3 text-sm">
            <button
              onClick={()=>{ navigate('/'); setPage('home'); setMobileOpen(false); }}
              className={`px-4 py-1.5 rounded-full border ${page==='home' ? 'animated-bg text-white border-transparent shadow-sm' : 'bg-transparent text-gray-300 hover:text-white border-transparent'}`}
            >
              {t('nav_humanize', locale)}
            </button>
            <button
              onClick={()=>{ navigate('/'); setPage('pricing'); setMobileOpen(false); }}
              className={`px-4 py-1.5 rounded-full border ${page==='pricing' ? 'animated-bg text-white border-transparent shadow-sm' : 'bg-transparent text-gray-300 hover:text-white border-transparent'}`}
            >
              {t('nav_pricing', locale)}
            </button>
            {user && (
              <button
                onClick={()=>{ navigate('/'); setPage('history'); setMobileOpen(false); }}
                className={`px-4 py-1.5 rounded-full border ${page==='history' ? 'animated-bg text-white border-transparent shadow-sm' : 'bg-transparent text-gray-300 hover:text-white border-transparent'}`}
              >
                {t('nav_history', locale)}
              </button>
            )}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2 sm:gap-3">
              {!user ? (
                <>
                  <button onClick={()=>{ navigate('/'); setAuthMode('login'); setPage('login'); }} className="text-sm text-gray-200 hover:text-white">{t('nav_login', locale)}</button>
                  <button onClick={()=>{ navigate('/'); setAuthMode('signup'); setPage('login'); }} className="text-sm font-semibold rounded-lg btn-brand px-4 py-2">
                    {t('nav_try_free', locale)}
                  </button>
                </>
              ) : (
                <>
                  <div className="hidden md:flex items-center text-sm text-gray-200">
                    <span className="mr-2">{locale==='es' ? 'Balance:' : 'Balance:'}</span>
                    <span className="font-semibold transition-all">
                      {displayBalance !== null ? displayBalance : (loadingSummary ? '…' : (summary?.words_balance ?? '—'))}
                    </span>
                  </div>
                  <button
                    onClick={()=>{ navigate('/'); setPage('pricing'); }}
                    className="text-sm font-semibold rounded-lg btn-brand px-3 py-1.5"
                  >
                    {locale==='es' ? 'Obtener más palabras' : 'Get more words'}
                  </button>
                  <button onClick={()=>{ navigate('/'); setPage('profile'); }} className="w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center">
                    {user.email?.[0]?.toLowerCase() || 'u'}
                  </button>
                </>
              )}
              {/* Selector de idioma */}
              <select
                className="hidden md:block bg-neutral-800 text-gray-200 text-xs rounded-md px-2 py-1 border border-neutral-700"
                value={locale}
                onChange={(e)=>{ const l = (e.target.value as Locale); setLocale(l); setLocaleState(l); }}
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md border border-neutral-700 text-gray-200 hover:text-white hover:border-neutral-500"
              onClick={()=>setMobileOpen(o=>!o)}
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div className="md:hidden absolute left-0 right-0 top-full bg-neutral-900 border-t border-neutral-800 shadow-xl z-40">
              <div className="px-3 py-3 grid gap-2 text-sm">
                <button onClick={()=>{ navigate('/'); setPage('home'); setMobileOpen(false); }} className="text-left px-3 py-2 rounded-md hover:bg-neutral-800">{t('nav_humanize', locale)}</button>
                <button onClick={()=>{ navigate('/'); setPage('pricing'); setMobileOpen(false); }} className="text-left px-3 py-2 rounded-md hover:bg-neutral-800">{t('nav_pricing', locale)}</button>
                {user && (
                  <button onClick={()=>{ navigate('/'); setPage('history'); setMobileOpen(false); }} className="text-left px-3 py-2 rounded-md hover:bg-neutral-800">{t('nav_history', locale)}</button>
                )}
                {!user ? (
                  <>
                    <button onClick={()=>{ navigate('/'); setAuthMode('login'); setPage('login'); setMobileOpen(false); }} className="text-left px-3 py-2 rounded-md hover:bg-neutral-800">{t('nav_login', locale)}</button>
                    <button onClick={()=>{ navigate('/'); setAuthMode('signup'); setPage('login'); setMobileOpen(false); }} className="text-left px-3 py-2 rounded-md btn-brand text-white">{t('nav_try_free', locale)}</button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-3 py-2 text-gray-200">
                      <span>{locale==='es' ? 'Balance' : 'Balance'}</span>
                      <span className="font-semibold">{displayBalance !== null ? displayBalance : (loadingSummary ? '…' : (summary?.words_balance ?? '—'))}</span>
                    </div>
                    <button onClick={()=>{ navigate('/'); setPage('profile'); setMobileOpen(false); }} className="text-left px-3 py-2 rounded-md hover:bg-neutral-800">{locale==='es' ? 'Perfil' : 'Profile'}</button>
                  </>
                )}
                <div className="px-3 pt-2">
                  <select
                    className="w-full bg-neutral-800 text-gray-200 text-xs rounded-md px-2 py-1 border border-neutral-700"
                    value={locale}
                    onChange={(e)=>{ const l = (e.target.value as Locale); setLocale(l); setLocaleState(l); }}
                  >
                    <option value="en">EN</option>
                    <option value="es">ES</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8 animate-fade-up">
        {['/privacy','/terms','/refund','/refunds'].includes(location.pathname) ? (
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refunds />} />
              <Route path="/refunds" element={<Refunds />} />
            </Routes>
          </div>
        ) : (
          <>
            {page==='home' && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center gap-2 mb-2">
                  <img src="/logohuman.png" alt="logo" className="w-40 h-40 sm:w-64 sm:h-64 object-contain" onError={(e:any)=>{try{e.currentTarget.src='/Logohuman.png';}catch{}}} />
                  <h1 className="text-5xl md:text-7xl font-extrabold text-brand-gradient">humaniza.ai</h1>
                </div>
                <div className="block w-fit mx-auto px-5 py-2 rounded-full animated-bg text-white text-sm font-semibold shadow-md mb-3">{locale==='es' ? 'CONFIAN EN NOSOTROS 100.000+ USUARIOS' : 'TRUSTED BY 100,000+ USERS'}</div>
                <p className="text-gray-700 max-w-2xl mx-auto mb-5">{locale==='es' ? 'Hecho para dar un toque más humano a tu texto y bypassear detectores de IA.' : 'Made to give your text a more human touch and bypass AI detectors.'}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={()=>{
                      navigate('/');
                      setAuthMode('signup');
                      setPage('login');
                    }}
                    className="px-6 py-3 rounded-xl btn-brand text-base font-semibold shadow-lg"
                  >{locale==='es' ? 'Probar gratis' : 'Try for free'}</button>
                  <button onClick={()=>{ navigate('/'); setPage('pricing'); }} className="px-6 py-3 rounded-xl border border-transparent bg-white/70 hover:bg-white text-gray-700 shadow">
                    {locale==='es' ? 'Ver planes' : 'View plans'}
                  </button>
                </div>
              </div>
            )}
            <div className="max-w-5xl mx-auto" id="humanizer-section">
              {page==='home' && <HumanizerInterface />}
              {page==='login' && <Login onLoggedIn={()=>setPage('profile')} defaultMode={authMode} />}
              {page==='profile' && <Profile onGoPricing={()=>setPage('pricing')} />}
              {page==='humanize' && <Humanize />}
              {page==='pricing' && (
                <Pricing onSubscribeIntent={()=>setPage('profile')} onLogin={()=>setPage('login')} />
              )}
              {page==='history' && <History />}
              {page==='terms' && <Terms />}
              {page==='privacy' && <Privacy />}
              {page==='refunds' && <Refunds />}
              {page==='faq' && <FAQ />}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
