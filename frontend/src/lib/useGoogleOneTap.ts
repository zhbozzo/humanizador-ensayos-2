import { useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { useSession } from './useSession';

/**
 * Muestra Google One Tap globalmente (estilo Grammarly) si hay CLIENT_ID
 * y el usuario no está autenticado. Al aceptar, inicia sesión en Supabase.
 */
export function useGoogleOneTap(onLoggedIn?: () => void) {
  const { user } = useSession();
  const initialized = useRef(false);

  useEffect(() => {
    if (user) return; // No mostrar si ya hay sesión
    // Evitar interferir en la pantalla de login/signup, donde usamos formularios
    try {
      const h = (window.location.hash || '').toLowerCase();
      if (h.includes('login') || h.includes('signup')) return;
    } catch {}
    if (typeof window !== 'undefined' && !window.location.hostname.endsWith('humaniza.ai')) return;
    const CLIENT_ID: string = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
    if (!CLIENT_ID || initialized.current) return;
    initialized.current = true;

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => {
      try {
        // @ts-ignore
        if (window.google?.accounts?.id) {
          // @ts-ignore
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            auto_select: false,
            cancel_on_tap_outside: false,
            itp_support: true,
            use_fedcm_for_prompt: true,
            callback: async (response: any) => {
              try {
                if (response?.credential) {
                  await supabase.auth.signInWithIdToken({ provider: 'google', token: response.credential });
                  onLoggedIn?.();
                }
              } catch {}
            }
          });
          // One Tap overlay (Google decide posición; típicamente arriba a la derecha)
          // @ts-ignore
          window.google.accounts.id.prompt((n: any) => { try { /* silenciar */ } catch {} });
        }
      } catch {}
    };
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, [user, onLoggedIn]);
}


