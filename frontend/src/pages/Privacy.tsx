import { detectLocale } from '../lib/i18n';

export default function Privacy() {
  const locale = detectLocale();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{locale==='es' ? 'Política de Privacidad' : 'Privacy Policy'}</h1>
        <p className="text-sm text-gray-500">{locale==='es' ? 'Última actualización' : 'Last updated'} 01/01/2025</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-8">
        <div className="text-sm font-semibold text-gray-700 mb-2">{locale==='es' ? 'Contenido' : 'Table of Contents'}</div>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
          <li><a href="#collect" className="hover:underline">{locale==='es' ? '1. Información que Recopilamos' : '1. Information We Collect'}</a></li>
          <li><a href="#use" className="hover:underline">{locale==='es' ? '2. Cómo Usamos tu Información' : '2. How We Use Your Information'}</a></li>
          <li><a href="#share" className="hover:underline">{locale==='es' ? '3. Cómo Compartimos tu Información' : '3. Sharing Your Information'}</a></li>
          <li><a href="#cookies" className="hover:underline">{locale==='es' ? '4. Cookies y Seguimiento' : '4. Cookies and Tracking'}</a></li>
          <li><a href="#security" className="hover:underline">{locale==='es' ? '5. Seguridad' : '5. Security'}</a></li>
          <li><a href="#choices" className="hover:underline">{locale==='es' ? '6. Tus Derechos y Opciones' : '6. Your Choices'}</a></li>
          <li><a href="#children" className="hover:underline">{locale==='es' ? '7. Privacidad de Menores' : '7. Children’s Privacy'}</a></li>
          <li><a href="#transfers" className="hover:underline">{locale==='es' ? '8. Transferencias Internacionales' : '8. International Transfers'}</a></li>
          <li><a href="#changes" className="hover:underline">{locale==='es' ? '9. Cambios a esta Política' : '9. Changes to This Policy'}</a></li>
          <li><a href="#contact" className="hover:underline">{locale==='es' ? '10. Contacto' : '10. Contact Us'}</a></li>
        </ul>
      </div>

      <div className="prose prose-slate">
        <p>{locale==='es' ? 'Humaniza AI ("Humaniza", "nosotros") opera el sitio web y servicios de Humaniza AI (los "Servicios"). Esta Política explica cómo recopilamos, usamos y compartimos información. Si no estás de acuerdo, no uses los Servicios.' : 'Humaniza AI ("Humaniza", "we") operates the Humaniza AI website and services (the "Services"). This Policy explains how we collect, use, and share information. If you do not agree, please do not use the Services.'}</p>

        <h2 id="collect" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '1. INFORMACIÓN QUE RECOPILAMOS' : '1. INFORMATION WE COLLECT'}</h2>
        <ul>
          {locale==='es' ? (
            <>
              <li><strong>Cuenta</strong>: nombre, email, metadatos de autenticación (vía Supabase u otro proveedor).</li>
              <li><strong>Uso</strong>: texto/contenido que envías para procesar, uso de plan/cuotas y logs necesarios para operar.</li>
              <li><strong>Técnica</strong>: IP, info de dispositivo/navegador, idioma, y cookies/identificadores para sesión, preferencias, analítica y antifraude.</li>
              <li><strong>Facturación</strong>: metadatos limitados de Paddle (país, moneda, identificadores de transacción/recibo, estado de suscripción). No almacenamos números completos de tarjeta.</li>
            </>
          ) : (
            <>
              <li><strong>Account</strong>: name, email, authentication metadata (via Supabase or similar identity provider).</li>
              <li><strong>Usage</strong>: text/content you submit for processing, plan usage/quotas, logs necessary to operate the service.</li>
              <li><strong>Technical</strong>: IP address, device/browser info, locale, and cookies/identifiers for session, preferences, analytics and fraud prevention.</li>
              <li><strong>Billing</strong>: limited billing metadata from Paddle (e.g., country, currency, transaction/receipt identifiers, subscription status). We do not store full card numbers.</li>
            </>
          )}
        </ul>

        <h2 id="use" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '2. CÓMO USAMOS TU INFORMACIÓN' : '2. HOW WE USE YOUR INFORMATION'}</h2>
        <ul>
          {locale==='es' ? (
            <>
              <li>Prestar, mantener y asegurar los Servicios; operar funciones como procesamiento y cuotas.</li>
              <li>Facturación y suscripciones vía <strong>Paddle</strong> (MoR): cobros, impuestos, facturas, reembolsos y antifraude.</li>
              <li>Comunicaciones de servicio (cuenta, facturación, novedades) y marketing opcional (opt‑out).</li>
              <li>Investigación, analítica y mejora de producto (agregado/anónimo cuando sea posible).</li>
              <li>Cumplimiento legal y aplicación de términos; prevención de abuso.</li>
            </>
          ) : (
            <>
              <li>Provide, maintain and secure the Services; operate features like content processing and quotas.</li>
              <li>Billing & subscriptions via <strong>Paddle</strong> (our Merchant of Record): payment processing, tax calculation, invoicing, refunds, and fraud prevention.</li>
              <li>Service communications (e.g., account, billing, product updates) and optional marketing (you can opt out).</li>
              <li>Research, analytics, and product improvement (aggregated/anonymous where possible).</li>
              <li>Compliance with legal obligations and enforcement of terms; prevention of abuse.</li>
            </>
          )}
        </ul>

        <h2 id="share" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '3. CÓMO COMPARTIMOS TU INFORMACIÓN' : '3. SHARING YOUR INFORMATION'}</h2>
        <ul>
          {locale==='es' ? (
            <>
              <li>Proveedores/sub‑procesadores: p. ej., Paddle (pagos/MoR), Supabase (hosting/auth/db), analítica, email y cloud. Tratan datos bajo acuerdos y salvaguardas.</li>
              <li>Legal: para cumplir la ley, proteger derechos/seguridad o prevenir fraude.</li>
              <li>Transferencias de negocio: en fusiones, adquisiciones o ventas de activos, con aviso si corresponde.</li>
            </>
          ) : (
            <>
              <li>Service providers / sub‑processors: e.g., Paddle (payments/MoR), Supabase (hosting/auth/db), analytics, email, and cloud providers. They process data under agreements and appropriate safeguards.</li>
              <li>Legal: to comply with law, protect rights, safety, or prevent fraud.</li>
              <li>Business transfers: as part of merger, acquisition or asset sale, with notice as required.</li>
            </>
          )}
        </ul>

        <h2 id="cookies" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '4. COOKIES Y SEGUIMIENTO' : '4. COOKIES AND TRACKING'}</h2>
        <p>We use cookies or similar tech for login sessions, preferences, analytics, and fraud prevention. You can disable non‑essential cookies; some features may not work. Where required, we request consent for non‑essential cookies.</p>

        <h2 id="security" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '5. SEGURIDAD' : '5. SECURITY'}</h2>
        <p>We apply industry‑standard safeguards (encryption in transit, access controls, least privilege). No method is 100% secure.</p>

        <h2 id="choices" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '6. TUS DERECHOS Y OPCIONES' : '6. YOUR CHOICES'}</h2>
        <ul>
          <li>Access, update or delete your account data via Profile settings or by contacting us.</li>
          <li>Unsubscribe from marketing via email links (service and transactional emails will continue).</li>
          <li>Privacy rights: Depending on your location (e.g., EEA/UK/California), you may request access/portability, correction, deletion, restriction/objection, or opt‑out of sale/share or targeted advertising (where applicable). Contact us to exercise rights.</li>
        </ul>

        <h2 id="children" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '7. PRIVACIDAD DE MENORES' : '7. CHILDREN’S PRIVACY'}</h2>
        <p>Services are not directed to children under 18. If we learn we collected data from a minor, we will delete it.</p>

        <h2 id="transfers" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '8. TRANSFERENCIAS INTERNACIONALES' : '8. INTERNATIONAL TRANSFERS'}</h2>
        <p>Data may be processed outside your country. When transferring personal data internationally, we rely on appropriate safeguards such as Standard Contractual Clauses (SCCs) and vendor certifications. Paddle, Supabase and other providers may store data in the EU, US or other regions.</p>

        <h2 className="uppercase tracking-wide font-extrabold">{locale==='es' ? '9. RETENCIÓN DE DATOS' : '9. DATA RETENTION'}</h2>
        <p>We retain personal data for as long as needed to provide the Services, comply with legal obligations, resolve disputes, and enforce agreements. Content you submit for processing is handled ephemerally and not stored permanently except minimal logs needed for abuse prevention and billing verification.</p>

        <h2 id="changes" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '10. CAMBIOS A ESTA POLÍTICA' : '10. CHANGES TO THIS POLICY'}</h2>
        <p>{locale==='es' ? 'Podemos actualizar esta Política; la fecha indica la última versión. Notificaremos cambios materiales por el Servicio o email.' : 'We may update this Policy; the date above shows the latest version. Material changes will be notified via the Service or email.'}</p>

        <h2 id="contact" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '11. CONTACTO' : '11. CONTACT US'}</h2>
        <p>{locale==='es' ? 'Correo' : 'Email'}: <a href="mailto:contacto@humaniza.ai">contacto@humaniza.ai</a></p>
      </div>
    </div>
  );
}


