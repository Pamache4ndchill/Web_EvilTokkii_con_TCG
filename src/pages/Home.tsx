import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NewsWidget from '../components/NewsWidget';
import TwitchPlayer from '../components/TwitchPlayer';
import MostStreamed from '../components/MostStreamed';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitch, faInstagram, faTiktok, faXTwitter, faDiscord, faSteam, faPlaystation, faXbox, faBattleNet, faItchIo } from '@fortawesome/free-brands-svg-icons';
import { faGamepad, faTrophy, faCrown, faArrowRight, faBolt, faStar, faStore, faArrowUpRightFromSquare, faBagShopping } from '@fortawesome/free-solid-svg-icons';
import { supabaseMinigames } from '../lib/supabase';
import { checkAndRotateMonthlyLeaderboard } from '../utils/monthlyRotation';
import { renderBadge } from '../components/UserRoleBadge';
import './Home.Socials.css';
import './Home.css';

const OFFICIAL_STORES = [
    {
        id: 'steam',
        name: 'Steam',
        tag: 'PC & Steam Deck',
        desc: 'La plataforma líder de distribución digital para PC, con ofertas de temporada y comunidad.',
        url: 'https://store.steampowered.com/',
        icon: faSteam,
        color: '#1a9fff',
        borderColor: '#1a9fff'
    },
    {
        id: 'epic',
        name: 'Epic Games Store',
        tag: 'PC & Juegos Gratis',
        desc: 'Juegos gratuitos cada semana, lanzamientos exclusivos y catálogo digital para PC y Mac.',
        url: 'https://store.epicgames.com/',
        customIcon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 0L1.75 6.1v11.8L12 24l10.25-6.1V6.1L12 0zm0 2.3l8.25 4.9v9.6L12 21.7 3.75 16.8V7.2L12 2.3zm-1 4.7v5.5h2V7h-2zm0 7.5v2.5h2v-2.5h-2z" />
            </svg>
        ),
        color: '#0078f2',
        borderColor: '#0078f2'
    },
    {
        id: 'playstation',
        name: 'PlayStation Store',
        tag: 'PS5 & PS4',
        desc: 'Catálogo oficial de PlayStation para PS5 y PS4, expansiones y suscripciones PlayStation Plus.',
        url: 'https://store.playstation.com/',
        icon: faPlaystation,
        color: '#0070d1',
        borderColor: '#0070d1'
    },
    {
        id: 'xbox',
        name: 'Xbox & Game Pass',
        tag: 'Xbox Series & PC',
        desc: 'Tienda oficial de Microsoft, cientos de juegos con Game Pass y compatibilidad en la nube.',
        url: 'https://www.xbox.com/games/store',
        icon: faXbox,
        color: '#107c10',
        borderColor: '#107c10'
    },
    {
        id: 'nintendo',
        name: 'Nintendo eShop',
        tag: 'Nintendo Switch',
        desc: 'Tienda digital oficial para adquirir y descargar juegos exclusivos y DLCs de Nintendo Switch.',
        url: 'https://www.nintendo.com/store/games/',
        customIcon: (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M0 2v20h24V2H0zM9 19a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h1v14H9zm5 0V5h1a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-1zM6.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
            </svg>
        ),
        color: '#e60012',
        borderColor: '#e60012'
    },
    {
        id: 'battlenet',
        name: 'Battle.net',
        tag: 'Overwatch & Blizzard',
        desc: 'Tienda oficial de Blizzard para Overwatch 2, Diablo, World of Warcraft y Call of Duty.',
        url: 'https://shop.battle.net/',
        icon: faBattleNet,
        color: '#00aeff',
        borderColor: '#00aeff'
    },
    {
        id: 'gog',
        name: 'GOG.com',
        tag: '100% Sin DRM',
        desc: 'Plataforma oficial de CD Projekt RED con juegos clásicos y modernos libres de DRM.',
        url: 'https://www.gog.com/',
        icon: faGamepad,
        color: '#9b30ff',
        borderColor: '#9b30ff'
    },
    {
        id: 'itchio',
        name: 'Itch.io',
        tag: 'Juegos Indie & Creadores',
        desc: 'El mercado independiente líder para descubrir videojuegos indie, prototipos y apoyar creadores.',
        url: 'https://itch.io/',
        icon: faItchIo,
        color: '#fa5c5c',
        borderColor: '#fa5c5c'
    }
];

