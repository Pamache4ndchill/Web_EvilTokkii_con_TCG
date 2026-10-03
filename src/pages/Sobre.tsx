import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faGamepad, faCommentDots, faStar, faCrown } from '@fortawesome/free-solid-svg-icons';
import './Home.css';
import './Sobre.css';

interface ImageConfig {
    scale: number;
    fadeTop: number;
    fadeBottom: number;
    fadeLeft: number;
    fadeRight: number;
}

const DEFAULT_CONFIG: ImageConfig = {
    scale: 1.0,
    fadeTop: 0,
    fadeBottom: 0,
    fadeLeft: 0,
    fadeRight: 0
};

const getMaskStyle = (cfg: ImageConfig): React.CSSProperties => {
    const { fadeTop, fadeBottom, fadeLeft, fadeRight } = cfg;
    if (!fadeTop && !fadeBottom && !fadeLeft && !fadeRight) {
        return {};
    }

    const vertGrad = `linear-gradient(to bottom, ${fadeTop > 0 ? `transparent 0%, black ${fadeTop}%, ` : ''}black ${100 - fadeBottom}%, transparent 100%)`;
    const horizGrad = `linear-gradient(to right, ${fadeLeft > 0 ? `transparent 0%, black ${fadeLeft}%, ` : ''}black ${100 - fadeRight}%, transparent 100%)`;

    return {
        maskImage: `${vertGrad}, ${horizGrad}`,
        WebkitMaskImage: `${vertGrad}, ${horizGrad}`,
        maskComposite: 'intersect' as const,
        WebkitMaskComposite: 'source-in' as const
    };
};

