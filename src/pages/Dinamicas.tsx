import { resolveAssetUrl } from '../utils/assets';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faArrowRight, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import '../components/NewsWidget.css';
import './Home.css';
import './Dinamicas.css';
import { supabase } from '../lib/supabase';

const DinamicaCardVertical: React.FC<{ item: any, style?: React.CSSProperties }> = ({ item, style }) => {
    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `${import.meta.env.VITE_R2_BASE_URL}/Imagenes/${imagePath}`;
    };

    const isFinalizado = item.estado === 'terminado' || item.estado === 'finalizado';

    return (
        <div className="dinamica-card-vertical" style={style}>
            <div className="dinamica-card-image">
                {item.imagen ? (
                    <img
                        src={getImageUrl(item.imagen)}
                        alt={item.titulo}
                        onError={(e) => (e.currentTarget.src = `${import.meta.env.VITE_R2_BASE_URL}/logo.png`)}
                    />
                ) : (
                    <div className="dinamica-card-image-fallback">
                        <span>TOKKII</span>
                    </div>
                )}
            </div>
            <div className="dinamica-card-body">
                <div>
                    <h3 className="dinamica-card-title">{item.titulo}</h3>
                    <p className="dinamica-card-desc">{item.descripcion || ''}</p>
                </div>
                <div className="dinamica-card-footer">
                    <div>
                        <span className="dinamica-date-label">FECHA</span>
                        <span className="dinamica-date-val">{item.fecha}</span>
                    </div>
                    {isFinalizado ? (
                        <span className="dinamica-badge-finalizado">
                            FINALIZADO
                        </span>
                    ) : item.slug ? (
                        <Link
                            to={`/dinamicas/${item.slug}`}
                            className="dinamica-btn-action"
                            aria-label={`Ver detalles de ${item.titulo}`}
                        >
                            MÁS INFO <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.75rem' }} />
                        </Link>
                    ) : (
                        <span className="dinamica-btn-action" style={{ background: 'var(--hot-pink)', color: '#ffffff' }}>
                            ¡PREPÁRATE!
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const ArrowButton: React.FC<{ direction: 'left' | 'right', onClick: () => void, disabled?: boolean }> = ({ direction, onClick, disabled }) => {
    const isLeft = direction === 'left';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`dinamicas-arrow-btn ${direction}`}
            aria-label={isLeft ? 'Anterior' : 'Siguiente'}
        >
            <FontAwesomeIcon icon={isLeft ? faChevronLeft : faChevronRight} />
        </button>
    );
};

const DinamicasCarousel: React.FC<{ items: any[] }> = ({ items }) => {
    const [visibleCards, setVisibleCards] = useState(4);
    const [activeIndex, setActiveIndex] = useState(4);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const updateVisibleCards = () => {
            const width = window.innerWidth;
            if (width < 600) {
                setVisibleCards(1);
            } else if (width < 900) {
                setVisibleCards(2);
            } else if (width < 1200) {
                setVisibleCards(3);
            } else {
                setVisibleCards(4);
            }
        };
        updateVisibleCards();
        window.addEventListener('resize', updateVisibleCards);
        return () => window.removeEventListener('resize', updateVisibleCards);
    }, []);

    useEffect(() => {
        setActiveIndex(visibleCards);
    }, [visibleCards]);

    if (items.length === 0) return null;

    if (items.length <= visibleCards) {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(260px, 1fr))`,
                gap: '1.5rem',
                justifyContent: 'start',
                width: '100%',
                marginBottom: 0
            }}>
                {items.map((evento, index) => (
                    <DinamicaCardVertical key={`dinamica-grid-${index}`} item={evento} />
                ))}
            </div>
        );
    }

    const clonedItems = [
        ...items.slice(-visibleCards),
        ...items,
        ...items.slice(0, visibleCards)
    ];

    const handleNext = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setActiveIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setActiveIndex(prev => prev - 1);
    };

    const handleTransitionEnd = () => {
        setIsAnimating(false);
        if (activeIndex >= items.length + visibleCards) {
            setActiveIndex(visibleCards);
        } else if (activeIndex <= visibleCards - 1) {
            setActiveIndex(items.length + visibleCards - 1);
        }
    };

    const gap = '1.5rem';

    return (
        <div className="carousel-wrapper-container" style={{ position: 'relative', width: '100%', padding: '0 10px', marginBottom: 0 }}>
            <ArrowButton direction="left" onClick={handlePrev} />
            <ArrowButton direction="right" onClick={handleNext} />
            <div className="slider-window" style={{ width: '100%', overflow: 'hidden', padding: '10px 0' }}>
                <div
                    style={{
                        display: 'flex',
                        gap: gap,
                        transition: isAnimating ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                        transform: `translateX(calc(-${activeIndex} * (100% + ${gap}) / ${visibleCards}))`,
                        width: '100%'
                    }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {clonedItems.map((evento, idx) => (
                        <DinamicaCardVertical
                            key={`dinamica-carousel-${idx}`}
                            item={evento}
                            style={{
                                flex: `0 0 calc((100% - ${(visibleCards - 1) * 1.5}rem) / ${visibleCards})`,
                                minWidth: `calc((100% - ${(visibleCards - 1) * 1.5}rem) / ${visibleCards})`
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const Dinamicas: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            const { data, error } = await supabase
                .from('content_items')
                .select('*')
                .in('tipo', ['evento', 'sorteo'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching dynamic items:', error);
            } else {
                setItems(data || []);
            }
            setLoading(false);
        };

        fetchItems();
    }, []);

    const parseFecha = (fechaStr: string, createdAtStr: string) => {
        if (!fechaStr) return new Date(createdAtStr || 0);
        const months: { [key: string]: number } = {
            enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
            julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
        };
        const cleanStr = fechaStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        let day: number | null = null;
        let month: number | null = null;
        let year: number | null = null;
        
        for (const [mName, mVal] of Object.entries(months)) {
            if (cleanStr.includes(mName)) {
                month = mVal;
                break;
            }
        }
        
        if (month !== null) {
            const numbers = cleanStr.match(/\d+/g);
            if (numbers) {
                if (numbers.length === 1) {
                    day = parseInt(numbers[0], 10);
                } else if (numbers.length >= 2) {
                    const possibleYear1 = parseInt(numbers[0], 10);
                    const possibleYear2 = parseInt(numbers[1], 10);
                    if (possibleYear1 > 1000) {
                        year = possibleYear1;
                        day = possibleYear2;
                    } else if (possibleYear2 > 1000) {
                        year = possibleYear2;
                        day = possibleYear1;
                    } else {
                        day = possibleYear1;
                    }
                }
            }
        }
        
        if (day !== null && month !== null) {
            const fallbackYear = createdAtStr ? new Date(createdAtStr).getFullYear() : 2026;
            const finalYear = year || fallbackYear;
            const timeMatch = cleanStr.match(/(\d{1,2}):(\d{2})/);
            let hours = 0;
            let minutes = 0;
            if (timeMatch) {
                hours = parseInt(timeMatch[1], 10);
                minutes = parseInt(timeMatch[2], 10);
            }
            return new Date(finalYear, month, day, hours, minutes);
        }
        
        return new Date(createdAtStr || 0);
    };

    const eventosActivos = items
        .filter(i => i.tipo === 'evento' && i.estado === 'activo')
        .sort((a, b) => parseFecha(a.fecha, a.created_at).getTime() - parseFecha(b.fecha, b.created_at).getTime());
    const sorteosActivos = items
        .filter(i => i.tipo === 'sorteo' && i.estado === 'activo')
        .sort((a, b) => parseFecha(a.fecha, a.created_at).getTime() - parseFecha(b.fecha, b.created_at).getTime());
    const proximasDinamicas = items
        .filter(i => (i.tipo === 'evento' || i.tipo === 'sorteo') && i.estado === 'proximo')
        .sort((a, b) => parseFecha(a.fecha, a.created_at).getTime() - parseFecha(b.fecha, b.created_at).getTime());

    const eventosTerminados = items
        .filter(i => (i.tipo === 'evento' || i.tipo === 'sorteo') && (i.estado === 'terminado' || i.estado === 'finalizado'))
        .sort((a, b) => parseFecha(b.fecha, b.created_at).getTime() - parseFecha(a.fecha, a.created_at).getTime());

    const displayProximas = proximasDinamicas.length > 0 ? proximasDinamicas : [{
        id: 'placeholder',
        titulo: 'Nuevos Sorteos y Eventos',
        descripcion: 'Estamos preparando dinámicas increíbles con fabulosos premios y eventos únicos. ¡Mantente muy atento a los próximos anuncios en el canal!',
        fecha: 'Próximamente',
        imagen: '',
        slug: ''
    }];

    return (
        <div className="dinamicas-wrapper fade-in">
            {/* Warning Box */}
            <div className="wrap" style={{ paddingTop: '36px', paddingBottom: '10px' }}>
                <div className="dinamicas-warning-box">
                    <div className="warning-icon-box">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                    </div>
                    <div className="warning-content">
                        <h4 className="warning-title">¡ATENCIÓN IMPORTANTE!</h4>
                        <p className="warning-text">
                            Los formularios de Dinámicas (Eventos y Sorteos) con información incorrecta, incompleta o que no coincida con los datos verificados en stream serán invalidados automáticamente, perdiendo el derecho a participación o premio. Revisa bien tus datos antes de enviarlo.
                        </p>
                    </div>
                </div>
            </div>

            {/* 1. Sección Eventos Activos */}
            <section style={{ padding: '2rem 0' }}>
                <div className="wrap">
                    <div className="section-head-arcade" style={{ marginBottom: '1.75rem' }}>
                        <div>
                            <div className="section-tag-badge"><span>🎁</span> ¡PARTICIPA Y GANA!</div>
                            <h2 className="section-title-arcade">EVENTOS ACTIVOS</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="dinamicas-empty-box">
                            ✦ CARGANDO DINÁMICAS...
                        </div>
                    ) : eventosActivos.length === 0 ? (
                        <div className="dinamicas-empty-box">
                            No hay eventos activos en este momento. ¡Vuelve pronto!
                        </div>
                    ) : (
                        <DinamicasCarousel items={eventosActivos} />
                    )}
                </div>
            </section>

            {/* 2. Sección Sorteos Activos */}
            <section style={{ padding: '2rem 0' }}>
                <div className="wrap">
                    <div className="section-head-arcade" style={{ marginBottom: '1.75rem' }}>
                        <div>
                            <div className="section-tag-badge"><span>🎲</span> ¡PRUEBA TU SUERTE!</div>
                            <h2 className="section-title-arcade">SORTEOS ACTIVOS</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="dinamicas-empty-box">
                            ✦ CARGANDO DINÁMICAS...
                        </div>
                    ) : sorteosActivos.length === 0 ? (
                        <div className="dinamicas-empty-box">
                            No hay sorteos activos en este momento. ¡Vuelve pronto!
                        </div>
                    ) : (
                        <DinamicasCarousel items={sorteosActivos} />
                    )}
                </div>
            </section>

            {/* 3. Sección Próximas Dinámicas */}
            <section style={{ padding: '2rem 0' }}>
                <div className="wrap">
                    <div className="section-head-arcade" style={{ marginBottom: '1.75rem' }}>
                        <div>
                            <div className="section-tag-badge"><span>🚀</span> ¡YA CASI LLEGAN!</div>
                            <h2 className="section-title-arcade">PRÓXIMAS DINÁMICAS</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="dinamicas-empty-box">
                            ✦ CARGANDO DINÁMICAS...
                        </div>
                    ) : (
                        <DinamicasCarousel items={displayProximas} />
                    )}
                </div>
            </section>

            {/* 4. Sección Eventos Terminados (Historial) */}
            <section style={{ padding: '2rem 0' }}>
                <div className="wrap">
                    <div className="section-head-arcade" style={{ marginBottom: '1.75rem' }}>
                        <div>
                            <div className="section-tag-badge"><span>📜</span> ARCHIVO</div>
                            <h2 className="section-title-arcade">EVENTOS TERMINADOS</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="dinamicas-empty-box">
                            ✦ CARGANDO DINÁMICAS...
                        </div>
                    ) : eventosTerminados.length === 0 ? (
                        <div className="dinamicas-empty-box">
                            No hay eventos terminados por el momento.
                        </div>
                    ) : (
                        <DinamicasCarousel items={eventosTerminados} />
                    )}
                </div>
            </section>
        </div>
    );
};

export default Dinamicas;
