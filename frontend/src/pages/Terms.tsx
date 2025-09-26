import { detectLocale } from '../lib/i18n';

export default function Terms() {
  const locale = detectLocale();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{locale==='es' ? 'Términos del Servicio' : 'Terms of Service'}</h1>
        <p className="text-sm text-gray-500">{locale==='es' ? 'Última actualización' : 'Last updated'}: 01/01/2025</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-8">
        <div className="text-sm font-semibold text-gray-700 mb-2">{locale==='es' ? 'Contenido' : 'Table of Contents'}</div>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
          <li><a href="#servicios" className="hover:underline">1. Nuestros servicios</a></li>
          <li><a href="#propiedad" className="hover:underline">2. Propiedad intelectual</a></li>
          <li><a href="#usuario" className="hover:underline">3. Declaraciones del usuario</a></li>
          <li><a href="#registro" className="hover:underline">4. Registro</a></li>
          <li><a href="#pagos" className="hover:underline">5. Compras y pagos</a></li>
          <li><a href="#cancelacion" className="hover:underline">6. Cancelación</a></li>
          <li><a href="#vigencia" className="hover:underline">7. Vigencia de la suscripción</a></li>
          <li><a href="#prohibidas" className="hover:underline">8. Actividades prohibidas</a></li>
          <li><a href="#contenido" className="hover:underline">9. Contenido del usuario</a></li>
          <li><a href="#terceros" className="hover:underline">10. Enlaces a terceros</a></li>
          <li><a href="#gestion" className="hover:underline">11. Gestión del servicio</a></li>
          <li><a href="#privacidad" className="hover:underline">12. Privacidad</a></li>
          <li><a href="#copyright" className="hover:underline">13. Derechos de autor</a></li>
          <li><a href="#interrupciones" className="hover:underline">14. Modificaciones e interrupciones</a></li>
          <li><a href="#ley" className="hover:underline">15. Ley aplicable y disputas</a></li>
          <li><a href="#descargo" className="hover:underline">16. Descargo de responsabilidad</a></li>
          <li><a href="#limite" className="hover:underline">17. Limitación de responsabilidad</a></li>
          <li><a href="#indemnizacion" className="hover:underline">18. Indemnización</a></li>
          <li><a href="#reembolsos" className="hover:underline">19. Reembolsos</a></li>
          <li><a href="#contacto" className="hover:underline">20. Contacto</a></li>
        </ul>
      </div>

      <div className="prose prose-slate">
        <p>{locale==='es' ? 'Este acuerdo se celebra entre tú ("tú") y ' : 'This agreement is between you ("you") and '}<strong>Humaniza AI</strong>{locale==='es' ? ' ("nosotros"). Al acceder o usar nuestros servicios de humanización de texto (los "Servicios"), aceptas estos Términos.' : ' ("we"). By accessing or using our text‑humanization services (the "Services"), you agree to these Terms.'}</p>

        <h2 id="servicios" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '1. NUESTROS SERVICIOS' : '1. OUR SERVICES'}</h2>
        <p>Humaniza AI ofrece herramientas impulsadas por IA para reescribir texto con un estilo más humano. No está permitido su uso donde lo prohíba la ley. Eres responsable de cumplir la normativa local.</p>

        <h2 id="propiedad" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '2. PROPIEDAD INTELECTUAL' : '2. INTELLECTUAL PROPERTY'}</h2>
        <p>Somos titulares o licenciatarios del contenido, software, diseños y marcas. Te otorgamos una licencia limitada, no exclusiva e intransferible para uso personal o interno.</p>

        <h2 id="usuario" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '3. DECLARACIONES DEL USUARIO' : '3. USER REPRESENTATIONS'}</h2>
        <ul>
          <li>La información que registras es veraz y la mantendrás actualizada.</li>
          <li>Tienes al menos 18 años y capacidad legal para aceptar estos Términos.</li>
          <li>Usarás los Servicios de forma lícita y respetando estos Términos.</li>
        </ul>

        <h2 id="registro" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '4. REGISTRO' : '4. REGISTRATION'}</h2>
        <p>Eres responsable de tus credenciales y de toda actividad en tu cuenta.</p>

        <h2 id="pagos" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '5. COMPRAS Y PAGOS' : '5. PURCHASES & PAYMENTS'}</h2>
        <p>Las suscripciones y cobros se procesan mediante nuestro proveedor de pagos <strong>Paddle</strong>. Al completar un checkout aceptas los Términos de Paddle y nos autorizas a iniciar cargos recurrentes hasta que canceles. No almacenamos datos completos de tarjeta; el procesamiento se gestiona en la plataforma de Paddle.</p>
        <ul>
          <li><strong>Impuestos y moneda</strong>: Los importes pueden incluir impuestos indirectos según tu jurisdicción. La moneda y el total se muestran en el checkout.</li>
          <li><strong>Renovación automática</strong>: A menos que canceles antes del fin del ciclo, la suscripción se renueva al precio vigente del plan.</li>
          <li><strong>Fallas de pago</strong>: Si un cobro falla, podremos reintentar y/o limitar el acceso hasta regularizar.</li>
          <li><strong>Cambios de plan</strong>: Upgrades aplican de inmediato (podrá haber prorrateo según reglas de Paddle); los downgrades se aplican al próximo ciclo.</li>
          <li><strong>Precios</strong>: Podemos actualizar precios y/o beneficios; los cambios rigen en futuras renovaciones previo aviso razonable.</li>
          <li><strong>Chargebacks</strong>: Solicitudes de contracargo pueden conllevar suspensión preventiva del servicio mientras se resuelve la disputa.</li>
        </ul>

        <h2 id="cancelacion" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '6. CANCELACIÓN' : '6. CANCELLATION'}</h2>
        <p>Puedes cancelar en cualquier momento desde tu cuenta o portal de facturación. Salvo que se indique lo contrario, mantendrás acceso hasta el final del período pagado.</p>

        <h2 id="vigencia" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '7. VIGENCIA DE LA SUSCRIPCIÓN' : '7. SUBSCRIPTION TERM'}</h2>
        <p>Las suscripciones son por períodos mensuales o anuales y se renuevan automáticamente. Los <em>créditos/palabras</em> asignados son para uso dentro del ciclo; no se acumulan a períodos posteriores salvo que se indique.</p>
        <ul>
          <li><strong>Resets</strong>: El saldo se restablece en la fecha de renovación.</li>
          <li><strong>Suspensión</strong>: Podemos suspender o limitar acceso en casos de abuso, impago o uso que afecte la estabilidad del servicio.</li>
          <li><strong>Funciones beta</strong>: Podemos ofrecer funciones en beta sin garantías y con cambios frecuentes.</li>
        </ul>

        <h2 id="prohibidas" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '8. ACTIVIDADES PROHIBIDAS' : '8. PROHIBITED ACTIVITIES'}</h2>
        <ul>
          <li>Scraping no autorizado, acceso automatizado abusivo o elusión de seguridad.</li>
          <li>Subir malware o material que infrinja derechos de terceros.</li>
          <li>Uso para deshonestidad académica o para evadir políticas institucionales.</li>
        </ul>

        <h2 id="contenido" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '9. CONTENIDO DEL USUARIO' : '9. USER CONTENT'}</h2>
        <p>Conservas la titularidad de tu contenido. Nos concedes una licencia limitada para procesarlo a efectos de prestar, mantener y mejorar los Servicios (incluyendo medidas de seguridad, anti‑abuso y calidad). Podremos generar métricas agregadas y anónimas (por ejemplo, conteo de palabras) sin identificarte.</p>
        <p><strong>Retención</strong>: El texto que envías se procesa de forma efímera y no se conserva de manera permanente, salvo registros mínimos necesarios para auditoría, facturación y prevención de abuso durante un tiempo razonable.</p>

        <h2 id="terceros" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '10. ENLACES A TERCEROS' : '10. THIRD‑PARTY LINKS'}</h2>
        <p>No nos hacemos responsables del contenido o prácticas de sitios de terceros enlazados.</p>

        <h2 id="gestion" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '11. GESTIÓN DEL SERVICIO' : '11. SERVICE MANAGEMENT'}</h2>
        <p>Podemos supervisar y restringir el acceso para proteger a los usuarios y la plataforma.</p>

        <h2 id="privacidad" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '12. PRIVACIDAD' : '12. PRIVACY'}</h2>
        <p>Consulta nuestra <a href="/privacy">Política de Privacidad</a> para saber cómo tratamos tus datos. Los pagos se gestionan con <strong>Paddle</strong>; no almacenamos datos completos de tarjeta.</p>

        <h2 id="copyright" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '13. DERECHOS DE AUTOR' : '13. COPYRIGHT'}</h2>
        <p>Si crees que algún material infringe derechos, escribe a <a href="mailto:contacto@humaniza.ai">contacto@humaniza.ai</a> con detalles suficientes.</p>

        <h2 id="interrupciones" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '14. MODIFICACIONES E INTERRUPCIONES' : '14. MODIFICATIONS & INTERRUPTIONS'}</h2>
        <p>Podemos actualizar, modificar o interrumpir los Servicios. Procuraremos minimizar interrupciones, pero no somos responsables por pérdidas derivadas de caídas razonables, mantenimiento o eventos fuera de nuestro control.</p>

        <h2 id="ley" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '15. LEY APLICABLE Y DISPUTAS' : '15. GOVERNING LAW & DISPUTES'}</h2>
        <p>Intentaremos resolver disputas de buena fe durante 30 días tras notificación escrita. Si no fuera posible, las controversias podrán someterse a arbitraje <em>individual</em> donde la ley lo permita. Estos Términos se rigen por la ley aplicable de tu jurisdicción, salvo normas imperativas distintas.</p>

        <h2 id="descargo" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '16. DESCARGO DE RESPONSABILIDAD' : '16. DISCLAIMER'}</h2>
        <p>LOS SERVICIOS SE OFRECEN "TAL CUAL" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍAS DE NINGÚN TIPO EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY.</p>

        <h2 id="limite" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '17. LIMITACIÓN DE RESPONSABILIDAD' : '17. LIMITATION OF LIABILITY'}</h2>
        <p>EN LA MÁXIMA MEDIDA PERMITIDA, NUESTRA RESPONSABILIDAD TOTAL SE LIMITA A LOS IMPORTES PAGADOS POR TI EN LOS 12 MESES ANTERIORES AL HECHO QUE DÉ LUGAR A LA RECLAMACIÓN.</p>

        <h2 id="indemnizacion" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '18. INDEMNIZACIÓN' : '18. INDEMNIFICATION'}</h2>
        <p>Nos indemnizarás frente a reclamaciones derivadas de tu uso indebido de los Servicios o del incumplimiento de estos Términos.</p>

        <h2 id="reembolsos" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '19. REEMBOLSOS' : '19. REFUNDS'}</h2>
        <p>Consulta la <a href="/refunds">Política de Reembolsos</a>. No se realizan reembolsos cuando se haya consumido el 25% o más de los créditos del plan.</p>

        <h2 id="contacto" className="uppercase tracking-wide font-extrabold">{locale==='es' ? '20. CONTACTO' : '20. CONTACT'}</h2>
        <p>{locale==='es' ? 'Correo' : 'Email'}: <a href="mailto:contacto@humaniza.ai">contacto@humaniza.ai</a></p>
      </div>
    </div>
  );
}


