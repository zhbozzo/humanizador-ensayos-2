import { useEffect, useRef, useState } from "react";
import { detectLocale, type Locale } from "../lib/i18n";
import { supabase } from "../lib/supabaseClient";

export default function Login({ onLoggedIn, defaultMode = 'login' as 'login'|'signup' }: { onLoggedIn?: () => void; defaultMode?: 'login'|'signup' }) {
  const initialRecovery = ((window.location.hash || '').toLowerCase().includes('type=recovery'));
  const [mode, setMode] = useState<"login"|"signup"|"reset"|"change">(initialRecovery ? 'change' : defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const oneTapShown = useRef(false);
  const isRecovery = useRef(initialRecovery);
  const [locale, setLocale] = useState<Locale>(detectLocale());
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [notice, setNotice] = useState<string|null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const handler = (e: any) => setLocale((e?.detail as Locale) || detectLocale());
    window.addEventListener('locale-changed', handler as any);
    return () => window.removeEventListener('locale-changed', handler as any);
  }, []);

  // Limpiar errores al cambiar modo/campos/idioma
  useEffect(() => { setErr(null); setNotice(null); }, [mode, email, password, locale]);

  // Contador para cooldown de reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // Google One Tap prompt (simulado si client id existe)
  useEffect(() => {
    const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
    if (!CLIENT_ID || oneTapShown.current) return;
    oneTapShown.current = true;
    // Intentar cargar script de Google Identity Services
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => {
      try {
        // @ts-ignore
        if (window.google && window.google.accounts && window.google.accounts.id) {
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            auto_select: false,
            cancel_on_tap_outside: false,
            itp_support: true,
            callback: async (response: any) => {
              try {
                if (response?.credential) {
                  await supabase.auth.signInWithIdToken({ provider: 'google', token: response.credential });
                  onLoggedIn?.();
                }
              } catch (e) { /* ignore */ }
            },
            context: 'signin',
          });
          // @ts-ignore
          window.google.accounts.id.prompt((notice:any)=>{ console.debug('OneTap:', notice); });
          // Render botón One Tap en esquina superior derecha
          const tap = document.createElement('div');
          tap.style.position = 'fixed';
          tap.style.top = '16px';
          tap.style.right = '16px';
          tap.style.zIndex = '50';
          tap.id = 'g_id_onload';
          tap.setAttribute('data-client_id', CLIENT_ID);
          tap.setAttribute('data-auto_prompt', 'true');
          document.body.appendChild(tap);
        }
      } catch {}
    };
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  // Sincronizar cuando el padre cambie defaultMode (al pulsar Login/Try for free en el header)
  useEffect(() => {
    if (!isRecovery.current) setMode(defaultMode);
  }, [defaultMode]);

  // Si llegamos desde OAuth y ya hay sesión, navegar inmediatamente
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session && !isRecovery.current) onLoggedIn?.();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (_e === 'PASSWORD_RECOVERY' || isRecovery.current) {
        setMode('change');
        return;
      }
      if (session) onLoggedIn?.();
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // Detectar regreso con token de recovery (?type=recovery)
  useEffect(() => {
    const h = (window.location.hash || '').toLowerCase();
    if (h.includes('type=recovery')) { isRecovery.current = true; setMode('change'); }
    const onHash = () => {
      const raw = (window.location.hash || '').toLowerCase();
      if (raw.includes('type=recovery')) { isRecovery.current = true; setMode('change'); }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const strongPasswordOk = (pwd: string) => ({
    lenOk: pwd.length >= 8,
    upperOk: /[A-Z]/.test(pwd),
    numOk: /[0-9]/.test(pwd),
  });

  const submit = async () => {
    try {
      setErr(null); setLoading(true);
      if (!email || !password) throw new Error(locale==='es' ? "Ingresa email y contraseña" : "Enter email and password");
      if (mode === "signup") {
        const { lenOk, upperOk, numOk } = strongPasswordOk(password);
        if (!lenOk || !upperOk || !numOk) {
          throw new Error(locale==='es' ? 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número.' : 'Password must have at least 8 characters, 1 uppercase letter and 1 number.');
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        } as any);
        if (error) {
          const msg = (error as any)?.message || '';
          if (/user already registered|email.*already/i.test(msg)) {
            throw new Error(locale==='es' ? 'Este correo ya está registrado.' : 'This email is already registered.');
          }
          throw error;
        }
        // Caso especial Supabase: si el usuario ya existe, identities llega vacío y no se lanza error
        // https://github.com/supabase/supabase/discussions/18266
        const identities = (data as any)?.user?.identities;
        if (Array.isArray(identities) && identities.length === 0) {
          setErr(locale==='es' ? 'Este correo ya está registrado. Usa Iniciar sesión o un proveedor (Google/Apple).' : 'This email is already registered. Please log in or use a provider (Google/Apple).');
          return; // No avanzar a pantalla de confirmación
        }
        // Mostrar pantalla de confirmación dedicada
        setPendingEmail(email);
        setShowEmailSignup(false);
        setMode('confirm' as any);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = (error as any)?.message || '';
          if (/Invalid login credentials/i.test(msg)) {
            throw new Error(locale==='es' ? 'Credenciales inválidas' : 'Invalid login credentials');
          }
          if (/confirm.*email|not.*confirmed/i.test(msg)) {
            throw new Error(locale==='es' ? 'Confirma tu correo para iniciar sesión.' : 'Please confirm your email before logging in.');
          }
          throw error;
        }
        if (data?.session) onLoggedIn?.();
      }
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  };

  const logout = () => supabase.auth.signOut();

  const signInWithProvider = async (provider: "google" | "apple") => {
    setErr(null);
    if (provider === 'google') {
      // Intentar GIS (IdToken) para que Google muestre nuestro dominio y no el de Supabase
      const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
      // Debug mínimo para verificar carga de env
      try { console.debug('[login] VITE_GOOGLE_CLIENT_ID present:', !!CLIENT_ID); } catch {}
      if (!CLIENT_ID) {
        // Fallback a OAuth clásico de Supabase si no hay CLIENT_ID
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + '#login' },
        });
        if (error) setErr(error.message);
        return;
      }
      try {
        const ensureScript = async () => new Promise<void>((resolve, reject) => {
          // @ts-ignore
          if (window.google?.accounts?.id) return resolve();
          const s = document.createElement('script');
          s.src = 'https://accounts.google.com/gsi/client';
          s.async = true; s.defer = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
          document.head.appendChild(s);
        });
        await ensureScript();
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response: any) => {
            if (response?.credential) {
              try {
                await supabase.auth.signInWithIdToken({ provider: 'google', token: response.credential });
                onLoggedIn?.();
              } catch (e:any) {
                setErr(e.message || 'Error al iniciar sesión con Google');
              }
            }
          },
          context: 'signin',
          auto_select: false,
        });
        // @ts-ignore: abrir selector de cuenta/modal de Google en el contexto actual
        window.google.accounts.id.prompt();
        return; // Evitar cualquier otro flujo: nunca usar OAuth clásico con Google si GIS está disponible
      } catch (e:any) {
        // Si GIS falla, intentar fallback OAuth de Supabase
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '#login' },
          });
          if (error) setErr(error.message);
        } catch (e2:any) {
          setErr(e2?.message || e?.message || 'No se pudo iniciar Google');
        }
        return;
      }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '#login' },
    });
    if (error) setErr(error.message);
  };

  const emailExists = async (e: string) => {
    try {
      const url = (import.meta as any).env.VITE_NODE_AUTH_URL || 'http://localhost:4000';
      const controller = new AbortController();
      const t = setTimeout(()=>controller.abort(), 1200);
      const res = await fetch(`${url}/api/auth/email-exists?email=${encodeURIComponent(e)}`, { signal: controller.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error('offline');
      const json = await res.json().catch(()=>({ exists:false }));
      return !!json?.exists;
    } catch {
      // Fallback: no backend → no bloquear. Devolver true para no frenar el flujo.
      return true;
    }
  };

  const sendReset = async () => {
    try {
      setErr(null); setNotice(null); setLoading(true);
      if (!email) throw new Error(locale==='es' ? 'Ingresa tu email' : 'Enter your email');
      const exists = await emailExists(email);
      if (!exists) {
        throw new Error(locale==='es' ? 'Este correo no está registrado.' : 'This email is not registered.');
      }
      // Comprobar si el email existe en auth mediante signInWithOtp (errores comunes)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + '#login' }
      } as any);
      if (error) {
        const msg = (error as any)?.message || '';
        // Supabase suele devolver "For security reasons, we can't tell you whether the email exists or not".
        // Para UX, tratamos dominios comunes de error y lo mostramos como "no registrado".
        if (/email.*not.*found|user.*not.*found|not.*exist/i.test(msg)) {
          throw new Error(locale==='es' ? 'Este correo no está registrado.' : 'This email is not registered.');
        }
        // Si el proveedor del correo es social-only (p.ej. Google), igual enviamos magic link; si falla, mostramos genérico
        throw new Error((locale==='es' ? 'No se pudo enviar el enlace. Revisa el correo o usa Google/Apple.' : 'Could not send the link. Check the email or use Google/Apple.'));
      }
      setNotice(locale==='es' ? 'Te enviamos un enlace para iniciar sesión. Revisa tu correo.' : 'We sent you a login link. Check your email.');
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  };

  const resendConfirmation = async () => {
    if (!pendingEmail || resending || resendCooldown > 0) return;
    try {
      setErr(null); setNotice(null); setResending(true);
      const { error } = await (supabase as any).auth.resend({ type: 'signup', email: pendingEmail });
      // Si ya está confirmada o hay problema, enviamos magic link para ingresar igual
      if (error) {
        await supabase.auth.signInWithOtp({
          email: pendingEmail,
          options: { emailRedirectTo: window.location.origin + '#login' }
        } as any);
      }
      setNotice(locale==='es' ? 'Correo reenviado. Revisa tu bandeja o spam.' : 'Email resent. Check your inbox or spam.');
      setResendCooldown(59);
    } catch (e:any) {
      setErr(e.message || (locale==='es' ? 'No se pudo reenviar el correo.' : 'Could not resend email.'));
    } finally {
      setResending(false);
    }
  };

  const changePassword = async () => {
    try {
      setErr(null); setLoading(true);
      if (!password || password.length < 6) throw new Error('Mínimo 6 caracteres');
      if (password !== password2) throw new Error('Las contraseñas no coinciden');
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      if (data?.user) onLoggedIn?.();
    } catch (e:any) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-start justify-center">
      <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-100 card-appear">
        <PasswordStrengthStyles />
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-gradient">
            {mode === "signup" ? (locale==='es' ? "Crea tu cuenta" : 'Create your account') : mode==='reset' ? (locale==='es' ? 'Recupera tu contraseña' : 'Recover your password') : mode==='change' ? (locale==='es' ? 'Crea una nueva contraseña' : 'Create a new password') : (locale==='es' ? "Inicia sesión" : 'Log in')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "signup" ? (locale==='es' ? "Regístrate con email o usa un proveedor" : 'Sign up with email or use a provider') : mode==='reset' ? (locale==='es' ? 'Te enviaremos un enlace por email' : 'We will email you a link') : mode==='change' ? (locale==='es' ? 'Ingresa y confirma tu nueva contraseña' : 'Enter and confirm your new password') : (locale==='es' ? "Inicia sesión para continuar" : 'Log in to continue')}
          </p>
        </div>

        {/* Pantalla de confirmación */}
        {mode === ('confirm' as any) && (
          <div className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">✅</div>
            <div className="text-green-700 font-semibold mb-2">{locale==='es' ? 'Confirma tu correo' : 'Confirm your email'}</div>
            <div className="text-sm text-gray-600 mb-4">
              {locale==='es' ? `Te enviamos un enlace a ${pendingEmail}. Abre tu correo para activar tu cuenta.` : `We sent a confirmation link to ${pendingEmail}. Open your email to activate your account.`}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={()=>setMode('login')} className="text-sm underline text-gray-700 hover:text-cyan-600 transition-colors">{locale==='es' ? 'Volver a iniciar sesión' : 'Back to log in'}</button>
              <button disabled={resending || resendCooldown>0} onClick={resendConfirmation} className={`text-sm underline ${resending || resendCooldown>0 ? 'text-gray-400 cursor-not-allowed' : 'text-brand-gradient hover:opacity-80 transition-colors'}`}>
                {resending ? (locale==='es' ? 'Enviando…' : 'Sending…') : resendCooldown>0 ? (locale==='es' ? `Reenviar en ${resendCooldown}s` : `Resend in ${resendCooldown}s`) : (locale==='es' ? 'Reenviar correo' : 'Resend email')}
              </button>
            </div>
            {notice && <div className="mt-3 text-sm text-green-600">{notice}</div>}
          </div>
        )}

        {mode !== ('confirm' as any) && (
        <>
        {/* Providers (solo en login/signup) */}
        {(mode==='login' || mode==='signup') && (
          <div className="grid gap-3 mb-5">
            <button
              onClick={() => signInWithProvider("google")}
              className="w-full inline-flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5"/>
              {locale==='es' ? 'Entrar con Google' : 'Sign in with Google'}
            </button>
            <button
              onClick={() => signInWithProvider("apple")}
              className="w-full inline-flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <img src="/apple.png" alt="Apple" className="w-5 h-5" onError={(e:any)=>{ e.currentTarget.src='https://www.svgrepo.com/show/452196/apple.svg'; }} />
              {locale==='es' ? 'Entrar con Apple' : 'Sign in with Apple'}
            </button>
            {mode==='signup' && (
              <button
                onClick={()=>setShowEmailSignup(true)}
                className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {locale==='es' ? 'Registrarse con email' : 'Sign up with email'}
              </button>
            )}
          </div>
        )}

        {(mode==='login' || (mode==='signup' && showEmailSignup)) && (
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">{locale==='es' ? 'o con email' : 'or with email'}</span>
            </div>
          </div>
        )}

        {/* Email form - LOGIN */}
        {mode==='login' && (
        <form className="grid gap-3" onSubmit={(e)=>{ e.preventDefault(); submit(); }}>
          <input
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            placeholder={locale==='es' ? 'email@dominio.com' : 'email@domain.com'}
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            placeholder={locale==='es' ? 'Contraseña' : 'Password'}
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {err && <div className="text-sm text-red-600">{err}</div>}
          {notice && <div className="text-sm text-green-600">{notice}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg btn-brand py-2.5 text-sm font-semibold disabled:opacity-60 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            {loading ? (locale==='es' ? 'Procesando…' : 'Processing…') : (mode === 'signup' ? (locale==='es' ? 'Crear cuenta' : 'Create account') : (locale==='es' ? 'Entrar' : 'Log in'))}
          </button>
          <button type="button" onClick={sendReset} className="text-xs text-gray-600 hover:underline hover:text-cyan-600 transition-colors mt-1 w-fit">
            {locale==='es' ? 'Enviarme un enlace de acceso por email' : 'Send me a login link via email'}
          </button>
        </form>
        )}

        {/* Email form - SIGNUP */}
        {mode==='signup' && showEmailSignup && (
        <form className="grid gap-3" onSubmit={(e)=>{ e.preventDefault(); submit(); }}>
          <input className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder={locale==='es' ? 'email@dominio.com' : 'email@domain.com'} value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" />
          <div className="relative">
            <input className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder={locale==='es' ? 'Contraseña' : 'Password'} type={showPw ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" />
            <button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-800">{showPw ? (locale==='es' ? 'Ocultar' : 'Hide') : (locale==='es' ? 'Ver' : 'Show')}</button>
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-lg btn-brand py-2.5 text-sm font-semibold disabled:opacity-60">{loading ? (locale==='es' ? 'Procesando…' : 'Processing…') : (locale==='es' ? 'Crear cuenta' : 'Create account')}</button>
          {/* Indicador de fuerza */}
          <PasswordStrength password={password} locale={locale} />
        </form>
        )}

        {/* RESET PASSWORD */}
        {mode==='reset' && (
        <div className="grid gap-3">
          <input className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder={locale==='es' ? 'tu@correo.com' : 'you@email.com'} value={email} onChange={(e)=>setEmail(e.target.value)} />
          {err && <div className="text-sm text-red-600">{err}</div>}
          {notice && <div className="text-sm text-green-600">{notice}</div>}
          <button onClick={sendReset} disabled={loading} className="w-full rounded-lg btn-brand py-2.5 text-sm font-semibold disabled:opacity-60">{loading ? (locale==='es' ? 'Enviando…' : 'Sending…') : (locale==='es' ? 'Enviar enlace' : 'Send link')}</button>
        </div>
        )}

        {/* CHANGE PASSWORD */}
        {mode==='change' && (
        <div className="grid gap-3">
          <input className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder={locale==='es' ? 'Nueva contraseña' : 'New password'} type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" />
          <input className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent" placeholder={locale==='es' ? 'Repite la contraseña' : 'Repeat password'} type="password" value={password2} onChange={(e)=>setPassword2(e.target.value)} autoComplete="new-password" />
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button onClick={changePassword} disabled={loading} className="w-full rounded-lg btn-brand py-2.5 text-sm font-semibold disabled:opacity-60">{loading ? (locale==='es' ? 'Actualizando…' : 'Updating…') : (locale==='es' ? 'Guardar nueva contraseña' : 'Save new password')}</button>
        </div>
        )}

        <div className="mt-5 text-center text-sm text-gray-600">
          {mode === "login" && (
            <div className="grid gap-2">
              <span>
                {locale==='es' ? '¿No tienes cuenta? ' : 'No account yet? '}<button onClick={()=>setMode("signup")} className="text-brand-gradient hover:underline">{locale==='es' ? 'Regístrate' : 'Sign up'}</button>
              </span>
              <button onClick={()=>setMode('reset')} className="text-brand-gradient hover:underline">{locale==='es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}</button>
            </div>
          )}
          {mode === 'signup' && (
            <span>
              {locale==='es' ? '¿Ya tienes cuenta? ' : 'Already have an account? '}<button onClick={()=>setMode("login")} className="text-brand-gradient hover:underline">{locale==='es' ? 'Inicia sesión' : 'Log in'}</button>
            </span>
          )}
          {(mode === 'reset' || mode === 'change') && (
            <button onClick={()=>setMode('login')} className="text-brand-gradient hover:underline">{locale==='es' ? 'Volver a iniciar sesión' : 'Back to log in'}</button>
          )}
        </div>

        {/* No mostrar botón de cerrar sesión en pantalla de login/signup */}
        </>
        )}
      </div>
    </div>
  );
}

function PasswordStrength({ password, locale }: { password: string; locale: Locale }) {
  const lenOk = password.length >= 8;
  const upperOk = /[A-Z]/.test(password);
  const numOk = /[0-9]/.test(password);
  const score = (lenOk ? 1 : 0) + (upperOk ? 1 : 0) + (numOk ? 1 : 0);
  const pct = (score / 3) * 100;
  const color = score === 1 ? '#ef4444' : score === 2 ? '#f59e0b' : '#10b981';

  return (
    <div className="mt-2">
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-2" style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 200ms linear' }} />
      </div>
      <ul className="mt-2 text-xs text-gray-600">
        <li>{lenOk ? '✔' : '✖'} {locale==='es' ? 'Al menos 8 caracteres' : 'At least 8 characters'}</li>
        <li>{upperOk ? '✔' : '✖'} {locale==='es' ? 'Una letra mayúscula' : 'One uppercase letter'}</li>
        <li>{numOk ? '✔' : '✖'} {locale==='es' ? 'Un número' : 'One number'}</li>
      </ul>
    </div>
  );
}

function PasswordStrengthStyles() {
  return null;
}
