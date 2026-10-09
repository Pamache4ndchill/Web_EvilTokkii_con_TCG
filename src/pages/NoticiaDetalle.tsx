import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getWordPressNews, getWordPressNewsBySlug, type WPNewsItem } from '../services/wordpress';
import { findNewsArticleBySlug, ALL_POOL_NEWS } from '../data/DailyNewsData';
import { resolveAssetUrl } from '../utils/assets';

const SEO_KEYWORDS_PARAGRAPH = "Keywords: Tokkii, EvilTokkii, Noticias de Videojuegos, Anime, Manga, Cultura Geek, Sorteos, Comunidad, Streaming, Capcom, Pragata, Atomic Heart DLC final, noticia gaming hoy, videojuegos 2026, lanzamientos gaming abril, Atomic Heart expansión, Análisis de juegos, Reviews, Gaming News, Noticias de hoy";

// Función auxiliar para extraer palabras clave representativas (ignora stopwords)
function extractKeywords(text: string): string[] {
    if (!text) return [];
    const stopwords = new Set([
        'de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'por', 'con', 'del', 'al', 'que', 'se', 'es', 'para', 'su', 'sus', 'como',
        'mas', 'pero', 'o', 'este', 'esta', 'estos', 'estas', 'entre', 'sobre', 'tras',
        'the', 'and', 'in', 'of', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'an', 'is', 'conoce', 'todo'
    ]);
    
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4 && !stopwords.has(w));
}

// Algoritmo de recomendación automática de noticias
function calculateRelatedArticles(current: any, pool: any[]): any[] {
    if (!current || !pool || pool.length === 0) return [];

    const currentId = String(current.id || '');
    const currentSlug = String(current.slug || '').toLowerCase();
    const currentTitle = String(current.title || '').toLowerCase();
    const currentCategory = (current.categorySlug || current.category || '').toLowerCase();

    // Extraer palabras clave y temas del título y subtítulo actual
    const currentKeywords = Array.from(new Set([
        ...extractKeywords(current.title || ''),
        ...extractKeywords(current.subtitle || '')
    ]));

    // Excluir la noticia actual
    const candidates = pool.filter(item => {
        const itemId = String(item.id || '');
        const itemSlug = String(item.slug || '').toLowerCase();
        const itemTitle = String(item.title || '').toLowerCase();
        if (currentSlug && itemSlug && itemSlug === currentSlug) return false;
        if (currentId && itemId && itemId === currentId) return false;
        if (currentTitle && itemTitle && itemTitle === currentTitle) return false;
        return true;
    });

    const scored = candidates.map(item => {
        let score = 0;
        const itemCategory = (item.categorySlug || item.category || '').toLowerCase();
        
        // 1. Prioridad: Misma categoría (+60 puntos)
        const isSameCategory = 
            (currentCategory.includes('anime') && itemCategory.includes('anime')) ||
            (currentCategory.includes('videojuego') && itemCategory.includes('videojuego')) ||
            (currentCategory === itemCategory && currentCategory !== '');
            
        if (isSameCategory) {
            score += 60;
        }

        // 2. Prioridad: Etiquetas y temas relacionados en título y subtítulo (+25 / +10 pts)
        const itemTitleKeywords = new Set(extractKeywords(item.title || ''));
        const itemSubtitleKeywords = new Set(extractKeywords(item.subtitle || ''));
        
        for (const kw of currentKeywords) {
            if (itemTitleKeywords.has(kw)) {
                score += 25;
            } else if (itemSubtitleKeywords.has(kw)) {
                score += 10;
            }
        }

        // 3. Prioridad: Noticias recientes (bonus de frescura de hasta 20 puntos)
        const itemDateStr = item.published_at || item.created_at;
        if (itemDateStr) {
            const itemTime = new Date(itemDateStr).getTime();
            if (!isNaN(itemTime)) {
                const diffDays = Math.max(0, (Date.now() - itemTime) / (1000 * 60 * 60 * 24));
                score += Math.max(0, 20 - diffDays * 0.4);
            }
        }

        return { item, score };
    });

    // Ordenar por puntuación descendente y fecha más reciente
    scored.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        const dateA = new Date(a.item.published_at || a.item.created_at || 0).getTime();
        const dateB = new Date(b.item.published_at || b.item.created_at || 0).getTime();
        return dateB - dateA;
    });

    return scored.slice(0, 3).map(s => s.item);
}

