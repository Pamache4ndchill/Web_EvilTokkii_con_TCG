import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faGamepad, faCommentDots, faStar, faCrown, faSlidersH, faTimes, faCopy, faCheck, faUndo } from '@fortawesome/free-solid-svg-icons';
import './Home.css';
import './Sobre.css';

interface ImageConfig {
    scale: number;
    offsetX: number;
    offsetY: number;
    fadeTop: number;
    fadeBottom: number;
    fadeLeft: number;
    fadeRight: number;
    maxHeight: number;
}

type ConfigMap = { [key: string]: ImageConfig };

const DEFAULT_CONFIGS: ConfigMap = {
    img1: {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        fadeTop: 3,
        fadeBottom: 25,
        fadeLeft: 3,
        fadeRight: 3,
        maxHeight: 620
    },
    img2: {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        fadeTop: 3,
        fadeBottom: 25,
        fadeLeft: 3,
        fadeRight: 3,
        maxHeight: 620
    },
    img3: {
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        fadeTop: 3,
        fadeBottom: 25,
        fadeLeft: 3,
        fadeRight: 3,
        maxHeight: 620
    }
};

const getImageStyle = (cfg: ImageConfig): React.CSSProperties => {
    const vertGrad = `linear-gradient(to bottom, ${cfg.fadeTop > 0 ? `transparent 0%, black ${cfg.fadeTop}%, ` : ''}black ${100 - cfg.fadeBottom}%, transparent 100%)`;
    const horizGrad = `linear-gradient(to right, ${cfg.fadeLeft > 0 ? `transparent 0%, black ${cfg.fadeLeft}%, ` : ''}black ${100 - cfg.fadeRight}%, transparent 100%)`;

    return {
        maskImage: `${vertGrad}, ${horizGrad}`,
        WebkitMaskImage: `${vertGrad}, ${horizGrad}`,
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
        transform: `translate(${cfg.offsetX}px, ${cfg.offsetY}px) scale(${cfg.scale})`,
        transformOrigin: 'center center',
        maxHeight: `${cfg.maxHeight}px`,
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain'
    };
};

