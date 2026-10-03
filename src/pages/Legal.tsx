import React, { useState } from 'react';
import { ShieldCheck, Scale, Lock, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import './Legal.css';

const Legal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'privacidad' ? 'privacidad' : searchParams.get('tab') === 'dmca' ? 'dmca' : 'terminos';
  const [activeTab, setActiveTab] = useState<'terminos' | 'privacidad' | 'dmca'>(initialTab);

  return (
    <div className="legal-page fade-in">
      <div className="legal-container">
        
        {/* Header Legal Arcade Card */}
        <article className="legal-hero-card">
          <div className="legal-hero-badge">
            <ShieldCheck size={16} /> Términos Legales & Protección de Derechos
          </div>
          <h1 className="legal-hero-title">Aviso Legal, Privacidad y Política DMCA</h1>
          <p className="legal-hero-desc">
            Conoce en detalle los términos de servicio, uso de contenido de terceros bajo el marco de Uso Justo (Fair Use), tratamiento de datos personales y nuestro procedimiento expreso de atención a reclamos de derechos de autor.
          </p>
        </article>

        {/* Tabs Selector */}
        <div className="legal-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('terminos')}
            className={`legal-tab-btn ${activeTab === 'terminos' ? 'active-terminos' : ''}`}
          >
            <Scale size={18} /> Términos de Servicio y Uso Justo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacidad')}
            className={`legal-tab-btn ${activeTab === 'privacidad' ? 'active-privacidad' : ''}`}
          >
            <Lock size={18} /> Política de Privacidad
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dmca')}
            className={`legal-tab-btn ${activeTab === 'dmca' ? 'active-dmca' : ''}`}
          >
            <AlertTriangle size={18} /> Protocolo DMCA / Retiro de Contenido
          </button>
        </div>

        {/* Tabs Content Main Card */}
        <div className="legal-content-card">

          {/* TAB 1: TERMINOS DE SERVICIO & FAIR USE */}
          {activeTab === 'terminos' && (
            <>
              <h2 className="legal-section-title">
                <Scale size={24} style={{ color: 'var(--cyan)' }} /> 1. Términos de Servicio y Propiedad Intelectual de Terceros
              </h2>

              <p>
                El sitio web <strong>EvilTokkii</strong> (en adelante, "la Plataforma") opera como un portal independiente de entretenimiento, noticias, actividades interactivas, trivias y difusión para la comunidad gaming. Al acceder o utilizar la Plataforma, aceptas expresamente cumplir con las condiciones estipuladas en este documento.
              </p>

              <h3 className="legal-sub-title">1.1. Uso de Contenido de Terceros y Marcas Registradas</h3>
              <p>
                La Plataforma hace referencia, muestra y utiliza nombres, logotipos, carátulas, imágenes promocionales, fragmentos audiovisuales y marcas registradas pertenecientes a diversas empresas de entretenimiento, distribuidores y desarrolladores de videojuegos (incluyendo, entre otros: Nintendo Co., Ltd., Sony Interactive Entertainment, Microsoft Corporation, Ubisoft, Activision Blizzard, Electronic Arts, Capcom, Bandai Namco, etc.).
              </p>
              
              <div className="legal-callout-card callout-cyan">
                <strong>Declaración Expresa de No Afiliación:</strong> EvilTokkii es un proyecto fan-made independiente y <strong>NO posee ningún vínculo, patrocinio, afiliación, aprobación oficial ni licencia directa</strong> otorgada por ninguna de las marcas o empresas de videojuegos mencionadas. Todas las marcas registradas, nombres comercializados y contenidos protegidos son propiedad exclusiva de sus respectivos dueños.
              </div>

              <h3 className="legal-sub-title">1.2. Doctrina de Uso Justo (Fair Use Disclaimer)</h3>
              <p>
                El material visual y promocional desplegado en nuestras trivias, minijuegos y artículos informativos (tales como portadas sin logos, siluetas, marcas corporativas o fragmentos de sonido) tiene como <strong>único propósito</strong> la transformación con fines educativos, informativos, de trivia temática, crítica y entretenimiento interactivo comunitario. Dicho uso se ampara bajo los principios universales de <strong>Fair Use (Uso Justo)</strong> estipulados en la legislación internacional y la Sección 107 del Acto de Derechos de Autor (Copyright Act).
              </p>

              <h3 className="legal-sub-title">1.3. Limitación de Responsabilidad</h3>
              <p>
                EvilTokkii y sus administradores no asumen responsabilidad alguna por pérdidas, daños emergentes o disputas derivadas de la interrupción del servicio, cambios en API de terceros, o de la visualización de contenidos. El sistema de puntos e incentivos dentro de los minijuegos carece de valor monetario en el mercado real y no constituye un sistema de apuestas de dinero ni juego de azar regulado.
              </p>
            </>
          )}

          {/* TAB 2: POLITICA DE PRIVACIDAD */}
          {activeTab === 'privacidad' && (
            <>
              <h2 className="legal-section-title">
                <Lock size={24} style={{ color: '#00d27f' }} /> 2. Política de Privacidad y Tratamiento de Datos
              </h2>

              <p>
                Nos tomamos muy en serio la privacidad de nuestros usuarios y visitantes. Esta política describe la información que recopilamos, cómo se utiliza y cómo se protege dentro de nuestra plataforma.
              </p>

              <h3 className="legal-sub-title">2.1. Información Recopilada</h3>
              <ul className="legal-list">
                <li><strong>Autenticación con Twitch:</strong> Cuando inicias sesión mediante OAuth2 con Twitch o proveedores compatibles, únicamente recibimos tu identificador público (<code>user_id</code>), nombre de usuario (<code>username</code>) y la URL de tu avatar público.</li>
                <li><strong>Progreso e Historial de Minijuegos:</strong> Guardamos de forma segura las puntuaciones, registros diarios de partidas e historial de puntos para actualizar el marcador global comunitario.</li>
                <li><strong>Datos Técnicos Anónimos:</strong> Podremos utilizar contadores estadísticos estándar (Google Analytics / Cloudflare Web Analytics) para analizar el volumen de tráfico sin almacenar cookies invasivas ni vender datos personales.</li>
              </ul>

              <h3 className="legal-sub-title">2.2. No Comercialización de Datos</h3>
              <div className="legal-callout-card callout-green">
                <strong>Compromiso Absoluto:</strong> EvilTokkii <strong>NUNCA venderá, alquilará, compartirá ni transferirá información personal</strong> o identificadores de usuarios a agencias publicitarias, brokers de datos o terceros comerciales.
              </div>

              <h3 className="legal-sub-title">2.3. Control de Tu Cuenta y Eliminación de Datos</h3>
              <p>
                Cualquier usuario tiene derecho a solicitar la desvinculación de su cuenta o la eliminación completa de sus puntuaciones e historial en la plataforma enviando una solicitud mediante nuestros canales de contacto en Discord u oficiales.
              </p>

              <div className="legal-callout-card callout-cyan" style={{ marginTop: '0.5rem' }}>
                <h3 className="callout-title-green" style={{ color: 'var(--cyan)' }}>Refuerzo de Transparencia y Derechos de Datos</h3>
                <p style={{ marginBottom: '0.75rem' }}>
                  Esta política se prepara considerando la normativa chilena vigente y el nuevo estándar de protección de datos personales establecido por la Ley 21.719, cuya entrada en vigencia general está prevista para el 1 de diciembre de 2026.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Finalidades:</strong> autenticación con Twitch, creación de perfil comunitario, puntos, rankings, rachas, reportes, prevención de abuso, soporte y seguridad de la plataforma.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Datos mínimos:</strong> identificador único de Twitch, nombre público, avatar público, puntajes, registros de participación, reportes enviados y datos técnicos básicos de seguridad o analítica.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Base de tratamiento:</strong> autorización del usuario, ejecución de servicios solicitados, cumplimiento de obligaciones aplicables e interés legítimo en operar una comunidad segura.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Derechos:</strong> puedes solicitar acceso, rectificación, eliminación, oposición, bloqueo/restricción, portabilidad y desvinculación de tu cuenta de Twitch, salvo conservaciones mínimas necesarias por seguridad o cumplimiento legal.
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>Encargados técnicos:</strong> podemos usar Supabase, Twitch, Cloudflare/R2 y herramientas de analítica solo para operar la web. No vendemos datos ni los entregamos a brokers o terceros comerciales.
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Solicitudes:</strong> usa la sección Ayuda o los canales oficiales de Discord/X indicando tu usuario de Twitch y la solicitud concreta. Podremos pedir verificación de identidad para proteger tu cuenta.
                </p>
              </div>
            </>
          )}

          {/* TAB 3: POLITICA DMCA & REGLAMENTO DE RETIRO */}
          {activeTab === 'dmca' && (
            <>
              <h2 className="legal-section-title">
                <AlertTriangle size={24} style={{ color: 'var(--hot-pink)' }} /> 3. Protocolo de Notificación DMCA y Retiro Expreso de Contenido
              </h2>

              <p>
                EvilTokkii respeta y promueve activamente los derechos de propiedad intelectual de los creadores, titulares y desarrolladores. Contamos con una política estricta de cooperación para la rápida remoción de cualquier contenido que infrinja derechos de autor legítimos.
              </p>

              <div className="legal-callout-card callout-pink">
                <h3 className="callout-title-pink">
                  <AlertTriangle size={20} /> Procedimiento de Retiro Inmediato (Take-Down Notice)
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  Si eres el titular legítimo de los derechos de autor (o representante legal autorizado) de alguna imagen, logotipo, carátula o fragmento presente en nuestras trivias o secciones, y deseas que sea eliminado, <strong>atenderemos y eliminaremos dicho material en un plazo máximo de 24 a 48 horas laborales</strong> sin necesidad de disputas ni trámites burocráticos.
                </p>
              </div>

              <h3 className="legal-sub-title">3.1. Requisitos para enviar una Notificación de Infracción</h3>
              <p>Para procesar tu solicitud con celeridad, la notificación enviada debe incluir:</p>
              <ol className="legal-list">
                <li>Identificación precisa de la obra protegida por derechos de autor que se alega infringida.</li>
                <li>Identificación del enlace exacto (URL o ID del minijuego/imagen) dentro de nuestra Plataforma donde reside el material.</li>
                <li>Información de contacto razonable (Dirección de correo electrónico, nombre o entidad).</li>
                <li>Una declaración de que se cree de buena fe que el uso del material no está autorizado por el titular de los derechos de autor o la ley.</li>
              </ol>

              <h3 className="legal-sub-title">3.2. Canales Directos de Atención Legal / DMCA</h3>
              <p>Puedes enviar tus notificaciones directamente a cualquiera de nuestros canales oficiales:</p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <a
                  href="https://discord.com/invite/Kxvw4KfSBF"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-contact-btn btn-discord"
                >
                  💬 Ticket en Servidor de Discord
                </a>

                <a
                  href="https://x.com/EvilTokkii_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-contact-btn btn-twitter"
                >
                  🌐 Mensaje Directo en X / Twitter (@EvilTokkii_)
                </a>
              </div>

              <p className="legal-footer-note">
                Última actualización de Términos, Privacidad y DMCA: Julio de 2026.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Legal;
