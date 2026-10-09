import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NewsWidget from '../components/NewsWidget';
import TwitchPlayer from '../components/TwitchPlayer';
import MostStreamed from '../components/MostStreamed';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitch, faInstagram, faTiktok, faXTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faGamepad, faTrophy, faCrown, faArrowRight, faBolt, faStar, faStore, faArrowUpRightFromSquare, faBagShopping, faFilm } from '@fortawesome/free-solid-svg-icons';
import { supabaseMinigames } from '../lib/supabase';
import { checkAndRotateMonthlyLeaderboard } from '../utils/monthlyRotation';
import { renderBadge } from '../components/UserRoleBadge';
import './Home.Socials.css';
import './Home.css';

const STREAMING_PLATFORMS = [
    {
        id: 'crunchyroll',
        name: 'Crunchyroll',
        tag: 'Anime & Manga Oficial',
        desc: 'Líder mundial de streaming de anime con simulcasts directos de Japón, doblaje latino y catálogo de manga.',
        url: 'https://www.crunchyroll.com/',
        logoUrl: '/logos/streaming/Crunchyroll.jpg',
        color: '#f47521',
        borderColor: '#f47521'
    },
    {
        id: 'netflix',
        name: 'Netflix',
        tag: 'Anime, Películas & Series',
        desc: 'Producciones originales de anime, series internacionales aclamadas, películas de estreno y animación global.',
        url: 'https://www.netflix.com/',
        logoUrl: '/logos/streaming/Netflix.jpg',
        color: '#e50914',
        borderColor: '#e50914'
    },
    {
        id: 'primevideo',
        name: 'Prime Video',
        tag: 'Cine, Series & Anime',
        desc: 'Películas taquilleras, producciones Amazon Originals y películas y series de anime destacadas.',
        url: 'https://www.primevideo.com/',
        logoUrl: '/logos/streaming/PrimeVideo.jpg',
        color: '#00a8e1',
        borderColor: '#00a8e1'
    },
    {
        id: 'disneyplus',
        name: 'Disney+',
        tag: 'Disney, Marvel & Anime',
        desc: 'Catálogo de Disney, Pixar, Marvel, Star Wars y estrenos mundiales exclusivos de anime (Bleach TYBW, etc.).',
        url: 'https://www.disneyplus.com/',
        logoUrl: '/logos/streaming/DisneyPlus.jpg',
        color: '#113ccf',
        borderColor: '#113ccf'
    },
    {
        id: 'max',
        name: 'Max',
        tag: 'HBO, Warner & Animación',
        desc: 'Cine de Warner Bros, series de HBO, películas de Studio Ghibli, DC Universe y animación de Adult Swim.',
        url: 'https://www.max.com/',
        logoUrl: '/logos/streaming/Max.jpg',
        color: '#002be7',
        borderColor: '#002be7'
    },
    {
        id: 'plutotv',
        name: 'Pluto TV',
        tag: 'Streaming 100% Gratis',
        desc: 'Televisión y streaming online gratuito y legal con canales temáticos 24/7 de anime, cine retro y series.',
        url: 'https://pluto.tv/',
        logoUrl: '/logos/streaming/Plutotv.jpg',
        color: '#ffff00',
        borderColor: '#ffff00'
    }
];

