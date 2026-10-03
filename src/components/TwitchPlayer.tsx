import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';
import { faPlay, faCircleInfo, faArrowUpRightFromSquare, faStar } from '@fortawesome/free-solid-svg-icons';
import './TwitchPlayer.css';

interface ChannelInfo {
    login: string;
    displayName: string;
    isLive: boolean;
    title?: string;
    lastVideoId?: string;
    offlineImageURL?: string;
}

const TwitchPlayer = () => {
    const [channel, setChannel] = useState<ChannelInfo>({
        login: 'eviltokkii',
        displayName: 'EvilTokkii',
        isLive: false,
        offlineImageURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/b3c91ade-fa72-4deb-b8e7-8effeef94d1a-channel_offline_image-1920x1080.png'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('https://gql.twitch.tv/gql', {
                    method: 'POST',
                    headers: {
                        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `
                            query {
                                user(login: "eviltokkii") {
                                    displayName
                                    offlineImageURL
                                    stream {
                                        id
                                        title
                                        viewersCount
                                        game {
                                            name
                                        }
                                    }
                                    videos(first: 1, type: ARCHIVE) {
                                        edges {
                                            node {
                                                id
                                                title
                                            }
                                        }
                                    }
                                }
                            }
                        `
                    })
                });

                const json = await response.json();
                const user = json?.data?.user;
                if (user) {
                    const stream = user.stream;
                    const lastVideo = user.videos?.edges?.[0]?.node;
                    const displayName = user.displayName || 'EvilTokkii';
                    const offlineImageURL = user.offlineImageURL || 'https://static-cdn.jtvnw.net/jtv_user_pictures/b3c91ade-fa72-4deb-b8e7-8effeef94d1a-channel_offline_image-1920x1080.png';

                    if (stream) {
                        setChannel({
                            login: 'eviltokkii',
                            displayName,
                            isLive: true,
                            title: stream.title,
                            offlineImageURL
                        });
                    } else {
                        setChannel({
                            login: 'eviltokkii',
                            displayName,
                            isLive: false,
                            lastVideoId: lastVideo?.id,
                            title: lastVideo ? `${lastVideo.title}` : undefined,
                            offlineImageURL
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching Twitch status from GQL:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    let twitchUrl = '';
    let showOfflineImage = false;

    if (channel.isLive) {
        twitchUrl = `https://player.twitch.tv/?channel=eviltokkii&parent=${hostname}&parent=tokkii.online&parent=localhost&parent=127.0.0.1&autoplay=true&muted=true`;
    } else {
        showOfflineImage = true;
    }

    if (loading) {
        return (
            <div className="arcade-twitch-wrapper">
                <div className="arcade-twitch-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--yellow)', fontFamily: 'var(--font-display)', margin: 0 }}>
                        ✦ CONECTANDO CON TWITCH...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="arcade-twitch-wrapper">
            <div className="arcade-twitch-card">
                <div className="arcade-twitch-grid">
                    {/* Lado Izquierdo: Información y Acciones */}
                    <div className="arcade-twitch-info">
                        <div className={`arcade-twitch-badge ${channel.isLive ? 'badge-online' : 'badge-offline'}`}>
                            <span className="status-dot"></span>
                            {channel.isLive ? 'EN VIVO AHORA' : 'CANAL OFFLINE'}
                        </div>

                        <h2 className="arcade-twitch-title">
                            <span className="title-top-label">LIVE ON TWITCH</span>
                            <span className="title-highlight-name">
                                {channel.displayName.toUpperCase()} <FontAwesomeIcon icon={faStar} className="star-icon" />
                            </span>
                        </h2>

                        <div className="arcade-twitch-desc-box">
                            <p>
                                <strong>{channel.isLive ? 'Transmitiendo ahora:' : 'Último stream:'}</strong>{' '}
                                {channel.title || 'Disfruta de los directos, dinámicas y momentos divertidos en comunidad.'}
                            </p>
                        </div>

                        <a
                            href={`https://www.twitch.tv/eviltokkii`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="arcade-twitch-btn"
                        >
                            <FontAwesomeIcon icon={faTwitch} /> IR AL CANAL DE TWITCH <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: '0.85em' }} />
                        </a>

                        <span className="arcade-twitch-note">
                            <FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: '4px' }} />
                            Si el reproductor en vivo no inicia automáticamente, asegúrate de activar permisos de audio/video.
                        </span>
                    </div>

                    {/* Lado Derecho: Pantalla de Stream / Offline Banner */}
                    <div className="arcade-screen-frame">
                        {showOfflineImage ? (
                            <a
                                href={`https://www.twitch.tv/eviltokkii`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="arcade-offline-preview"
                                title="Ver canal de Twitch"
                            >
                                <img
                                    src={channel.offlineImageURL || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"}
                                    alt={`${channel.displayName} Offline`}
                                    className="arcade-offline-img"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80";
                                    }}
                                />
                                <div className="arcade-offline-overlay">
                                    <div className="arcade-play-badge">
                                        <FontAwesomeIcon icon={faPlay} />
                                    </div>
                                    <span className="arcade-offline-label">VER EN TWITCH</span>
                                </div>
                            </a>
                        ) : (
                            <iframe
                                src={twitchUrl}
                                allowFullScreen
                                className="arcade-twitch-iframe"
                                title="EvilTokkii Twitch Live Stream"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TwitchPlayer;