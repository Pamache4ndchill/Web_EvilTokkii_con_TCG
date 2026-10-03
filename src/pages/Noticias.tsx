import { resolveAssetUrl } from '../utils/assets';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faFilm, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import './Noticias.css';
import { getWordPressNews, type WPNewsItem } from '../services/wordpress';

const SIDE_CARD_THEMES = [
    { cardClass: 'card-theme-cyan', tagClass: 'tag-badge-dark' },
    { cardClass: 'card-theme-pink', tagClass: 'tag-badge-yellow' },
    { cardClass: 'card-theme-yellow', tagClass: 'tag-badge-pink' },
    { cardClass: 'card-theme-blue', tagClass: 'tag-badge-cyan' },
];

const Noticias = () => {
    const [posts, setPosts] = useState<WPNewsItem[]>([]);
    const [sideItems, setSideItems] = useState<{ sorteos: any[], eventos: any[] }>({ sorteos: [], eventos: [] });
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(10);
    
    const location = useLocation();
    const [activeCategory, setActiveCategory] = useState<'videojuegos' | 'animes'>(
        location.state?.category || 'videojuegos'
    );

    useEffect(() => {
        setVisibleCount(10);
    }, [activeCategory]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Obtener noticias exclusivamente desde WordPress
                const wpPosts = await getWordPressNews({ perPage: 100 });
                setPosts(wpPosts || []);

                // 2. Obtener sorteos y eventos activos para el sidebar
                const [{ data: sorteosData }, { data: eventosData }] = await Promise.all([
                    supabase.from('content_items').select('*').eq('tipo', 'sorteo').eq('estado', 'activo').order('created_at', { ascending: false }).limit(2),
                    supabase.from('content_items').select('*').eq('tipo', 'evento').eq('estado', 'activo').order('created_at', { ascending: false }).limit(2)
                ]);

                setSideItems({
                    sorteos: sorteosData || [],
                    eventos: eventosData || []
                });
            } catch (error) {
                console.error('Error fetching news content:', error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).toUpperCase();
    };

    const getImageUrl = (image: string) => resolveAssetUrl(image);

    const getDisplayPosts = (): WPNewsItem[] => {
        return posts.filter((p: WPNewsItem) => p.categorySlug === activeCategory);
    };

    // Componente para Sidebar (Estilo Arcade Sticker Mini)
    const SidebarNewsCard = ({ item, type }: { item: any, type: string }) => (
        <Link to={`/dinamicas/${item.slug}`} className={`cr-side-card ${type === 'sorteo' ? 'sidebar-card-purple' : 'sidebar-card-cyan'}`}>
            <div className="cr-side-image">
                <img 
                    src={getImageUrl(item.imagen)} 
                    alt={item.titulo} 
                    onError={(e) => (e.currentTarget.src = `${import.meta.env.VITE_R2_BASE_URL}/logo.png`)}
                />
            </div>
            <div className="cr-side-content">
                <div className="cr-badges">
                    <span className={`arcade-news-tag ${type === 'sorteo' ? 'tag-badge-yellow' : 'tag-badge-pink'}`}>
                        {type === 'sorteo' ? 'SORTEO' : 'EVENTO'}
                    </span>
                </div>
                <h3 className="cr-side-title">{item.titulo}</h3>
                <span className="cr-side-date">{formatDate(item.created_at)}</span>
            </div>
        </Link>
    );

    if (loading) {
        return (
            <div className="loading-state" style={{ 
                minHeight: '75vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--yellow)', 
                fontSize: '1.4rem', 
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                letterSpacing: '2px',
                textTransform: 'uppercase'
            }}>
                ✦ CARGANDO NOTICIAS...
            </div>
        );
    }

    const displayPosts = getDisplayPosts();
    const visiblePosts = displayPosts.slice(0, visibleCount);
    const mainPost = visiblePosts[0];
    const sidePosts = visiblePosts.slice(1);

    return (
        <section className="noticias-page">
            <div className="wrap">
                {/* Switch superior de categorías con estilo Arcade */}
                <div className="news-switch-container">
                    <button 
                        className={`news-switch-btn ${activeCategory === 'videojuegos' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('videojuegos')}
                    >
                        <FontAwesomeIcon icon={faGamepad} style={{ marginRight: '6px' }} /> VIDEOJUEGOS
                    </button>
                    <button 
                        className={`news-switch-btn ${activeCategory === 'animes' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('animes')}
                    >
                        <FontAwesomeIcon icon={faFilm} style={{ marginRight: '6px' }} /> ANIME & MANGA
                    </button>
                </div>

                <div className="cr-grid">
                    {/* Columna Izquierda: Feed Principal */}
                    <div className="cr-feed">
                        {displayPosts.length === 0 ? (
                            <div className="news-empty-container">
                                <div className="news-empty-box">
                                    <span className="arcade-news-tag tag-badge-yellow" style={{ alignSelf: 'center', marginBottom: '8px' }}>
                                        {activeCategory === 'animes' ? 'ANIME & MANGA' : 'VIDEOJUEGOS'}
                                    </span>
                                    <h3 className="news-empty-title">NO HAY NOTICIAS EN ESTA CATEGORÍA</h3>
                                    <p className="news-empty-desc">
                                        Las noticias que publiques en WordPress con la categoría <strong>{activeCategory === 'animes' ? 'Anime' : 'Videojuegos'}</strong> aparecerán aquí automáticamente.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="arcade-news-wrapper">
                                {/* Noticia destacada principal (Sticker Púrpura) */}
                                {mainPost && (
                                    <Link 
                                        to={`/noticias/${mainPost.slug}`} 
                                        className="featured-news-card"
                                        aria-label={`Abrir noticia principal: ${mainPost.title}`}
                                    >
                                        <div className="featured-news-img-box">
                                            <img src={getImageUrl(mainPost.header_image)} alt={mainPost.title} />
                                        </div>
                                        <div className="featured-news-content">
                                            <span className="arcade-news-tag tag-badge-yellow">
                                                {mainPost.category || (activeCategory === 'animes' ? 'ANIME' : 'VIDEOJUEGOS')}
                                            </span>
                                            <h3 className="featured-news-title">{mainPost.title}</h3>
                                            {mainPost.subtitle && (
                                                <p className="featured-news-subtitle">
                                                    {mainPost.subtitle}
                                                </p>
                                            )}
                                            <div className="news-meta-row" style={{ color: 'rgba(255,255,255,0.85)' }}>
                                                <span className="news-date-text">{formatDate(mainPost.published_at)}</span>
                                                <span style={{ opacity: 0.4 }}>•</span>
                                                <span>por <span className="news-author-highlight" style={{ color: 'var(--yellow)' }}>{mainPost.author || 'EvilTokkii'}</span></span>
                                            </div>
                                        </div>
                                    </Link>
                                )}

                                {/* Resto de Noticias en Rejilla Multicolor */}
                                {sidePosts.length > 0 && (
                                    <div className="news-side-grid">
                                        {sidePosts.map((post, idx) => {
                                            const theme = SIDE_CARD_THEMES[idx % SIDE_CARD_THEMES.length];
                                            return (
                                                <Link 
                                                    key={post.id || post.slug} 
                                                    to={`/noticias/${post.slug}`} 
                                                    className={`side-news-card ${theme.cardClass}`}
                                                    aria-label={`Abrir noticia: ${post.title}`}
                                                >
                                                    <div className="side-news-img-box">
                                                        <img src={getImageUrl(post.header_image)} alt={post.title} />
                                                    </div>
                                                    <div className="side-news-content">
                                                        <span className={`arcade-news-tag ${theme.tagClass}`}>
                                                            {post.category || (activeCategory === 'animes' ? 'ANIME' : 'VIDEOJUEGOS')}
                                                        </span>
                                                        <h4 className="side-news-title">{post.title}</h4>
                                                        <div className="news-meta-row">
                                                            <span className="news-date-text">{formatDate(post.published_at)}</span>
                                                            <span style={{ opacity: 0.4 }}>•</span>
                                                            <span>por <span className="news-author-highlight">{post.author || 'EVILTOKKII'}</span></span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Botón de cargar más (Arcade Style) */}
                                {displayPosts.length > visibleCount && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                                        <button 
                                            className="btn-arcade-secondary"
                                            onClick={() => setVisibleCount(prev => prev + 10)}
                                            style={{
                                                padding: '0.85rem 2.5rem',
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            CARGAR MÁS NOTICIAS <FontAwesomeIcon icon={faArrowRight} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Columna Derecha: Sidebar (Dinámicas & Sorteos) */}
                    <aside className="cr-sidebar">
                        <div className="cr-sticky-wrapper">
                            <div className="section-head-arcade" style={{ marginBottom: '12px' }}>
                                <div>
                                    <div className="section-tag-badge"><span>🎁</span> COMUNIDAD</div>
                                    <h3 className="section-title-arcade" style={{ fontSize: '1.4rem' }}>DINÁMICAS</h3>
                                </div>
                            </div>
                            {sideItems.sorteos.map(item => (
                                <SidebarNewsCard key={item.id} item={item} type="sorteo" />
                            ))}
                            {sideItems.eventos.map(item => (
                                <SidebarNewsCard key={item.id} item={item} type="evento" />
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
};

export default Noticias;
