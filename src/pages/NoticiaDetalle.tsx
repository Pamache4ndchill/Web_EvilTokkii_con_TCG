import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getWordPressNewsBySlug } from '../services/wordpress';
import { findNewsArticleBySlug } from '../data/DailyNewsData';

const SEO_KEYWORDS_PARAGRAPH = "Keywords: Tokkii, EvilTokkii, Noticias de Videojuegos, Anime, Manga, Cultura Geek, Sorteos, Comunidad, Streaming, Capcom, Pragata, Atomic Heart DLC final, noticia gaming hoy, videojuegos 2026, lanzamientos gaming abril, Atomic Heart expansión, Análisis de juegos, Reviews, Gaming News, Noticias de hoy";

const NoticiaDetalle = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                // 1. Intentar obtener desde WordPress
                const wpPost = await getWordPressNewsBySlug(slug);
                if (wpPost) {
                    setPost(wpPost);
                    return;
                }

                // 2. Si no está en WordPress, buscar en Supabase
                const { data, error: sbError } = await supabase
                    .from('news_articles')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (!sbError && data) {
                    setPost(data);
                    return;
                }

                // 3. Fallback a DailyNewsData
                const fallbackPost = findNewsArticleBySlug(slug);
                if (fallbackPost) {
                    setPost(fallbackPost);
                    return;
                }

                throw new Error("No se pudo encontrar la noticia.");
            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Ocurrió un error al cargar la noticia o el slug es inválido.");
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

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
            </div>
            <style>{`
                .noticia-article {
                    max-width: 900px;
                    margin: 0 auto 4rem;
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
            `}</style>
        </section>
    );
};

export default NoticiaDetalle;
