import { detectLocale } from '../lib/i18n';

export default function Refunds() {
  const locale = detectLocale();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{locale==='es' ? 'Política de Reembolsos' : 'Refund Policy'}</h1>
        <p className="text-sm text-gray-500">{locale==='es' ? 'Última actualización' : 'Last updated'} 01/01/2025</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-8">
        <div className="text-sm font-semibold text-gray-700 mb-2">{locale==='es' ? 'Contenido' : 'Table of Contents'}</div>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
          <li><a href="#digital" className="hover:underline">{locale==='es' ? '1. Suscripciones Digitales' : '1. Digital Subscriptions'}</a></li>
          <li><a href="#eligibility" className="hover:underline">{locale==='es' ? '2. Elegibilidad' : '2. Eligibility'}</a></li>
          <li><a href="#request" className="hover:underline">{locale==='es' ? '3. Cómo Solicitar' : '3. How to Request'}</a></li>
          <li><a href="#processing" className="hover:underline">{locale==='es' ? '4. Procesamiento' : '4. Processing'}</a></li>
          <li><a href="#chargebacks" className="hover:underline">{locale==='es' ? '5. Contracargos' : '5. Chargebacks'}</a></li>
          <li><a href="#contact" className="hover:underline">{locale==='es' ? '6. Contacto' : '6. Contact'}</a></li>
        </ul>
      </div>

      <div className="prose prose-slate">
        <h2 id="digital" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '1. SUSCRIPCIONES DIGITALES' : '1. DIGITAL SUBSCRIPTIONS'}</h2>
        <p>{locale==='es' ? 'Humaniza AI ofrece acceso instantáneo a las funciones digitales tras la compra. Los reembolsos se limitan a las condiciones siguientes.' : 'Humaniza AI provides instant access to digital features after purchase. Refunds are limited to the conditions below.'}</p>

        <h2 id="eligibility" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '2. ELEGIBILIDAD' : '2. ELIGIBILITY'}</h2>
        <ul>
          {locale==='es' ? (
            <>
              <li>Puede solicitar reembolso dentro de 7 días de la primera compra solo si un problema técnico verificado impide el uso y soporte no puede resolverlo.</li>
              <li>Las solicitudes se <strong>evalúan caso por caso</strong>. Podemos pedir logs/capturas. Arrepentimiento sin causa técnica no aplica.</li>
              <li><strong>No hay reembolso</strong> si se usó <strong>25% o más</strong> de las palabras/créditos del período.</li>
              <li>Las renovaciones no son reembolsables una vez iniciado el nuevo ciclo. Derechos locales del consumidor (si aplican) no se ven afectados.</li>
            </>
          ) : (
            <>
              <li>Refunds may be requested within 7 days from first purchase only if a verified technical issue prevents use and cannot be resolved by support.</li>
              <li>Requests are <strong>evaluated case‑by‑case</strong>. We may ask for logs/screenshots. Change of mind without technical cause does not qualify.</li>
              <li><strong>No refunds</strong> if <strong>25% or more</strong> of plan words/credits have been used in the current period.</li>
              <li>Renewals are non‑refundable once a new cycle starts. Local consumer rights (where applicable) remain unaffected.</li>
            </>
          )}
        </ul>

        <h2 id="request" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '3. CÓMO SOLICITAR' : '3. HOW TO REQUEST'}</h2>
        <p>{locale==='es' ? 'Escríbenos a ' : 'Email '}<a href="mailto:contacto@humaniza.ai">contacto@humaniza.ai</a>{locale==='es' ? ' desde el email de tu cuenta con fecha de compra, plan y descripción del problema.' : ' from your account email including purchase date, plan and issue details.'}</p>

        <h2 id="processing" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '4. PROCESAMIENTO' : '4. PROCESSING'}</h2>
        <p>{locale==='es' ? 'Los reembolsos aprobados se emiten al método de pago original vía ' : 'Approved refunds are issued to the original payment method via '}<strong>Paddle</strong>. {locale==='es' ? 'Los plazos bancarios pueden variar.' : 'Bank timelines may apply.'}</p>

        <h2 id="chargebacks" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '5. CONTRACARGOS' : '5. CHARGEBACKS'}</h2>
        <p>{locale==='es' ? 'Iniciar un contracargo puede implicar suspensión temporal hasta su resolución.' : 'Initiating a chargeback may lead to temporary suspension pending resolution.'}</p>

        <h2 id="contact" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '6. CONTACTO' : '6. CONTACT'}</h2>
        <p>{locale==='es' ? 'Correo' : 'Email'}: <a href="mailto:contacto@humaniza.ai">contacto@humaniza.ai</a></p>
      </div>
    </div>
  );
}