const Sobre: React.FC = () => {
    const [cfg1] = useState<ImageConfig>(() => {
        const saved = localStorage.getItem('sobre_img1_config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });
    const [cfg2] = useState<ImageConfig>(() => {
        const saved = localStorage.getItem('sobre_img2_config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });
    const [cfg3] = useState<ImageConfig>(() => {
        const saved = localStorage.getItem('sobre_img3_config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    return (
        <div className="sobre-page fade-in">
            {/* 1. Sección Sobre EvilTokkii */}
            <section className="sobre-section">
                <div className="wrap">
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <div className="sobre-grid">
                            {/* Columna Texto */}
                            <div className="sobre-col-text">
                                <div className="section-head-arcade">
                                    <div>
                                        <div className="section-tag-badge"><span>✨</span> CONÓCEME</div>
                                        <h2 className="section-title-arcade">SOBRE EVILTOKKII</h2>
                                    </div>
                                </div>

                                <div className="sobre-card">
                                    <p>
                                        ¡Hola! Soy EvilTokkii, streamer chilena y amante de los videojuegos. <FontAwesomeIcon icon={faHeart} style={{ color: 'var(--hot-pink)' }} /> Desde que descubrí el mundo del streaming en Twitch, encontré un espacio perfecto para compartir lo que más me apasiona: jugar, reír y conectar con personas que enjoyen el gaming tanto como yo.
                                    </p>
                                    <p>
                                        En mis directos suelo jugar Overwatch, donde me encanta vivir cada partida con intensidad, celebrar las buenas jugadas y también reírme de los fails. Para mí, lo importante no es solo ganar, sino disfrutar el proceso y compartir ese momento con la comunidad.
                                    </p>
                                    <p>
                                        Me gusta mantener un ambiente cercano, relajado y lleno de buena energía. Aquí siempre hay espacio para conversar, pasar un buen rato y desconectarse de la rutina. Más que un canal, quiero que sea un lugar donde todos se sientan cómodos y parte de algo. <FontAwesomeIcon icon={faCommentDots} style={{ color: 'var(--cyan)' }} />
                                    </p>
                                    <div className="sobre-card-highlight">
                                        Gracias por estar aquí y ser parte de esta aventura gamer. <FontAwesomeIcon icon={faGamepad} /> <FontAwesomeIcon icon={faStar} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Columna Imagen */}
                            <div className="sobre-col-img">
                                <img 
                                    src="/Tokkoo_1.png" 
                                    alt="EvilTokkii" 
                                    style={{
                                        ...getMaskStyle(cfg1),
                                        width: '100%',
                                        maxWidth: '440px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        transform: `scale(${cfg1.scale})`,
                                        transformOrigin: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Sección Moderadores */}
            <section className="sobre-section">
                <div className="wrap">
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <div className="sobre-grid reverse">
                            {/* Columna Texto */}
                            <div className="sobre-col-text">
                                <div className="section-head-arcade">
                                    <div>
                                        <div className="section-tag-badge"><span>👑</span> COMUNIDAD</div>
                                        <h2 className="section-title-arcade">EQUIPO DE MODERACIÓN</h2>
                                    </div>
                                </div>

                                <div className="sobre-card">
                                    <p>
                                        Detrás de cada stream hay un equipo increíble que hace que todo funcione como debe. En Twitch, el chat es una parte esencial de la experiencia, y eso no sería posible sin quienes lo cuidan día a día.
                                    </p>
                                    
                                    <div className="mod-badges-container">
                                        <div className="mod-badges-row">
                                            <span className="mod-chip mod-chip-chief">
                                                <FontAwesomeIcon icon={faCrown} /> REQUIEMAO
                                            </span>
                                            <span className="mod-chip mod-chip-chief">
                                                <FontAwesomeIcon icon={faCrown} /> NAOFUMIIVT
                                            </span>
                                            <span className="mod-chip mod-chip-chief">
                                                <FontAwesomeIcon icon={faCrown} /> NPEZE
                                            </span>
                                        </div>
                                        <div className="mod-badges-row">
                                            <span className="mod-chip mod-chip-sword">
                                                <img src="/Imagenes/Espada_Twitch_Verde.png" alt="Espada Mod" style={{ width: '0.95rem', height: '0.95rem', objectFit: 'contain' }} /> THEDRAGONBLK
                                            </span>
                                            <span className="mod-chip mod-chip-sword">
                                                <img src="/Imagenes/Espada_Twitch_Verde.png" alt="Espada Mod" style={{ width: '0.95rem', height: '0.95rem', objectFit: 'contain' }} /> ESPEEEOON
                                            </span>
                                            <span className="mod-chip mod-chip-sword">
                                                <img src="/Imagenes/Espada_Twitch_Verde.png" alt="Espada Mod" style={{ width: '0.95rem', height: '0.95rem', objectFit: 'contain' }} /> YOR737OXTON
                                            </span>
                                        </div>
                                    </div>

                                    <p>
                                        Cada uno cumple un rol fundamental manteniendo un ambiente seguro, respetuoso y amigable. Siempre atentos al chat, apoyando durante los directos y asegurándose de que la comunidad sea un espacio donde todos puedan disfrutar sin preocupaciones.
                                    </p>
                                    <p>
                                        Ser mod no es solo tener una espada junto al nombre; es compromiso, responsabilidad y mucho cariño por la comunidad. Gracias a su trabajo, este espacio sigue creciendo con buena energía, respeto y compañerismo. <FontAwesomeIcon icon={faHeart} style={{ color: 'var(--hot-pink)' }} />
                                    </p>
                                </div>
                            </div>
                            
                            {/* Columna Imagen */}
                            <div className="sobre-col-img">
                                <img 
                                    src="/Tokkoo_2.png" 
                                    alt="Moderadores" 
                                    style={{
                                        ...getMaskStyle(cfg2),
                                        width: '100%',
                                        maxWidth: '440px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        transform: `scale(${cfg2.scale})`,
                                        transformOrigin: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Sección Agradecimiento */}
            <section className="sobre-section">
                <div className="wrap">
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <div className="sobre-grid">
                            {/* Columna Texto */}
                            <div className="sobre-col-text">
                                <div className="section-head-arcade">
                                    <div>
                                        <div className="section-tag-badge"><span>💖</span> COMUNIDAD</div>
                                        <h2 className="section-title-arcade">GRACIAS POR ESTAR AQUÍ</h2>
                                    </div>
                                </div>

                                <div className="sobre-card">
                                    <p>
                                        Este canal es un proyecto hecho con muchísimo amor y dedicación. Cada directo y cada idea existen gracias a ustedes.
                                    </p>
                                    <p>
                                        Hoy más que nunca necesitamos su apoyo para seguir creciendo y trayéndoles cosas bonitas y entretenidas.
                                    </p>
                                    <p>
                                        Gracias por estar, por acompañar y por creer en este espacio.
                                    </p>
                                    <div className="sobre-card-highlight sobre-highlight-single">
                                        EVILTOKKII TAMBIÉN ES DE USTEDES &lt;3
                                    </div>
                                </div>
                            </div>

                            {/* Columna Imagen */}
                            <div className="sobre-col-img">
                                <img 
                                    src="/Tokkoo_3.png" 
                                    alt="Agradecimiento" 
                                    style={{
                                        ...getMaskStyle(cfg3),
                                        width: '100%',
                                        maxWidth: '440px',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        transform: `scale(${cfg3.scale})`,
                                        transformOrigin: 'center'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Sobre;
