import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faInfoCircle, faPaperPlane, faBug, faLightbulb, faExchangeAlt, faPaperclip, faTrash, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { supabase, supabaseAuth } from '../lib/supabase';
import './Ayuda.css';

interface AccordionItemProps {
    title: string;
    isOpen: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, isOpen, onClick, children }) => {
    return (
        <div className="arcade-accordion-item">
            <button 
                onClick={onClick}
                className="arcade-accordion-btn"
                type="button"
            >
                <span className="arcade-accordion-title">{title}</span>
                <span className="arcade-accordion-icon" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                    {isOpen ? '−' : '+'}
                </span>
            </button>
            <div 
                className="arcade-accordion-content"
                style={{ 
                    maxHeight: isOpen ? '600px' : '0', 
                    opacity: isOpen ? 1 : 0
                }}
            >
                <div className="arcade-accordion-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Ayuda: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    
    // Estados para colapsables (normas, FAQs y políticas)
    const [openNormaIdx, setOpenNormaIdx] = useState<number | null>(null);
    const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
    const [openPolicyIdx, setOpenPolicyIdx] = useState<number | null>(null);

    // Estados del formulario de reporte
    const [reportType, setReportType] = useState<string>('bug');
    const [description, setDescription] = useState<string>('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [username, setUsername] = useState<string>('');
    const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async (sessionUser: any) => {
            if (!sessionUser) {
                setUsername('');
                return;
            }
            try {
                const { data } = await supabaseAuth
                    .from('profiles')
                    .select('username')
                    .eq('id', sessionUser.id)
                    .single();
                if (data?.username) {
                    setUsername(data.username);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        };

        // Obtener sesión activa de Twitch / Minijuegos
        supabaseAuth.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            fetchProfile(session?.user ?? null);
        });

        // Escuchar cambios de sesión
        const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            fetchProfile(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...files]);
            
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!description.trim()) {
            setSubmitStatus({ success: false, message: 'Por favor, describe detalladamente tu reporte.' });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            let imageUrls: string[] = [];

            // 1. Subir imágenes a R2 mediante la Edge Function 'clever-api'
            if (selectedImages.length > 0) {
                for (const image of selectedImages) {
                    const { data, error: uploadErr } = await supabase.functions.invoke('clever-api', {
                        body: { fileName: image.name, fileType: image.type }
                    });

                    if (uploadErr || !data) {
                        throw new Error(uploadErr ? uploadErr.message : 'Error generando presigned URL');
                    }

                    const uploadRes = await fetch(data.presignedUrl, {
                        method: 'PUT',
                        body: image,
                        headers: { 'Content-Type': image.type }
                    });

                    if (!uploadRes.ok) {
                        throw new Error(`Mala conexión con R2: ${uploadRes.statusText}`);
                    }

                    imageUrls.push(data.finalPublicUrl);
                }
            }

            // 2. Guardar reporte en Supabase con los URLs de R2 y el username
            const { error } = await supabaseAuth
                .from('user_reports')
                .insert({
                    user_id: user.id,
                    username: username || user?.user_metadata?.name || user?.user_metadata?.full_name || user?.user_metadata?.user_name || 'Desconocido',
                    report_type: reportType,
                    description: description.trim(),
                    images: imageUrls
                });

            if (error) throw error;

            setShowSuccessModal(true);
            setSubmitStatus({ success: true, message: '¡Tu reporte ha sido enviado con éxito!' });
            setDescription('');
            setSelectedImages([]);
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
            setImagePreviews([]);
        } catch (err: any) {
            setSubmitStatus({ success: false, message: 'Error al enviar reporte: ' + err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleNorma = (idx: number) => {
        setOpenNormaIdx(prev => (prev === idx ? null : idx));
    };

    const toggleFaq = (idx: number) => {
        setOpenFaqIdx(prev => (prev === idx ? null : idx));
    };

    const togglePolicy = (idx: number) => {
        setOpenPolicyIdx(prev => (prev === idx ? null : idx));
    };

    return (
        <div className="ayuda-page fade-in">
            <section className="home-section" style={{ minHeight: 'auto', padding: '4rem 0 6rem 0', position: 'relative' }}>
                <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="ayuda-container">
                        
                        {/* Cabecera Hero Arcade */}
                        <header className="ayuda-hero-card">
                            <div className="section-tag-badge" style={{ display: 'inline-flex', margin: '0 auto 14px' }}>
                                <span>🛠️</span> SOPORTE
                            </div>
                            <h1 className="ayuda-hero-title">
                                CENTRO DE AYUDA
                            </h1>
                            <p className="ayuda-hero-desc">
                                Normas oficiales, preguntas frecuentes y buzón de reporte y sugerencias.
                            </p>
                        </header>

                        {/* SECCIÓN 1: NORMAS DE LOS MINIJUEGOS */}
                        <div className="ayuda-card">
                            <h2 className="ayuda-card-title">
                                <span className="ayuda-card-title-icon">
                                    <FontAwesomeIcon icon={faGamepad} />
                                </span>
                                NORMAS DE LOS MINIJUEGOS
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <AccordionItem 
                                    title="¿Debo logearme en la web para realizar los minijuegos?" 
                                    isOpen={openNormaIdx === 0} 
                                    onClick={() => toggleNorma(0)}
                                >
                                    Sí, es totalmente obligatorio iniciar sesión con tu cuenta de Twitch. Esto nos permite asociar tus puntos diarios a tu usuario único en nuestra base de datos, resguardar tus estadísticas de racha diaria y evitar vulnerabilidades o spam de puntajes.
                                </AccordionItem>

                                <AccordionItem 
                                    title="¿Cuántas veces puedo jugar y sumar puntos al día?" 
                                    isOpen={openNormaIdx === 1} 
                                    onClick={() => toggleNorma(1)}
                                >
                                    Cada minijuego o trivia diaria (como Overwatch Quiz o Word Scramble) otorga puntos <strong>solo en tu primera resolución exitosa del día</strong>. Si vuelves a ingresar después de completarlo, el juego estará bloqueado y no sumará más puntos hasta el reinicio diario del servidor (a las 00:00 UTC).
                                </AccordionItem>

                                <AccordionItem 
                                    title="¿Cuál es la escala de puntaje y el tiempo límite?" 
                                    isOpen={openNormaIdx === 2} 
                                    onClick={() => toggleNorma(2)}
                                >
                                    Cada respuesta correcta en cualquier trivia te otorga exactamente <strong>+3 puntos</strong>. Tienes un temporizador individual de exactamente <strong>15 segundos</strong> para responder a cada pregunta. Si el tiempo expira, la pregunta se contará automáticamente como incorrecta.
                                </AccordionItem>

                                <AccordionItem 
                                    title="¿Cómo funciona la Racha Diaria (Streak)?" 
                                    isOpen={openNormaIdx === 3} 
                                    onClick={() => toggleNorma(3)}
                                >
                                    Si completas y respondes de manera correcta preguntas en los minijuegos activos en el transcurso del día, mantendrás activa tu racha diaria en tu perfil. Faltar un solo día a los desafíos diarios reseteará tu racha a cero. ¡Mantén la constancia para conseguir medallas especiales!
                                </AccordionItem>
                            </div>
                        </div>

                        {/* SECCIÓN 2: PREGUNTAS FRECUENTES (FAQ NAVEGACIÓN Y WEB) */}
                        <div className="ayuda-card">
                            <h2 className="ayuda-card-title">
                                <span className="ayuda-card-title-icon">
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                </span>
                                PREGUNTAS FRECUENTES (FAQ)
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <AccordionItem 
                                    title="¿Qué son las 'Dinámicas' y cómo participo?" 
                                    isOpen={openFaqIdx === 0} 
                                    onClick={() => toggleFaq(0)}
                                >
                                    Las Dinámicas corresponden a eventos especiales organizados por EvilTokkii en sus streams (como la Ruleta de la Suerte o Sorteos Especiales). En la pestaña Dinámicas verás el progreso, las metas y los requisitos en tiempo real. Algunas dinámicas te pedirán canjear puntos de la web para participar.
                                </AccordionItem>

                                <AccordionItem 
                                    title="¿Dónde puedo visualizar mis estadísticas y puntaje total?" 
                                    isOpen={openFaqIdx === 1} 
                                    onClick={() => toggleFaq(1)}
                                >
                                    Una vez logeado, verás tu avatar y puntos en la barra de navegación superior. Al hacer clic en tu perfil, accederás al panel personal con tu historial diario de quizzes resueltos, medallas de racha de días y los puntos mensuales conseguidos.
                                </AccordionItem>

                                <AccordionItem 
                                    title="¿Cómo funciona el ranking del Templo de la Fama?" 
                                    isOpen={openFaqIdx === 2} 
                                    onClick={() => toggleFaq(2)}
                                >
                                    El Templo de la Fama lista a los 10 usuarios con mayor puntaje acumulado en el mes. La tabla se reinicia a cero el día 30 de cada mes, o el último día si el mes no llega a 30 días. Los finalistas del ranking mensual suelen recibir recompensas directas y roles honorarios en Discord.
                                </AccordionItem>
                            </div>
                        </div>

                        {/* SECCIÓN 3: CASILLA DE REPORTE Y SUGERENCIAS */}
                        <div className="ayuda-card">
                            <div>
                                <h2 className="ayuda-card-title">
                                    <span className="ayuda-card-title-icon">
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                    </span>
                                    REPORTAR UN BUG O SUGERENCIA
                                </h2>
                                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', margin: '10px 0 0 0', lineHeight: 1.6 }}>
                                    ¿Encontraste algún error de código, link caído o tienes una idea para mejorar la plataforma? Envíanos tu reporte y el equipo lo revisará de inmediato.
                                </p>
                            </div>

                            {user ? (
                                <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--yellow)', textShadow: '1px 1px 0 #000' }}>
                                            TIPO DE REPORTE
                                        </label>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {[
                                                { id: 'bug', label: 'BUG / ERROR', icon: faBug },
                                                { id: 'sugerencia', label: 'SUGERENCIA', icon: faLightbulb },
                                                { id: 'cambio', label: 'CAMBIO PROPUESTO', icon: faExchangeAlt }
                                            ].map(t => {
                                                const isActive = reportType === t.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setReportType(t.id)}
                                                        className={`report-type-btn ${isActive ? 'active' : ''}`}
                                                    >
                                                        <FontAwesomeIcon icon={t.icon} />
                                                        {t.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--yellow)', textShadow: '1px 1px 0 #000' }}>
                                            DESCRIPCIÓN DETALLADA
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Por favor, explica paso a paso el problema o detalla tu sugerencia..."
                                            rows={5}
                                            className="arcade-textarea"
                                        />
                                    </div>

                                    {submitStatus && (
                                        <div style={{
                                            padding: '0.85rem 1rem',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            background: submitStatus.success ? '#180d2f' : '#2d1010',
                                            color: submitStatus.success ? '#4ade80' : '#ff4b4b',
                                            border: submitStatus.success ? '2px solid #22c55e' : '2px solid #ff4b4b',
                                            boxShadow: '3px 3px 0 #000000'
                                        }}>
                                            {submitStatus.message}
                                        </div>
                                    )}

                                    {imagePreviews.length > 0 && (
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
                                            {imagePreviews.map((preview, idx) => (
                                                <div key={idx} className="arcade-img-preview">
                                                    <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="arcade-img-delete-btn"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageChange} 
                                        multiple 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isSubmitting}
                                            className="arcade-btn-attach"
                                        >
                                            <FontAwesomeIcon icon={faPaperclip} />
                                            {selectedImages.length > 0 ? `ADJUNTADAS (${selectedImages.length})` : 'ADJUNTAR CAPTURAS'}
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="arcade-btn-submit"
                                        >
                                            <FontAwesomeIcon icon={faPaperPlane} />
                                            {isSubmitting ? 'ENVIANDO...' : 'ENVIAR REPORTE'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '2.5rem 1.5rem', 
                                    background: '#180d2f', 
                                    border: '2.5px solid #000000', 
                                    borderRadius: '16px',
                                    boxShadow: '3px 3px 0 #000000'
                                }}>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
                                        Debes iniciar sesión con tu cuenta de Twitch para poder enviar un reporte o sugerencia.
                                    </p>
                                    <span style={{ 
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.8rem', 
                                        fontFamily: 'var(--font-display)',
                                        color: '#000000', 
                                        background: 'var(--yellow)',
                                        padding: '0.35rem 0.9rem',
                                        borderRadius: '999px',
                                        border: '2px solid #000000',
                                        boxShadow: '2px 2px 0 #000000',
                                        fontWeight: 800 
                                    }}>
                                        🔒 INICIO DE SESIÓN REQUERIDO
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN 4: POLÍTICAS Y PRIVACIDAD */}
                        <div className="ayuda-card">
                            <h2 className="ayuda-card-title">
                                <span className="ayuda-card-title-icon">
                                    <FontAwesomeIcon icon={faShieldAlt} />
                                </span>
                                POLÍTICAS Y PRIVACIDAD
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <AccordionItem 
                                    title="1. Política de Privacidad Detallada" 
                                    isOpen={openPolicyIdx === 0} 
                                    onClick={() => togglePolicy(0)}
                                >
                                    En <strong>EvilTokkii</strong>, la privacidad de nuestros usuarios es una prioridad absoluta. Recopilamos nombres de usuario de Twitch y datos necesarios para la gestión segura de puntajes y recompensas. A través de <strong>Supabase</strong>, garantizamos que tus datos personales están cifrados y protegidos. <strong>Jamás venderemos ni compartiremos tu información con anunciantes o terceros.</strong>
                                </AccordionItem>

                                <AccordionItem 
                                    title="2. Términos y Condiciones de Participación" 
                                    isOpen={openPolicyIdx === 1} 
                                    onClick={() => togglePolicy(1)}
                                >
                                    El uso de este sitio implica el respeto absoluto de las normas de convivencia de la comunidad. Queda estrictamente prohibida la manipulación de resultados, el spam o el uso de múltiples cuentas para inflar puntajes o probabilidades en los sorteos. Los premios ganados en las dinámicas tienen un plazo de vencimiento de <strong>7 días naturales</strong> para ser reclamados por los canales oficiales (Discord o Twitch).
                                </AccordionItem>

                                <AccordionItem 
                                    title="3. Política de Cookies y Rastreo" 
                                    isOpen={openPolicyIdx === 2} 
                                    onClick={() => togglePolicy(2)}
                                >
                                    Utilizamos cookies técnicas necesarias exclusivamente para mantener tu inicio de sesión de Twitch activo y seguro. El reproductor incrustado de Twitch.tv puede instalar cookies analíticas propias para medir la audiencia de la transmisión. Puedes borrar o bloquear el almacenamiento de cookies en cualquier momento a través de la configuración de tu navegador.
                                </AccordionItem>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Modal Emergente de Agradecimiento por Reporte */}
            {showSuccessModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        maxWidth: '480px',
                        width: '100%',
                        borderRadius: '22px',
                        padding: '2.5rem 2rem',
                        textAlign: 'center',
                        border: '3.5px solid #000000',
                        background: '#20103a',
                        boxShadow: '8px 8px 0 #000000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.25rem'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--yellow)',
                            border: '2.5px solid #000000',
                            boxShadow: '3px 3px 0 #000000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem'
                        }}>
                            💌
                        </div>

                        <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--yellow)', textShadow: '2px 2px 0 #000000', margin: 0 }}>
                            ¡REPORTE ENVIADO CON ÉXITO!
                        </h3>

                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                            Muchas gracias por enviarnos tus comentarios y ayudarnos a mejorar <strong>EvilTokkii</strong>. Un miembro del equipo de soporte revisará tu mensaje y te brindará respuesta breve en tu buzón de mensajes personal.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowSuccessModal(false)}
                            className="arcade-btn-submit"
                            style={{
                                width: '100%',
                                marginTop: '0.5rem',
                                padding: '0.85rem'
                            }}
                        >
                            ENTENDIDO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ayuda;
