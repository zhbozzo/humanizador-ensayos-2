import { detectLocale, t } from '../lib/i18n';

export default function Footer() {
  const locale = detectLocale();
  return (
    <footer className="mt-12 border-t border-gray-200 py-10 text-sm text-gray-600">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-semibold text-gray-900 mb-2">{t('footer_product', locale)}</div>
          <ul className="space-y-1">
            <li><a href="#home" className="hover:underline">{t('footer_link_humanizer', locale)}</a></li>
            <li><a href="#pricing" className="hover:underline">{t('footer_link_pricing', locale)}</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-gray-900 mb-2">{t('footer_resources', locale)}</div>
          <ul className="space-y-1">
            <li><a href="#faq" className="hover:underline">FAQ</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-gray-900 mb-2">{t('footer_contact', locale)}</div>
          <ul className="space-y-1">
            <li><a href="mailto:contacto@humaniza.ai" className="hover:underline">contacto@humaniza.ai</a></li>
            <li className="flex flex-wrap gap-2">
              <a href="#privacy" className="hover:underline">{t('footer_privacy', locale)}</a>
              <span>·</span>
              <a href="#terms" className="hover:underline">{t('footer_terms', locale)}</a>
              <span>·</span>
              <a href="#refunds" className="hover:underline">{t('footer_refunds', locale)}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-8">Humaniza AI · © {new Date().getFullYear()}</div>
    </footer>
  );
}


