import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWordPressNews, type WPNewsItem } from '../services/wordpress';
import './NewsWidget.css';

interface NewsWidgetProps {
    onActiveNewsChange?: (url: string) => void;
}

const SIDE_CARD_THEMES = [
    { cardClass: 'card-theme-cyan', tagClass: 'tag-badge-dark' },
    { cardClass: 'card-theme-pink', tagClass: 'tag-badge-yellow' },
    { cardClass: 'card-theme-yellow', tagClass: 'tag-badge-pink' },
    { cardClass: 'card-theme-blue', tagClass: 'tag-badge-cyan' },
];

const NewsWidget: React.FC<NewsWidgetProps> = ({ onActiveNewsChange }) => {
    const [latestPosts, setLatestPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                // Obtener noticias exclusivamente desde WordPress
                const wpPosts = await getWordPressNews({ perPage: 10 });
                setLatestPosts(wpPosts || []);
            } catch (err) {
                console.error("Error fetching latest posts from WordPress:", err);
                setLatestPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLatest();
    }, []);

    useEffect(() => {
        if (latestPosts.length > 0 && onActiveNewsChange) {
            const activeIndex = hoveredIndex !== null ? hoveredIndex : 0;
            const activePost = latestPosts[activeIndex];
            if (activePost) {
                onActiveNewsChange(getImageUrl(activePost));
            }
        }
    }, [latestPosts, hoveredIndex, onActiveNewsChange]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric'
        };
        return date.toLocaleDateString('es-ES', options).toUpperCase();
    };

    const getImageUrl = (post: any) => {
        if (!post.header_image) return `${import.meta.env.VITE_R2_BASE_URL}/logo.png`;
        return post.header_image.startsWith('http') ? post.header_image : `${import.meta.env.VITE_R2_BASE_URL}/${post.header_image}`;
    };

    if (loading || latestPosts.length === 0) return null;

    const leftPosts = latestPosts.slice(0, 2);
    const rightPosts = latestPosts.slice(2, 6);

    return (
        <div className="arcade-news-wrapper">
            <div className="news-grid">
                {/* 1. Columna Izquierda: 2 Noticias en Formato Horizontal Apiladas */}
                <div className="news-left-column">
                    {leftPosts.map((post, idx) => (
                        <Link 
                            key={post.id || post.slug} 
                            to={`/noticias/${post.slug}`} 
                            className={`horizontal-news-card ${idx === 0 ? 'card-left-primary' : 'card-left-secondary'}`}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            aria-label={`Abrir noticia: ${post.title}`}
                        >
                            <div className="horizontal-news-img-box">
                                <img src={getImageUrl(post)} alt={post.title} />
                            </div>
                            <div className="horizontal-news-content">
                                <div>
                                    <span className={`arcade-news-tag ${idx === 0 ? 'tag-badge-yellow' : 'tag-badge-cyan'}`}>
                                        {post.category || 'DESTACADO'}
                                    </span>
                                    <h3 className="horizontal-news-title">{post.title}</h3>
                                </div>
                                <div className="news-meta-row">
                                    <span className="news-date-text">{formatDate(post.published_at || post.created_at)}</span>
                                    <span style={{ opacity: 0.4 }}>•</span>
                                    <span>por <span className="news-author-highlight" style={{ color: idx === 0 ? 'var(--yellow)' : 'var(--cyan)' }}>{post.author || 'EvilTokkii'}</span></span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* 2. Grid de Noticias Secundarias (Multicolor 2x2) */}
                <div className="news-side-grid">
                    {rightPosts.map((post, idx) => {
                        const originalIndex = idx + 2;
                        const theme = SIDE_CARD_THEMES[idx % SIDE_CARD_THEMES.length];
                        return (
                            <Link 
                                key={post.id || post.slug} 
                                to={`/noticias/${post.slug}`} 
                                className={`side-news-card ${theme.cardClass}`}
                                onMouseEnter={() => setHoveredIndex(originalIndex)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                aria-label={`Abrir noticia: ${post.title}`}
                            >
                                <div className="side-news-img-box">
                                    <img src={getImageUrl(post)} alt={post.title} />
                                </div>
                                <div className="side-news-content">
                                    <span className={`arcade-news-tag ${theme.tagClass}`}>
                                        {post.category || 'NOTICIAS'}
                                    </span>
                                    <h4 className="side-news-title">{post.title}</h4>
                                    <div className="news-meta-row">
                                        <span className="news-date-text">{formatDate(post.published_at || post.created_at)}</span>
                                        <span style={{ opacity: 0.4 }}>•</span>
                                        <span>por <span className="news-author-highlight">{post.author || 'EVILTOKKII'}</span></span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default NewsWidget;
