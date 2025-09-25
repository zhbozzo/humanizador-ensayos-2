export type Locale = 'es' | 'en';

// Detección básica de idioma del navegador
export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored === 'es' || stored === 'en') return stored;
    const nav = (navigator.languages?.[0] || navigator.language || 'es').toLowerCase();
    if (nav.startsWith('es')) return 'es';
    return 'en';
  } catch {
    return 'es';
  }
}

export function setLocale(locale: Locale) {
  try { localStorage.setItem('locale', locale); } catch {}
  // Disparar evento global para que componentes se actualicen si lo desean
  try { window.dispatchEvent(new CustomEvent('locale-changed', { detail: locale })); } catch {}
}

export const t = (key: string, locale: Locale, params?: Record<string,string|number>) => {
  const dict = DICTS[locale] || DICTS.es;
  let str = (dict as any)[key] || DICTS.es[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
  }
  return str;
};

// Diccionarios mínimos para UI (se puede extender gradualmente)
export const DICTS: Record<Locale, Record<string, string>> = {
  es: {
    nav_humanize: 'Humanizar',
    nav_pricing: 'Precios',
    nav_history: 'Historial',
    nav_login: 'Iniciar sesión',
    nav_try_free: 'Probar gratis',
    footer_product: 'Producto',
    footer_resources: 'Recursos',
    footer_contact: 'Contacto',
    footer_privacy: 'Política de Privacidad',
    footer_terms: 'Términos del Servicio',
    footer_refunds: 'Reembolsos',
    footer_link_humanizer: 'Humanizador',
    footer_link_pricing: 'Precios',
    faq_title: 'FAQ',
  },
  en: {
    nav_humanize: 'Humanize',
    nav_pricing: 'Pricing',
    nav_history: 'History',
    nav_login: 'Log in',
    nav_try_free: 'Try for free',
    footer_product: 'Product',
    footer_resources: 'Resources',
    footer_contact: 'Contact',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_refunds: 'Refunds',
    footer_link_humanizer: 'Humanizer',
    footer_link_pricing: 'Pricing',
    faq_title: 'FAQ',
  }
};