const Sobre: React.FC = () => {
    const [configs, setConfigs] = useState<ConfigMap>(() => {
        try {
            const saved = localStorage.getItem('sobre_tuning_v1');
            return saved ? { ...DEFAULT_CONFIGS, ...JSON.parse(saved) } : DEFAULT_CONFIGS;
        } catch {
            return DEFAULT_CONFIGS;
        }
    });

    const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'img1' | 'img2' | 'img3'>('img1');
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        localStorage.setItem('sobre_tuning_v1', JSON.stringify(configs));
    }, [configs]);

    const updateCurrent = (key: keyof ImageConfig, value: number) => {
        setConfigs((prev) => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [key]: value
            }
        }));
    };

    const resetCurrent = () => {
        setConfigs((prev) => ({
            ...prev,
            [activeTab]: { ...DEFAULT_CONFIGS[activeTab] }
        }));
    };

    const copyToClipboard = () => {
        const text = JSON.stringify(configs, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const currentCfg = configs[activeTab] || DEFAULT_CONFIGS[activeTab];

    return (
        <div className="sobre-page fade-in">
            {/* 1. Sección Sobre EvilTokkii */}
            <section className="sobre-section">
                <div className="wrap">
                    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
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
                                <div className="sobre-img-wrapper">
                                    <img 
                                        src="/Tokkoo_1.png" 
                                        alt="EvilTokkii" 
                                        className="sobre-img"
                                        style={getImageStyle(configs.img1)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Sección Moderadores */}
            <section className="sobre-section">
                <div className="wrap">
                    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
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
                                <div className="sobre-img-wrapper">
                                    <img 
                                        src="/Tokkoo_2.png" 
                                        alt="Moderadores" 
                                        className="sobre-img"
                                        style={getImageStyle(configs.img2)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Sección Agradecimiento */}
            <section className="sobre-section">
                <div className="wrap">
                    <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
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
                                <div className="sobre-img-wrapper">
                                    <img 
                                        src="/Tokkoo_3.png" 
                                        alt="Agradecimiento" 
                                        className="sobre-img"
                                        style={getImageStyle(configs.img3)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Panel Flotante de Ajuste Visual en Vivo */}
            <div className={`sobre-tuner-dock ${isPanelOpen ? 'open' : 'closed'}`}>
                {!isPanelOpen ? (
                    <button 
                        className="tuner-toggle-btn"
                        onClick={() => setIsPanelOpen(true)}
                        title="Abrir ajustador de escala y degradado"
                    >
                        <FontAwesomeIcon icon={faSlidersH} /> AJUSTAR IMÁGENES LIVE
                    </button>
                ) : (
                    <div className="tuner-panel-card">
                        <div className="tuner-header">
                            <div className="tuner-title">
                                <FontAwesomeIcon icon={faSlidersH} style={{ color: 'var(--yellow)' }} />
                                <span>AJUSTADOR VISUAL DE IMÁGENES</span>
                            </div>
                            <button 
                                className="tuner-close-btn"
                                onClick={() => setIsPanelOpen(false)}
                                title="Minimizar panel"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Pestañas de Imágenes */}
                        <div className="tuner-tabs">
                            <button 
                                className={`tuner-tab ${activeTab === 'img1' ? 'active' : ''}`}
                                onClick={() => setActiveTab('img1')}
                            >
                                1. Sobre Mí
                            </button>
                            <button 
                                className={`tuner-tab ${activeTab === 'img2' ? 'active' : ''}`}
                                onClick={() => setActiveTab('img2')}
                            >
                                2. Moderadores
                            </button>
                            <button 
                                className={`tuner-tab ${activeTab === 'img3' ? 'active' : ''}`}
                                onClick={() => setActiveTab('img3')}
                            >
                                3. Agradecimiento
                            </button>
                        </div>

                        {/* Controles Deslizantes */}
                        <div className="tuner-controls-body">
                            {/* Escala */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>🔍 Escala (Zoom)</span>
                                    <b>{currentCfg.scale.toFixed(2)}x</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2.0" 
                                    step="0.02"
                                    value={currentCfg.scale} 
                                    onChange={(e) => updateCurrent('scale', parseFloat(e.target.value))}
                                />
                            </div>

                            {/* Altura Máxima */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>📐 Altura Máxima (px)</span>
                                    <b>{currentCfg.maxHeight}px</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="350" 
                                    max="850" 
                                    step="10"
                                    value={currentCfg.maxHeight} 
                                    onChange={(e) => updateCurrent('maxHeight', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Offset Y */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>↕️ Posición Vertical (Y)</span>
                                    <b>{currentCfg.offsetY}px</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="-150" 
                                    max="150" 
                                    step="2"
                                    value={currentCfg.offsetY} 
                                    onChange={(e) => updateCurrent('offsetY', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Offset X */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>↔️ Posición Horizontal (X)</span>
                                    <b>{currentCfg.offsetX}px</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="-150" 
                                    max="150" 
                                    step="2"
                                    value={currentCfg.offsetX} 
                                    onChange={(e) => updateCurrent('offsetX', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Degradado Inferior */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>🌊 Degradado Inferior (Fade)</span>
                                    <b>{currentCfg.fadeBottom}%</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="60" 
                                    step="1"
                                    value={currentCfg.fadeBottom} 
                                    onChange={(e) => updateCurrent('fadeBottom', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Degradado Superior */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>☁️ Degradado Superior (Fade)</span>
                                    <b>{currentCfg.fadeTop}%</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    step="1"
                                    value={currentCfg.fadeTop} 
                                    onChange={(e) => updateCurrent('fadeTop', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Degradado Izquierdo */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>👈 Degradado Izquierdo</span>
                                    <b>{currentCfg.fadeLeft}%</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    step="1"
                                    value={currentCfg.fadeLeft} 
                                    onChange={(e) => updateCurrent('fadeLeft', parseInt(e.target.value))}
                                />
                            </div>

                            {/* Degradado Derecho */}
                            <div className="tuner-field">
                                <div className="tuner-field-label">
                                    <span>👉 Degradado Derecho</span>
                                    <b>{currentCfg.fadeRight}%</b>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    step="1"
                                    value={currentCfg.fadeRight} 
                                    onChange={(e) => updateCurrent('fadeRight', parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="tuner-footer-actions">
                            <button 
                                className="tuner-btn-action btn-copy"
                                onClick={copyToClipboard}
                            >
                                <FontAwesomeIcon icon={copied ? faCheck : faCopy} /> {copied ? '¡Copiado!' : 'Copiar Parámetros'}
                            </button>
                            <button 
                                className="tuner-btn-action btn-reset"
                                onClick={resetCurrent}
                                title="Restablecer valores iniciales"
                            >
                                <FontAwesomeIcon icon={faUndo} /> Restablecer
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sobre;


