import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import ParticipationForm from '../components/ParticipationForm';
import { supabase } from '../lib/supabase';
import './Dinamicas.css';

const EventoDetalle: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [evento, setEvento] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);

    React.useEffect(() => {
        const fetchEvento = async () => {
            const { data, error } = await supabase
                .from('content_items')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Error fetching event details:', error);
            } else {
                setEvento(data);
            }
            setLoading(false);
        };

        if (slug) {
            fetchEvento();
        }
    }, [slug]);

    if (loading) {
        return (
            <section className="section text-center" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="wrap">
                    <p style={{
                        color: 'var(--yellow)',
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                    }}>
                        ✦ CARGANDO DETALLES...
                    </p>
                </div>
            </section>
        );
    }

    if (!evento) {
        return (
            <section className="section text-center" style={{ padding: '4rem 0' }}>
                <div className="wrap">
                    <h2 className="section-title-arcade" style={{ color: 'var(--hot-pink)' }}>EVENTO NO ENCONTRADO</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', margin: '1rem 0 2rem' }}>
                        No pudimos encontrar los detalles de esta dinámica.
                    </p>
                    <Link to="/dinamicas" className="btn-arcade-primary">VOLVER A DINÁMICAS</Link>
                </div>
            </section>
        );
    }

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `${import.meta.env.VITE_R2_BASE_URL}/Imagenes/${imagePath}`;
    };

    return (
        <section className="section fade-in" style={{ padding: '3rem 0 5rem' }}>
            <div className="wrap">
                <div style={{ marginBottom: '2rem' }}>
                    <Link
                        to="/dinamicas"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            color: '#000000',
                            background: 'var(--yellow)',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            fontSize: '0.85rem',
                            letterSpacing: '1px',
                            padding: '0.5rem 1.2rem',
                            border: '2.5px solid #000000',
                            boxShadow: '3px 3px 0 #000000',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            transition: 'transform 0.12s ease, box-shadow 0.12s ease'
                        }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} /> VOLVER A DINÁMICAS
                    </Link>
                </div>

                <div style={{
                    padding: '2.5rem',
                    borderRadius: '26px',
                    background: '#20103a',
                    border: '4px solid #000000',
                    boxShadow: '8px 8px 0 #000000'
                }}>
                    {/* Fila 1: Imagen (Izquierda) y Fecha/Premio (Derecha) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                        gap: '2rem',
                        marginBottom: '2.5rem'
                    }}>
                        {/* Recuadro de la Imagen */}
                        <div style={{
                            height: '360px',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '3.5px solid #000000',
                            boxShadow: '6px 6px 0 #000000',
                            background: '#000000'
                        }}>
                            {evento.imagen ? (
                                <img
                                    src={getImageUrl(evento.imagen)}
                                    alt={evento.titulo}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => (e.currentTarget.src = `${import.meta.env.VITE_R2_BASE_URL}/logo.png`)}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(135deg, #6f26d9 0%, #ff32b8 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '2.5rem',
                                    color: 'var(--yellow)',
                                    textShadow: '3px 3px 0 #000000'
                                }}>
                                    TOKKII
                                </div>
                            )}
                        </div>

                        {/* Recuadro de Fecha y Premio Dividido */}
                        <div style={{
                            height: '360px',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#180d2f',
                            border: '3.5px solid #000000',
                            boxShadow: '6px 6px 0 #000000',
                            overflow: 'hidden'
                        }}>
                            {/* Mitad Superior: Fecha */}
                            <div style={{
                                flex: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '1.5rem',
                                borderBottom: '3.5px solid #000000'
                            }}>
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    color: 'var(--cyan)',
                                    fontSize: '0.85rem',
                                    letterSpacing: '1px',
                                    marginBottom: '0.5rem'
                                }}>
                                    FECHA DE REALIZACIÓN
                                </span>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
                                    color: 'var(--yellow)',
                                    textShadow: '2px 2px 0 #000000',
                                    lineHeight: 1.15,
                                    margin: 0
                                }}>
                                    {evento.fecha}
                                </p>
                            </div>

                            {/* Mitad Inferior: Premio */}
                            <div style={{
                                flex: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                padding: '1.5rem'
                            }}>
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    color: 'var(--hot-pink)',
                                    fontSize: '0.85rem',
                                    letterSpacing: '1px',
                                    marginBottom: '0.5rem'
                                }}>
                                    PREMIOS A REPARTIR
                                </span>
                                <p style={{
                                    fontSize: '1.15rem',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    lineHeight: '1.4',
                                    margin: 0
                                }}>
                                    {evento.premios || 'Sin premios especificados'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Fila 2: Título de la dinámica */}
                    <div className="section-head-arcade" style={{ marginBottom: '1.5rem' }}>
                        <div>
                            <div className="section-tag-badge">
                                <span>{evento.tipo === 'sorteo' ? '🎲' : '🎁'}</span> {evento.tipo === 'sorteo' ? 'SORTEO ESPECIAL' : 'EVENTO DE COMUNIDAD'}
                            </div>
                            <h2 className="section-title-arcade" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
                                {evento.titulo}
                            </h2>
                        </div>
                    </div>

                    {/* Resto de Informaciones */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        {/* Detalles / Descripción */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{
                                fontSize: '1.15rem',
                                lineHeight: '1.7',
                                color: 'rgba(255, 255, 255, 0.9)',
                                whiteSpace: 'pre-line',
                                margin: 0
                            }}>
                                {evento.detalles || evento.descripcion || 'No hay más detalles disponibles para este evento.'}
                            </p>
                        </div>

                        {/* Normas de participación */}
                        {evento.normas && evento.normas.length > 0 && (
                            <div style={{
                                padding: '1.75rem',
                                borderRadius: '18px',
                                border: '3px solid #000000',
                                boxShadow: '5px 5px 0 #000000',
                                background: '#180d2f',
                                marginTop: '2rem'
                            }}>
                                <h3 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.15rem',
                                    color: 'var(--yellow)',
                                    textShadow: '2px 2px 0 #000000',
                                    marginBottom: '1rem'
                                }}>
                                    NORMAS DE PARTICIPACIÓN
                                </h3>
                                <ul style={{
                                    paddingLeft: '1.25rem',
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '1.05rem',
                                    lineHeight: '1.8',
                                    margin: 0
                                }}>
                                    {evento.normas.map((norma: string, i: number) => (
                                        <li key={i} style={{ marginBottom: '0.4rem' }}>{norma}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Fila 3: Botón de Participar */}
                    {evento.estado === 'activo' ? (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn-arcade-primary"
                                style={{
                                    padding: '1rem 3rem',
                                    fontSize: '1.15rem'
                                }}
                            >
                                <FontAwesomeIcon icon={faUserPlus} /> PARTICIPAR AHORA
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                            <div className="dinamica-badge-finalizado" style={{ fontSize: '0.95rem', padding: '0.75rem 2rem' }}>
                                ESTA DINÁMICA SE ENCUENTRA {evento.estado === 'proximo' ? 'PRÓXIMA A INICIAR' : 'FINALIZADA'}
                            </div>
                        </div>
                    )}
                </div>

                {showForm && (
                    <ParticipationForm
                        tipo="evento"
                        itemId={slug || ""}
                        itemTitle={evento.titulo}
                        onClose={() => setShowForm(false)}
                    />
                )}
            </div>
        </section>
    );
};

export default EventoDetalle;