const Home: React.FC = () => {
    const [, setActiveNewsBg] = useState<string>('/Imagenes/Carrusel2.jpg');
    const [scoreboard, setScoreboard] = useState<any[]>([]);

    useEffect(() => {
        const fetchScoreboard = async () => {
            try {
                await checkAndRotateMonthlyLeaderboard(supabaseMinigames);
            } catch (e) {
                console.error("Monthly rotation check error:", e);
            }
            const { data, error } = await supabaseMinigames
                .from('profiles')
                .select('id, username, avatar_url, points, role')
                .order('points', { ascending: false })
                .limit(10);
            if (!error && data) {
                setScoreboard(data);
            }
        };

        fetchScoreboard();

        const channel = supabaseMinigames
            .channel('profiles-realtime-scoreboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    fetchScoreboard();
                }
            )
            .subscribe();

        return () => {
            supabaseMinigames.removeChannel(channel);
        };
    }, []);

    const top1 = scoreboard[0];
    const top2 = scoreboard[1];
    const top3 = scoreboard[2];
    const remainingScores = scoreboard.slice(3);

    return (
        <div className="home-wrapper">
            {/* 1. Hero Section (Arcade Cyber Style) */}
            <section className="arcade-hero">
                <div className="arcade-hero-bg" />
                <div className="arcade-hero-grid" />
                
                {/* Floating Retro Stickers */}
                <div className="hero-sticker-badge sticker-twitch">
                    LIVE ON TWITCH
                    <b>EVILTOKKII ✦</b>
                </div>
                <div className="hero-sticker-badge sticker-rewards">
                    SEASON 2026
                    <b>PUNTOS & DROPS ✦</b>
                </div>

                <div className="arcade-hero-content">
                    <div className="arcade-eyebrow">
                        <span className="pulse-dot"></span>
                        EVILTOKKII // COMMUNITY HUB 2026
                    </div>
                    
                    <h1 className="arcade-hero-title">
                        <span className="hero-title-line">
                            ENTRA POR LOS <span className="highlight-yellow">STREAMS.</span>
                        </span>
                        <span className="hero-title-line">
                            QUÉDATE POR LA <span className="highlight-cyan">COMUNIDAD.</span>
                        </span>
                    </h1>
                    
                    <p className="arcade-hero-copy">
                        Participa en dinámicas en vivo, desafía los minijuegos diarios, acumula puntos para la tienda y comparte con la mejor comunidad de Twitch.
                    </p>
                    
                    <div className="arcade-hero-actions">
                        <a 
                            className="btn-arcade-primary" 
                            href="https://www.twitch.tv/eviltokkii" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            <FontAwesomeIcon icon={faTwitch} /> VER DIRECTO EN TWITCH <FontAwesomeIcon icon={faArrowRight} />
                        </a>
                        <Link className="btn-arcade-secondary" to="/minijuegos">
                            <FontAwesomeIcon icon={faGamepad} /> JUGAR MINIJUEGOS <FontAwesomeIcon icon={faBolt} />
                        </Link>
                    </div>

                    <div className="hero-stats-row">
                        <div className="hero-stat-card hero-stat-purple">
                            <strong>✦ STREAMER CHILENA</strong>
                            <span>Gameplay, risas y las mejores charlas en directo.</span>
                        </div>
                        <div className="hero-stat-card hero-stat-pink">
                            <strong>✦ ESPACIO SEGURO</strong>
                            <span>Un canal acogedor, interactivo y lleno de buena energía.</span>
                        </div>
                        <div className="hero-stat-card hero-stat-cyan">
                            <strong>✦ EVENTOS Y SORTEOS</strong>
                            <span>Participa con tus puntos en ruletas y dinámicas exclusivas.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Marquee Ribbon (Infinite Seamless Loop) */}
            <div className="arcade-marquee" aria-hidden="true">
                <div className="arcade-marquee-track">
                    <div className="arcade-marquee-group">
                        <span>LIVE STREAM</span><b>✦</b>
                        <span>MINIJUEGOS DIARIOS</span><b>✦</b>
                        <span>SORTEOS EXCLUSIVOS</span><b>✦</b>
                        <span>TIERLISTS</span><b>✦</b>
                        <span>EVILTOKKII 2026</span><b>✦</b>
                    </div>
                    <div className="arcade-marquee-group">
                        <span>LIVE STREAM</span><b>✦</b>
                        <span>MINIJUEGOS DIARIOS</span><b>✦</b>
                        <span>SORTEOS EXCLUSIVOS</span><b>✦</b>
                        <span>TIERLISTS</span><b>✦</b>
                        <span>EVILTOKKII 2026</span><b>✦</b>
                    </div>
                    <div className="arcade-marquee-group">
                        <span>LIVE STREAM</span><b>✦</b>
                        <span>MINIJUEGOS DIARIOS</span><b>✦</b>
                        <span>SORTEOS EXCLUSIVOS</span><b>✦</b>
                        <span>TIERLISTS</span><b>✦</b>
                        <span>EVILTOKKII 2026</span><b>✦</b>
                    </div>
                    <div className="arcade-marquee-group">
                        <span>LIVE STREAM</span><b>✦</b>
                        <span>MINIJUEGOS DIARIOS</span><b>✦</b>
                        <span>SORTEOS EXCLUSIVOS</span><b>✦</b>
                        <span>TIERLISTS</span><b>✦</b>
                        <span>EVILTOKKII 2026</span><b>✦</b>
                    </div>
                </div>
            </div>

            {/* 3. Twitch Section */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>01</span> EN DIRECTO</div>
                            <h2 className="section-title-arcade">CANAL OFICIAL DE TWITCH</h2>
                        </div>
                    </div>
                    <TwitchPlayer />
                </div>
            </section>

            {/* 4. Scoreboard Section (Hall of Fame Arcade) */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>02</span> HALL OF FAME</div>
                            <h2 className="section-title-arcade">MARCADOR MENSUAL DE PUNTOS</h2>
                        </div>
                        <Link to="/minijuegos" className="btn-arcade-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                            <FontAwesomeIcon icon={faTrophy} /> GANAR PUNTOS
                        </Link>
                    </div>

                    <div className="arcade-scoreboard-card">
                        {/* Top 3 Podium */}
                        <div className="scoreboard-top3-grid">
                            {/* #2 Rank */}
                            <div className="top3-podium-card podium-rank-2">
                                <div className="podium-avatar-wrapper">
                                    <img 
                                        src={top2?.avatar_url || 'https://pub-0bf9a87cec964ff49bfd058873c948c3.r2.dev/public/logo.png'} 
                                        alt={top2?.username || 'Top 2'} 
                                        className="podium-avatar"
                                    />
                                    <span className="podium-badge-rank rank-2">#2</span>
                                </div>
                                <div className="podium-name">
                                    {top2?.username || 'Esperando...'}
                                    {renderBadge(top2?.role)}
                                </div>
                                <div className="podium-points">{top2 ? `${top2.points} Pts` : '—'}</div>
                            </div>

                            {/* #1 Rank (Crown) */}
                            <div className="top3-podium-card podium-rank-1">
                                <div className="podium-avatar-wrapper">
                                    <div className="podium-crown"><FontAwesomeIcon icon={faCrown} style={{ color: 'var(--yellow)' }} /></div>
                                    <img 
                                        src={top1?.avatar_url || 'https://pub-0bf9a87cec964ff49bfd058873c948c3.r2.dev/public/logo.png'} 
                                        alt={top1?.username || 'Top 1'} 
                                        className="podium-avatar"
                                    />
                                    <span className="podium-badge-rank rank-1">#1</span>
                                </div>
                                <div className="podium-name" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                                    {top1?.username || 'Esperando...'}
                                    {renderBadge(top1?.role)}
                                </div>
                                <div className="podium-points" style={{ fontSize: '1.2rem', color: 'var(--yellow)' }}>
                                    {top1 ? `${top1.points} Pts` : '—'}
                                </div>
                            </div>

                            {/* #3 Rank */}
                            <div className="top3-podium-card podium-rank-3">
                                <div className="podium-avatar-wrapper">
                                    <img 
                                        src={top3?.avatar_url || 'https://pub-0bf9a87cec964ff49bfd058873c948c3.r2.dev/public/logo.png'} 
                                        alt={top3?.username || 'Top 3'} 
                                        className="podium-avatar"
                                    />
                                    <span className="podium-badge-rank rank-3">#3</span>
                                </div>
                                <div className="podium-name">
                                    {top3?.username || 'Esperando...'}
                                    {renderBadge(top3?.role)}
                                </div>
                                <div className="podium-points">{top3 ? `${top3.points} Pts` : '—'}</div>
                            </div>
                        </div>

                        {/* Ranks 4 to 10 */}
                        <div className="scoreboard-list-items">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const scoreIndex = i + 3;
                                const item = scoreboard[scoreIndex];
                                return (
                                    <div key={item?.id || `rank-${scoreIndex}`} className="scoreboard-row">
                                        <div className="scoreboard-row-user">
                                            <span className="scoreboard-row-rank">#{scoreIndex + 1}</span>
                                            {item?.avatar_url ? (
                                                <img src={item.avatar_url} alt={item.username} className="scoreboard-row-avatar" />
                                            ) : (
                                                <div className="scoreboard-row-avatar" style={{ background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center' }}>
                                                    <FontAwesomeIcon icon={faStar} style={{ fontSize: '0.7rem', color: 'var(--muted)' }} />
                                                </div>
                                            )}
                                            <span className="scoreboard-row-name">
                                                {item ? item.username : <em style={{ opacity: 0.4, fontStyle: 'italic' }}>Esperando participante...</em>}
                                                {renderBadge(item?.role)}
                                            </span>
                                        </div>
                                        <span className="scoreboard-row-points">
                                            {item ? `${item.points} Pts` : '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Noticias Recientes */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>03</span> NOTICIAS</div>
                            <h2 className="section-title-arcade">NOVEDADES Y ANUNCIOS</h2>
                        </div>
                        <Link to="/noticias" className="btn-arcade-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                            VER TODAS LAS NOTICIAS <FontAwesomeIcon icon={faArrowRight} />
                        </Link>
                    </div>
                    <NewsWidget onActiveNewsChange={setActiveNewsBg} />
                </div>
            </section>

            {/* 6. Lo Más Streameado */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>04</span> CATÁLOGO DE JUEGOS</div>
                            <h2 className="section-title-arcade">LO STREMEADO ÚLTIMAMENTE</h2>
                        </div>
                    </div>
                    <MostStreamed hideHeader={true} />
                </div>
            </section>

            {/* 7. Tiendas Oficiales de Videojuegos */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>05</span> PLATAFORMAS & STORES</div>
                            <h2 className="section-title-arcade">TIENDAS OFICIALES DE VIDEOJUEGOS</h2>
                            <p style={{ color: 'var(--muted)', marginTop: '0.5rem', maxWidth: '650px' }}>
                                Adquiere tus videojuegos favoritos en sus tiendas y distribuidores oficiales de forma 100% segura y apoya a sus creadores.
                            </p>
                        </div>
                    </div>

                    <div className="stores-arcade-grid">
                        {OFFICIAL_STORES.map((store) => (
                            <div 
                                key={store.id} 
                                className="store-card-arcade" 
                                style={{ '--store-hover-border': store.borderColor } as React.CSSProperties}
                            >
                                <div>
                                    <div className="store-card-top">
                                        <div className="store-icon-box" style={{ background: store.color }}>
                                            {store.customIcon ? store.customIcon : store.icon ? <FontAwesomeIcon icon={store.icon} /> : <FontAwesomeIcon icon={faStore} />}
                                        </div>
                                        <span className="store-tag-pill">{store.tag}</span>
                                    </div>
                                    <h3 className="store-card-title">{store.name}</h3>
                                    <p className="store-card-desc">{store.desc}</p>
                                </div>
                                <a 
                                    href={store.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="store-card-btn"
                                >
                                    <FontAwesomeIcon icon={faBagShopping} /> IR A LA TIENDA <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.72rem' }} />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. Redes Sociales & Comunidad */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>06</span> COMUNIDAD</div>
                            <h2 className="section-title-arcade">ÚNETE A NUESTRAS REDES</h2>
                            <p style={{ color: 'var(--muted)', marginTop: '0.5rem', maxWidth: '600px' }}>
                                Sígueme para no perderte ningún directo, sorteo o actualización. ¡Te esperamos!
                            </p>
                        </div>
                    </div>

                    <div className="social-arcade-grid">
                        <a href="https://www.twitch.tv/eviltokkii" target="_blank" rel="noopener noreferrer" className="social-card-btn social-twitch">
                            <FontAwesomeIcon icon={faTwitch} /> Twitch
                        </a>
                        <a href="https://www.instagram.com/eviltokkii" target="_blank" rel="noopener noreferrer" className="social-card-btn social-instagram">
                            <FontAwesomeIcon icon={faInstagram} /> Instagram
                        </a>
                        <a href="https://www.tiktok.com/@eviltokkii" target="_blank" rel="noopener noreferrer" className="social-card-btn social-tiktok">
                            <FontAwesomeIcon icon={faTiktok} /> TikTok
                        </a>
                        <a href="https://x.com/EvilTokkii_" target="_blank" rel="noopener noreferrer" className="social-card-btn social-x">
                            <FontAwesomeIcon icon={faXTwitter} /> Twitter / X
                        </a>
                        <a href="https://discord.com/invite/Kxvw4KfSBF" target="_blank" rel="noopener noreferrer" className="social-card-btn social-discord">
                            <FontAwesomeIcon icon={faDiscord} /> Discord
                        </a>
                    </div>
                </div>
            </section>

            {/* 8. Privacidad & Aviso Legal */}
            <section className="arcade-section" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
                <div className="wrap">
                    <div className="arcade-privacy-banner">
                        <div style={{ textAlign: 'left', flex: '1 1 360px' }}>
                            <div className="section-tag-badge" style={{ color: 'var(--yellow)', marginBottom: '0.6rem' }}>
                                <span>🔒</span> PRIVACIDAD Y SEGURIDAD
                            </div>
                            <p style={{ margin: 0, color: '#f5e8ff', lineHeight: 1.5, fontSize: '0.94rem' }}>
                                Tus datos están seguros. Revisa cómo gestionamos el inicio de sesión con Twitch y tus derechos de privacidad.
                            </p>
                        </div>
                        <Link to="/legal?tab=privacidad" className="btn-arcade-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.88rem' }}>
                            VER POLÍTICA DE PRIVACIDAD ↗
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