const OFFICIAL_STORES = [
    {
        id: 'steam',
        name: 'Steam',
        tag: 'PC & Steam Deck',
        desc: 'La plataforma líder de distribución digital para PC, con ofertas de temporada y comunidad.',
        url: 'https://store.steampowered.com/',
        logoUrl: '/logos/Steam.jpg',
        color: '#1a9fff',
        borderColor: '#1a9fff'
    },
    {
        id: 'epic',
        name: 'Epic Games Store',
        tag: 'PC & Juegos Gratis',
        desc: 'Juegos gratuitos cada semana, lanzamientos exclusivos y catálogo digital para PC y Mac.',
        url: 'https://store.epicgames.com/',
        logoUrl: '/logos/Epic.jpg',
        color: '#0078f2',
        borderColor: '#0078f2'
    },
    {
        id: 'playstation',
        name: 'PlayStation Store',
        tag: 'PS5 & PS4',
        desc: 'Catálogo oficial de PlayStation para PS5 y PS4, expansiones y suscripciones PlayStation Plus.',
        url: 'https://store.playstation.com/',
        logoUrl: '/logos/Playstation.jpg',
        color: '#0070d1',
        borderColor: '#0070d1'
    },
    {
        id: 'xbox',
        name: 'Xbox & Game Pass',
        tag: 'Xbox Series & PC',
        desc: 'Tienda oficial de Microsoft, cientos de juegos con Game Pass y compatibilidad en la nube.',
        url: 'https://www.xbox.com/games/store',
        logoUrl: '/logos/Xbox.jpg',
        color: '#107c10',
        borderColor: '#107c10'
    },
    {
        id: 'nintendo',
        name: 'Nintendo eShop',
        tag: 'Nintendo Switch',
        desc: 'Tienda digital oficial para adquirir y descargar juegos exclusivos y DLCs de Nintendo Switch.',
        url: 'https://www.nintendo.com/store/games/',
        logoUrl: '/logos/Nintendo.jpg',
        color: '#e60012',
        borderColor: '#e60012'
    },
    {
        id: 'battlenet',
        name: 'Battle.net',
        tag: 'Overwatch & Blizzard',
        desc: 'Tienda oficial de Blizzard para Overwatch 2, Diablo, World of Warcraft y Call of Duty.',
        url: 'https://shop.battle.net/',
        logoUrl: '/logos/Battle.net.jpg',
        color: '#00aeff',
        borderColor: '#00aeff'
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

            {/* 6. Plataformas Oficiales de Streaming (Anime, Películas y Series) */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>04</span> STREAMING & CINE</div>
                            <h2 className="section-title-arcade">CANALES OFICIALES DE STREAMING</h2>
                            <p style={{ color: 'var(--muted)', marginTop: '0.5rem', maxWidth: '680px' }}>
                                Disfruta de tus animes, películas y series favoritas de forma 100% legal en las principales plataformas oficiales y apoya a la industria de la animación y el cine.
                            </p>
                        </div>
                    </div>

                    <div className="streaming-arcade-grid">
                        {STREAMING_PLATFORMS.map((platform) => (
                            <div 
                                key={platform.id} 
                                className="streaming-card-arcade" 
                                style={{ '--store-hover-border': platform.borderColor } as React.CSSProperties}
                            >
                                <div className="streaming-card-main">
                                    <div className="streaming-icon-box" style={{ background: platform.color }}>
                                        <img 
                                            src={platform.logoUrl} 
                                            alt={`${platform.name} Logo`} 
                                            className="streaming-icon-img"
                                        />
                                    </div>
                                    <div className="streaming-card-content-col">
                                        <span className="store-tag-pill">{platform.tag}</span>
                                        <h3 className="streaming-card-title">{platform.name}</h3>
                                        <p className="streaming-card-desc">{platform.desc}</p>
                                    </div>
                                </div>
                                <a 
                                    href={platform.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="store-card-btn"
                                >
                                    <FontAwesomeIcon icon={faFilm} /> VER CATÁLOGO <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.72rem' }} />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Lo Más Streameado */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>05</span> CATÁLOGO DE JUEGOS</div>
                            <h2 className="section-title-arcade">LO STREMEADO ÚLTIMAMENTE</h2>
                        </div>
                    </div>
                    <MostStreamed hideHeader={true} />
                </div>
            </section>

            {/* 8. Tiendas Oficiales de Videojuegos */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>06</span> PLATAFORMAS & STORES</div>
                            <h2 className="section-title-arcade">TIENDAS OFICIALES DE VIDEOJUEGOS</h2>
                            <p style={{ color: 'var(--muted)', marginTop: '0.5rem', maxWidth: '650px' }}>
                                Adquiere tus videojuegos favoritos en sus tiendas y distribuidores oficiales de forma 100% segura y apoya a sus creadores.
                            </p>
                        </div>
                    </div>

                    <div className="streaming-arcade-grid">
                        {OFFICIAL_STORES.map((store) => (
                            <div 
                                key={store.id} 
                                className="streaming-card-arcade" 
                                style={{ '--store-hover-border': store.borderColor } as React.CSSProperties}
                            >
                                <div className="streaming-card-main">
                                    <div className="streaming-icon-box" style={{ background: store.color }}>
                                        <img src={store.logoUrl} alt={store.name} className="streaming-icon-img" />
                                    </div>
                                    <div className="streaming-card-content-col">
                                        <span className="store-tag-pill">{store.tag}</span>
                                        <h3 className="streaming-card-title">{store.name}</h3>
                                        <p className="streaming-card-desc">{store.desc}</p>
                                    </div>
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

            {/* 9. Redes Sociales & Comunidad */}
            <section className="arcade-section">
                <div className="wrap">
                    <div className="section-head-arcade">
                        <div>
                            <div className="section-tag-badge"><span>07</span> COMUNIDAD</div>
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