const NoticiaDetalle = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<any>(null);
    const [allNewsPool, setAllNewsPool] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Scroll al tope cada vez que cambia el slug
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [slug]);

    useEffect(() => {
        const fetchPostAndPool = async () => {
            if (!slug) return;
            try {
                setLoading(true);

                // Cargar simultáneamente la noticia actual y el repositorio global de noticias
                const [wpPost, wpNewsList] = await Promise.all([
                    getWordPressNewsBySlug(slug),
                    getWordPressNews({ perPage: 100 })
                ]);

                // 1. Resolver noticia actual
                if (wpPost) {
                    setPost(wpPost);
                } else {
                    // Si no está en WordPress, buscar en Supabase
                    const { data, error: sbError } = await supabase
                        .from('news_articles')
                        .select('*')
                        .eq('slug', slug)
                        .single();

                    if (!sbError && data) {
                        setPost(data);
                    } else {
                        // Fallback a DailyNewsData
                        const fallbackPost = findNewsArticleBySlug(slug);
                        if (fallbackPost) {
                            setPost(fallbackPost);
                        } else {
                            throw new Error("No se pudo encontrar la noticia.");
                        }
                    }
                }

                // 2. Consolidar el pool de noticias para recomendaciones
                let pool: any[] = wpNewsList || [];
                if (pool.length < 4) {
                    // Fallback con Supabase y Pool estático si hay pocas noticias
                    const { data: sbArticles } = await supabase
                        .from('news_articles')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(20);
                    
                    const combined = [
                        ...pool,
                        ...(sbArticles || []),
                        ...ALL_POOL_NEWS
                    ];
                    // Deduplicar por slug
                    const uniquePool = Array.from(new Map(combined.map(item => [item.slug, item])).values());
                    setAllNewsPool(uniquePool);
                } else {
                    setAllNewsPool(pool);
                }

            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Ocurrió un error al cargar la noticia o el slug es inválido.");
            } finally {
                setLoading(false);
            }
        };

        fetchPostAndPool();
    }, [slug]);

    // Cálculo automático de las 3 noticias relacionadas
    const relatedNews = useMemo(() => {
        if (!post || allNewsPool.length === 0) return [];
        return calculateRelatedArticles(post, allNewsPool);
    }, [post, allNewsPool]);

    const getFormattedSubtitle = (subtitle?: string) => {
        if (!subtitle) return '';
        const clean = subtitle
            .replace(/\[&hellip;\]|&hellip;|\[\.\.\.\]|\.\.\./gi, '')
            .replace(/^["“'\s]+|["”'\s]+$/g, '')
            .trim();
        return clean ? `"${clean}"` : '';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        };
        return date.toLocaleDateString('es-ES', options).toUpperCase();
    };

    const formatCardDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).toUpperCase();
    };

    const getImageUrl = (image?: string) => resolveAssetUrl(image);

    if (loading) {
        return (
            <section className="section text-center" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container">
                    <p style={{
                        color: 'var(--yellow)', 
                        fontSize: '1.4rem', 
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        margin: 0
                    }}>
                        ✦ Cargando noticia...
                    </p>
                </div>
            </section>
        );
    }

    if (error || !post) {
        return (
            <section className="section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container">
                    <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--yellow)', fontSize: '2.5rem', margin: '0 0 1rem 0' }}>¡Ups!</h2>
                    <p style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 2rem 0' }}>{error || "La noticia no existe."}</p>
                    <Link to="/noticias" className="btn-arcade-secondary" style={{ padding: '0.8rem 2rem', fontSize: '0.9rem' }}>
                        &larr; VOLVER A NOTICIAS
                    </Link>
                </div>
            </section>
        );
    }

    const postCategorySlug = post.categorySlug || (post.category?.toLowerCase() === 'anime' ? 'animes' : 'videojuegos');

    return (
        <section className="section fade-in" style={{ padding: '3rem 0 6rem 0' }}>
            <div className="container">
                <article className="noticia-article">
                    <header className="noticia-header">
                        <div className="noticia-tags">
                            <Link to="/noticias" state={{ category: postCategorySlug }} className="back-btn-styled" title="Volver a Noticias">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                <span>VOLVER ATRÁS</span>
                            </Link>
                            <span className="tag-badge">
                                {post.category || 'NOTICIA'}
                            </span>
                        </div>
                        
                        {/* Fecha y Autor en la misma línea sobre el título */}
                        <div className="noticia-meta-top">
                            <span className="noticia-date">
                                Publicado: {formatDate(post.published_at || post.created_at)}
                            </span>
                            <span className="meta-separator">•</span>
                            <span className="noticia-author-top">
                                por <span className="author-name-top">{post.author || "EvilTokkii"}</span>
                            </span>
                        </div>

                        {/* 1. TÍTULO */}
                        <h1 className="noticia-title">
                            {post.title.toUpperCase()}
                        </h1>
                    </header>

                    {/* 2. IMAGEN DE CABECERA */}
                    {post.header_image && (
                        <div className="noticia-hero-image">
                            <img 
                                src={post.header_image.startsWith('http') ? post.header_image : `${import.meta.env.VITE_R2_BASE_URL}/${post.header_image}`} 
                                alt={post.title} 
                            />
                        </div>
                    )}

                    {/* 3. SUBTÍTULO EN CASILLA MORADA ARCADE (Entre comillas, blanco, la mitad del tamaño de título, cursiva y negrita) */}
                    {post.subtitle && (
                        <div className="noticia-subtitle-card">
                            <p className="noticia-subtitle">
                                {getFormattedSubtitle(post.subtitle)}
                            </p>
                        </div>
                    )}

                    <div className="noticia-content">
                        {/* 1. Contenido directo de WordPress (HTML) */}
                        {post.content ? (
                            <div 
                                className="wp-content-body" 
                                dangerouslySetInnerHTML={{ __html: post.content }} 
                            />
                        ) : post.content_blocks && Array.isArray(post.content_blocks) ? (
                            /* 2. Contenido modular antiguo (JSON Blocks) */
                            post.content_blocks.map((block: any, index: number) => {
                                if (block.type === 'text') {
                                    const isKeywordsBlock = block.content.trim().toLowerCase().startsWith('keywords:') || 
                                                           block.content.trim().toLowerCase().startsWith('<p>keywords:');
                                    return (
                                        <div 
                                            key={index} 
                                            className={`text-block ${isKeywordsBlock ? 'seo-hidden-paragraph' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: block.content }} 
                                        />
                                    );
                                } else if (block.type === 'image') {
                                    return (
                                        <figure key={index} className="image-block">
                                            <img 
                                                src={block.url?.startsWith('http') ? block.url : `${import.meta.env.VITE_R2_BASE_URL}/${block.url}`} 
                                                alt={block.caption || ''} 
                                            />
                                            {block.caption && <figcaption>{block.caption}</figcaption>}
                                        </figure>
                                    );
                                }
                                return null;
                            })
                        ) : (
                            <p style={{ opacity: 0.5 }}>Esta noticia no tiene contenido aún.</p>
                        )}

                        {/* Párrafo oculto para SEO al final */}
                        <div className="seo-hidden-paragraph">
                            <p>{SEO_KEYWORDS_PARAGRAPH}</p>
                        </div>
                    </div>
                </article>

                {/* BLOQUE AUTOMÁTICO: TAMBIÉN TE PUEDE INTERESAR */}
                {relatedNews.length > 0 && (
                    <section className="related-news-section" aria-labelledby="related-news-heading">
                        <div className="related-news-header">
                            <div className="related-header-tag">
                                <span>⚡</span> RECOMENDACIONES
                            </div>
                            <h3 id="related-news-heading" className="related-header-title">
                                TAMBIÉN TE PUEDE INTERESAR
                            </h3>
                        </div>
                        <div className="related-news-grid">
                            {relatedNews.map((item) => {
                                const isAnime = (item.categorySlug === 'animes' || item.category?.toLowerCase() === 'anime');
                                const catLabel = item.category || (isAnime ? 'ANIME' : 'VIDEOJUEGOS');
                                return (
                                    <Link 
                                        key={item.id || item.slug}
                                        to={`/noticias/${item.slug}`}
                                        className="related-news-card"
                                        aria-label={`Ver noticia relacionada: ${item.title}`}
                                    >
                                        <div className="related-news-img-box">
                                            <img 
                                                src={getImageUrl(item.header_image)} 
                                                alt={item.title}
                                                onError={(e) => (e.currentTarget.src = resolveAssetUrl('/Logo_2.png'))}
                                            />
                                        </div>
                                        <div className="related-news-content">
                                            <div className="related-news-meta-top">
                                                <span className={`related-news-badge ${isAnime ? 'badge-anime' : 'badge-gaming'}`}>
                                                    {catLabel}
                                                </span>
                                                <span className="related-news-date">
                                                    {formatCardDate(item.published_at || item.created_at)}
                                                </span>
                                            </div>
                                            <h4 className="related-news-title">
                                                {item.title}
                                            </h4>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* BLOQUE DE AUTOR: SOBRE EVILTOKKII */}
                <section className="noticia-author-section" aria-label="Sobre el autor">
                    <div className="noticia-author-card">
                        <div className="noticia-author-avatar-box">
                            <img 
                                src={getImageUrl('/Logo_2.png')} 
                                alt="EvilTokkii Logo" 
                                className="noticia-author-avatar"
                            />
                        </div>
                        <div className="noticia-author-info">
                            <div className="noticia-author-header-row">
                                <span className="noticia-author-tag">
                                    <span>✦</span> AUTOR
                                </span>
                                <h3 className="noticia-author-name">Sobre EvilTokkii</h3>
                            </div>
                            <p className="noticia-author-bio">
                                &ldquo;EvilTokkii está al frente de las noticias que importan: videojuegos, anime, lanzamientos, novedades y todo lo que mantiene a la comunidad hablando. Tu próxima obsesión comienza con una noticia.&rdquo;
                            </p>
                        </div>
                    </div>
                </section>
            </div>
            <style>{`
                .noticia-article {
                    max-width: 900px;
                    margin: 0 auto;
                }

                .noticia-header {
                    margin-bottom: 2.5rem;
                }

                .noticia-tags {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .back-btn-styled {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.6rem;
                    color: #000000;
                    background: var(--yellow);
                    font-family: var(--font-display);
                    font-weight: 800;
                    text-transform: uppercase;
                    font-size: 0.82rem;
                    letter-spacing: 0.5px;
                    padding: 0.55rem 1.3rem;
                    border: 2.5px solid #000000;
                    box-shadow: 3px 3px 0 #000000;
                    border-radius: 12px;
                    text-decoration: none;
                    transition: transform 0.12s ease, box-shadow 0.12s ease;
                }
                .back-btn-styled:hover {
                    background: var(--hot-pink);
                    color: #ffffff;
                    transform: translate(2px, 2px);
                    box-shadow: 1px 1px 0 #000000;
                }
                .tag-badge {
                    background: var(--hot-pink);
                    color: #ffffff;
                    padding: 6px 16px;
                    border-radius: 999px;
                    font-size: 0.72rem;
                    font-family: var(--font-display);
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    border: 2px solid #000000;
                    box-shadow: 2px 2px 0 #000000;
                }

                .noticia-meta-top {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 0.75rem;
                    font-family: var(--font-body);
                }
                .noticia-meta-top .meta-separator {
                    color: rgba(255, 255, 255, 0.35);
                }
                .noticia-meta-top .author-name-top {
                    color: var(--hot-pink);
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .noticia-title {
                    font-family: var(--font-display);
                    font-size: clamp(1.8rem, 3.2vw, 2.8rem);
                    font-weight: 900;
                    line-height: 1.2;
                    margin-bottom: 1.5rem;
                    color: var(--yellow);
                    text-shadow: 3px 3px 0 #000000;
                }

                .noticia-hero-image {
                    width: 100%;
                    border-radius: 20px;
                    overflow: hidden;
                    margin-bottom: 2rem;
                    background: #000000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3.5px solid #000000;
                    box-shadow: 6px 6px 0 #000000;
                }
                .noticia-hero-image img {
                    width: 100%;
                    height: auto;
                    max-height: 540px;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto;
                }

                .noticia-subtitle-card {
                    background: #20103a;
                    border: 3.5px solid #000000;
                    border-radius: 20px;
                    box-shadow: 6px 6px 0 #000000;
                    padding: 1.5rem 2rem;
                    margin-bottom: 2.8rem;
                    position: relative;
                    overflow: hidden;
                }

                .noticia-subtitle {
                    font-size: clamp(1.05rem, 1.6vw, 1.45rem);
                    color: #ffffff;
                    margin: 0;
                    line-height: 1.65;
                    font-weight: 700;
                    font-style: italic;
                    font-family: var(--font-body);
                    opacity: 0.98;
                }

                .noticia-content {
                    font-size: 1.15rem;
                    line-height: 1.8;
                    color: #ffffff;
                    font-family: var(--font-body);
                }
                .noticia-content p {
                    margin-bottom: 1.75rem;
                    color: #ffffff;
                }
                .noticia-content h1, 
                .noticia-content h2, 
                .noticia-content h3,
                .noticia-content h4,
                .noticia-content h5,
                .noticia-content h6 {
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    color: #ffffff;
                    font-family: var(--font-body);
                    font-weight: 700;
                    line-height: 1.4;
                    text-shadow: none;
                }
                .noticia-content h1 { font-size: 1.45rem; }
                .noticia-content h2 { font-size: 1.35rem; }
                .noticia-content h3 { font-size: 1.25rem; }
                .noticia-content strong, .noticia-content b {
                    color: #ffffff;
                    font-weight: 700;
                }
                .noticia-content a {
                    color: var(--cyan);
                    text-decoration: underline;
                }
                .noticia-content *:first-child {
                    margin-top: 0;
                }
                .noticia-content img {
                    max-width: 100%;
                    border-radius: 14px;
                    border: 2.5px solid #000000;
                    box-shadow: 4px 4px 0 #000000;
                    margin: 2rem 0;
                }

                .wp-content-body figure {
                    margin: 2rem 0;
                }
                .wp-content-body figure img {
                    margin: 0;
                }
                .wp-content-body figcaption {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.7);
                    text-align: center;
                    margin-top: 6px;
                    font-style: italic;
                }

                .seo-hidden-paragraph {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }

                /* --------------------------------------------------------------------------
                   SECCIÓN: TAMBIÉN TE PUEDE INTERESAR (Recomendación Automática)
                   -------------------------------------------------------------------------- */
                .related-news-section {
                    max-width: 900px;
                    margin: 4.5rem auto 0;
                    padding-top: 3rem;
                    border-top: 3px dashed rgba(255, 255, 255, 0.2);
                }

                .related-news-header {
                    margin-bottom: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .related-header-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--yellow);
                    color: #000000;
                    font-family: var(--font-display);
                    font-weight: 900;
                    font-size: 0.72rem;
                    letter-spacing: 0.05em;
                    padding: 0.25rem 0.85rem;
                    border-radius: 999px;
                    border: 2px solid #000000;
                    box-shadow: 2px 2px 0 #000000;
                    align-self: flex-start;
                    text-transform: uppercase;
                }

                .related-header-title {
                    font-family: var(--font-display);
                    font-size: clamp(1.4rem, 2.8vw, 2rem);
                    font-weight: 900;
                    color: var(--yellow);
                    letter-spacing: -0.01em;
                    margin: 0;
                    text-shadow: 2.5px 2.5px 0 #000000;
                }

                .related-news-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.25rem;
                    align-items: stretch;
                }

                @media (max-width: 768px) {
                    .related-news-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 520px) {
                    .related-news-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .related-news-card {
                    background: #20103a;
                    border: 3px solid #000000;
                    box-shadow: 4.5px 4.5px 0 #000000;
                    border-radius: 16px;
                    overflow: hidden;
                    text-decoration: none;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }

                .related-news-card:hover {
                    transform: translate(2px, 2px);
                    box-shadow: 2px 2px 0 #000000;
                }

                .related-news-img-box {
                    position: relative;
                    aspect-ratio: 16/9;
                    overflow: hidden;
                    background: #000000;
                    border-bottom: 2.5px solid #000000;
                    width: 100%;
                }

                .related-news-img-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.3s ease;
                }

                .related-news-card:hover .related-news-img-box img {
                    transform: scale(1.08);
                }

                .related-news-content {
                    padding: 1rem 1.1rem;
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                }

                .related-news-meta-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                    margin-bottom: 0.65rem;
                }

                .related-news-badge {
                    font-family: var(--font-display);
                    font-size: 0.65rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    padding: 0.2rem 0.6rem;
                    border-radius: 999px;
                    border: 1.5px solid #000000;
                    box-shadow: 1.5px 1.5px 0 #000000;
                    text-transform: uppercase;
                }

                .badge-gaming {
                    background: var(--yellow);
                    color: #000000;
                }

                .badge-anime {
                    background: var(--hot-pink);
                    color: #ffffff;
                }

                .related-news-date {
                    font-family: var(--font-body);
                    font-size: 0.72rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.75);
                    letter-spacing: 0.03em;
                }

                .related-news-title {
                    font-family: var(--font-display);
                    font-size: 0.88rem;
                    line-height: 1.35;
                    letter-spacing: -0.01em;
                    color: #ffffff;
                    margin: 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    word-break: break-word;
                    transition: color 0.15s ease;
                }

                .related-news-card:hover .related-news-title {
                    color: var(--yellow);
                }

                /* --------------------------------------------------------------------------
                   BLOQUE DE AUTOR: SOBRE EVILTOKKII
                   -------------------------------------------------------------------------- */
                .noticia-author-section {
                    max-width: 900px;
                    margin: 3.5rem auto 0;
                }

                .noticia-author-card {
                    background: #20103a;
                    border: 3.5px solid #000000;
                    box-shadow: 6px 6px 0 #000000;
                    border-radius: 20px;
                    padding: 1.8rem 2.2rem;
                    display: flex;
                    align-items: center;
                    gap: 1.8rem;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                }

                .noticia-author-avatar-box {
                    width: 105px;
                    height: 105px;
                    min-width: 105px;
                    border-radius: 18px;
                    background: #110524;
                    border: 3px solid #000000;
                    box-shadow: 3.5px 3.5px 0 #000000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    padding: 0;
                    box-sizing: border-box;
                    flex-shrink: 0;
                }

                .noticia-author-avatar {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    display: block;
                }

                .noticia-author-info {
                    flex: 1;
                    min-width: 0;
                }

                .noticia-author-header-row {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    margin-bottom: 0.6rem;
                    flex-wrap: wrap;
                }

                .noticia-author-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: var(--hot-pink);
                    color: #ffffff;
                    font-family: var(--font-display);
                    font-weight: 800;
                    font-size: 0.68rem;
                    letter-spacing: 0.05em;
                    padding: 0.2rem 0.65rem;
                    border-radius: 999px;
                    border: 1.5px solid #000000;
                    box-shadow: 1.5px 1.5px 0 #000000;
                    text-transform: uppercase;
                }

                .noticia-author-name {
                    font-family: var(--font-display);
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: var(--yellow);
                    margin: 0;
                    letter-spacing: -0.01em;
                    text-shadow: 2px 2px 0 #000000;
                }

                .noticia-author-bio {
                    font-size: 0.98rem;
                    color: rgba(255, 255, 255, 0.95);
                    line-height: 1.6;
                    font-family: var(--font-body);
                    font-weight: 600;
                    font-style: italic;
                    margin: 0;
                }

                @media (max-width: 640px) {
                    .noticia-author-card {
                        flex-direction: column;
                        text-align: center;
                        padding: 1.5rem 1.2rem;
                        gap: 1.2rem;
                    }

                    .noticia-author-header-row {
                        justify-content: center;
                    }

                    .noticia-author-avatar-box {
                        width: 85px;
                        height: 85px;
                        min-width: 85px;
                    }
                }
            `}</style>
        </section>
    );
};

export default NoticiaDetalle;
