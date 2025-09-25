import { useState, useEffect } from 'react';
import { detectLocale, type Locale } from '../lib/i18n';

type QA = { q: string; a: string };

const FAQS_EN: QA[] = [
  { q: 'How does Humaniza AI work?', a: 'You paste your text and select a plan. Our AI rewrites with a more natural style while preserving meaning and constraints. Results appear instantly and your balance is updated accordingly.' },
  { q: 'Does it bypass Turnitin and other AI checkers?', a: 'We optimize for human-like style, but no tool can guarantee 100% evasion in every scenario. Use responsibly and follow your institution’s policies.' },
  { q: 'How much does it cost?', a: 'See Pricing for Basic, Pro, and Ultra plans with monthly or annual options. Subscriptions are billed via Paddle.' },
  { q: 'What languages are supported?', a: 'We support 20+ languages including English and Spanish. Quality may vary by language and input complexity.' },
  { q: 'Can I humanize long essays?', a: 'Yes. If a single request exceeds your per‑request limit, split the text into smaller chunks and process sequentially.' },
  { q: 'I reached my word limit. How can I extend it?', a: 'Upgrade your plan or switch to annual. You can also wait until your cycle renews to restore credits.' },
  { q: 'Can I see my previous humanizations?', a: 'Your recent outputs are available during the session. For privacy, we do not permanently store your content beyond operational needs.' },
  { q: 'How do I cancel my subscription?', a: 'You can cancel anytime from your account. Access continues until the end of the paid period. See Refund Policy for details.' },
  { q: 'Does Google penalize AI‑generated content?', a: 'Google values helpful content for users. Our goal is natural style; however, rankings depend on many factors beyond style alone.' },
];

const FAQS_ES: QA[] = [
  { q: '¿Cómo funciona Humaniza AI?', a: 'Pegas tu texto y eliges un plan. Nuestra IA reescribe con estilo más natural manteniendo significado y restricciones. El resultado aparece al instante y tu balance se actualiza.' },
  { q: '¿Bypassea Turnitin u otros detectores?', a: 'Optimizamos el estilo para sonar humano, pero ningún sistema garantiza 100% en todos los escenarios. Úsalo responsablemente y respeta políticas de tu institución.' },
  { q: '¿Cuánto cuesta?', a: 'Visita Precios para ver Basic, Pro y Ultra en mensual o anual. Las suscripciones se cobran con Paddle.' },
  { q: '¿Qué idiomas soporta?', a: 'Más de 20 idiomas, incluyendo español e inglés. La calidad puede variar según idioma y complejidad del texto.' },
  { q: '¿Puedo humanizar ensayos largos?', a: 'Sí. Si una petición excede tu límite por solicitud, divide el texto en partes y procesa en secuencia.' },
  { q: 'Llegué a mi límite de palabras. ¿Cómo lo extiendo?', a: 'Mejora tu plan o cambia a anual. También puedes esperar a la renovación del ciclo.' },
  { q: '¿Puedo ver humanizaciones anteriores?', a: 'Tus salidas recientes están disponibles durante la sesión. Por privacidad, no almacenamos permanentemente tu contenido más allá de lo operacional.' },
  { q: '¿Cómo cancelo mi suscripción?', a: 'Puedes cancelar en cualquier momento desde tu cuenta. Mantienes acceso hasta el fin del período pagado. Revisa la Política de Reembolsos.' },
  { q: '¿Google penaliza contenido generado por IA?', a: 'Google valora contenido útil. Nuestro objetivo es un estilo natural; el posicionamiento depende además de muchos factores.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [locale, setLocale] = useState<Locale>(detectLocale());
  useEffect(() => {
    const handler = (e: any) => setLocale((e?.detail as Locale) || detectLocale());
    window.addEventListener('locale-changed', handler as any);
    return () => window.removeEventListener('locale-changed', handler as any);
  }, []);
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">{locale==='es' ? 'Preguntas Frecuentes' : 'FAQ'}</h1>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {(locale==='es' ? FAQS_ES : FAQS_EN).map((item, idx) => {
          const open = openIndex === idx;
          return (
            <div key={idx} className="border-b last:border-b-0 border-gray-200">
              <button
                onClick={()=>setOpenIndex(open ? null : idx)}
                className="w-full text-left px-6 py-4 flex items-center justify-between transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50"
                aria-expanded={open}
              >
                <span className="text-gray-900 font-medium">{item.q}</span>
                <span className={`ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-transform duration-300 ${open ? 'rotate-180 bg-gray-50' : 'bg-white'}`}>▾</span>
              </button>
              <div className={`px-6 grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} overflow-hidden`}
                   aria-hidden={!open}>
                <div className="min-h-0">
                  <div className="pb-5 pt-1 text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


